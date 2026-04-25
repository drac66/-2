// aiChat 云函数
const cloud = require('wx-server-sdk');
const https = require('https');
const { Document, Packer, Paragraph, TextRun } = require('docx');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

const ALLOWED = {
  odwpk3URVeGOtpsBIALGCfDxnAu0: 'owner',
  odwpk3XulKP3Bq5AdkJRzn42Oabs: 'partner'
};

function auth() {
  const { OPENID } = cloud.getWXContext();
  if (!OPENID) return null;
  const role = ALLOWED[OPENID] || '';
  if (!role) return null;
  return { openid: OPENID, role };
}

function requestJson(url, method, headers, bodyObj) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const body = bodyObj ? JSON.stringify(bodyObj) : '';
    const req = https.request({
      protocol: u.protocol,
      hostname: u.hostname,
      port: u.port || (u.protocol === 'https:' ? 443 : 80),
      path: `${u.pathname}${u.search}`,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        Accept: 'application/json',
        'User-Agent': 'OpenClaw-MiniProgram/aiChat',
        ...headers
      },
      timeout: 30000
    }, (res) => {
      let raw = '';
      res.on('data', (d) => { raw += d; });
      res.on('end', () => {
        try {
          const parsed = raw ? JSON.parse(raw) : {};
          resolve({ status: res.statusCode || 0, data: parsed, raw });
        } catch (e) {
          resolve({ status: res.statusCode || 0, data: null, raw });
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => req.destroy(new Error('request timeout')));
    if (body) req.write(body);
    req.end();
  });
}

async function requestJsonWithRetry(url, method, headers, bodyObj, retry = 1) {
  let lastErr = null;
  for (let i = 0; i <= retry; i++) {
    try {
      const resp = await requestJson(url, method, headers, bodyObj);
      if (resp.status >= 200 && resp.status < 300) return resp;
      if (resp.status >= 500 && i < retry) {
        await new Promise((r) => setTimeout(r, 450));
        continue;
      }
      return resp;
    } catch (e) {
      lastErr = e;
      if (i < retry) {
        await new Promise((r) => setTimeout(r, 450));
        continue;
      }
    }
  }
  throw lastErr || new Error('request failed');
}

function guessNameFromFileID(fileID) {
  const part = String(fileID || '').split('/').pop() || 'file';
  return part.replace(/^\d+_/, '') || part;
}

async function buildFileHints(fileIDs) {
  if (!Array.isArray(fileIDs) || !fileIDs.length) return [];
  const temp = await cloud.getTempFileURL({ fileList: fileIDs });
  return (temp.fileList || []).map((f) => ({
    fileID: f.fileID,
    tempFileURL: f.tempFileURL || '',
    name: guessNameFromFileID(f.fileID)
  }));
}

async function refreshMessageFiles(rows) {
  const allFileIDs = [];
  (rows || []).forEach((m) => {
    (m.files || []).forEach((f) => {
      if (f && f.fileID) allFileIDs.push(f.fileID);
    });
  });

  const uniq = [...new Set(allFileIDs)];
  if (!uniq.length) return rows || [];

  let tempMap = {};
  try {
    const temp = await cloud.getTempFileURL({ fileList: uniq });
    tempMap = (temp.fileList || []).reduce((acc, it) => {
      acc[it.fileID] = it.tempFileURL || '';
      return acc;
    }, {});
  } catch (e) {
    tempMap = {};
  }

  return (rows || []).map((m) => ({
    ...m,
    files: (m.files || []).map((f) => ({
      ...f,
      name: f.name || guessNameFromFileID(f.fileID),
      tempFileURL: tempMap[f.fileID] || f.tempFileURL || ''
    }))
  }));
}

async function createTextFile(openid, text, ext = 'txt') {
  const body = String(text || '').trim();
  if (!body) throw new Error('empty text');

  const now = Date.now();
  const safeExt = (ext || 'txt').toLowerCase() === 'docx' ? 'docx' : 'txt';
  const filename = `gpt_reply_${now}.${safeExt}`;
  const cloudPath = `ai-output/${openid}/${filename}`;

  let fileContent;
  if (safeExt === 'docx') {
    const lines = body.split(/\r?\n/);
    const doc = new Document({
      sections: [{
        properties: {},
        children: lines.map((line) => new Paragraph({
          children: [new TextRun(line || ' ')]
        }))
      }]
    });
    fileContent = await Packer.toBuffer(doc);
  } else {
    fileContent = Buffer.from(body, 'utf8');
  }

  const up = await cloud.uploadFile({ cloudPath, fileContent });
  const fileID = up.fileID;
  const temp = await cloud.getTempFileURL({ fileList: [fileID] });
  const tempUrl = ((temp.fileList || [])[0] || {}).tempFileURL || '';

  return { fileID, tempFileURL: tempUrl, name: filename };
}

exports.main = async (event) => {
  const userAuth = auth();
  if (!userAuth) return { success: false, message: 'unauthorized', data: null };

  const { action = 'chat', message = '', fileIDs = [], text = '', format = '' } = event || {};
  const { openid } = userAuth;

  if (action === 'list') {
    const r = await db.collection('ai_messages').where({ owner: openid }).orderBy('created_at', 'asc').limit(200).get();
    const rows = await refreshMessageFiles(r.data || []);
    return { success: true, message: 'ok', data: rows };
  }

  if (action === 'exportTxt') {
    const body = String(text || '').trim();
    if (!body) return { success: false, message: 'text required', data: null };

    const ext = String(format || '').toLowerCase() === 'docx' ? 'docx' : 'txt';
    const file = await createTextFile(openid, body, ext);

    await db.collection('ai_messages').add({
      data: {
        owner: openid,
        role: 'assistant',
        content: `已生成${ext.toUpperCase()}文件，可点击下方文件卡片打开/下载。`,
        files: [file],
        created_at: new Date()
      }
    });

    return { success: true, message: 'ok', data: file };
  }

  const userText = String(message || '').trim();
  if (!userText && (!Array.isArray(fileIDs) || !fileIDs.length)) {
    return { success: false, message: 'message or file required', data: null };
  }

  const fileHints = await buildFileHints(fileIDs).catch(() => []);

  await db.collection('ai_messages').add({
    data: {
      owner: openid,
      role: 'user',
      content: userText,
      files: fileHints,
      created_at: new Date()
    }
  });

  const baseUrl = process.env.AI_BASE_URL || 'https://cmdme.cn';
  const apiKey = process.env.AI_API_KEY || '';
  const model = process.env.AI_MODEL || 'gpt-5.3-codex';

  if (!apiKey) return { success: false, message: 'AI_API_KEY missing', data: null };

  const recent = await db.collection('ai_messages').where({ owner: openid }).orderBy('created_at', 'desc').limit(20).get();
  const history = (recent.data || []).reverse();

  const messages = [
    { role: 'system', content: '你是小程序里的私人AI助手。回答简洁、可靠。用户上传文件时，优先基于文件提示给出可执行建议。' },
    ...history.map((m) => {
      const fileText = (m.files || []).length
        ? `\n\n用户上传文件（临时链接，可能过期）:\n${m.files.map((f) => `- ${f.tempFileURL || f.fileID}`).join('\n')}`
        : '';
      return {
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: `${m.content || ''}${fileText}`.trim()
      };
    })
  ];

  const base = String(baseUrl || '').replace(/\/$/, '');
  const endpointCandidates = /\/v1$/i.test(base)
    ? [
      `${base}/chat/completions`,
      `${base.replace(/\/v1$/i, '')}/v1/chat/completions`,
      `${base.replace(/\/v1$/i, '')}/chat/completions`
    ]
    : [
      `${base}/v1/chat/completions`,
      `${base}/chat/completions`
    ];

  let resp = null;
  let usedEndpoint = '';
  for (const ep of endpointCandidates) {
    usedEndpoint = ep;
    resp = await requestJsonWithRetry(
      ep,
      'POST',
      { Authorization: `Bearer ${apiKey}` },
      { model, messages, temperature: 0.7 },
      1
    );
    if (resp.status !== 404) break;
  }

  if (!resp || resp.status < 200 || resp.status >= 300) {
    const detail = {
      endpoint: usedEndpoint,
      ...(resp && resp.data ? resp.data : {}),
      ...(resp && !resp.data ? { raw: String(resp.raw || '').slice(0, 500) } : {})
    };
    return { success: false, message: `ai http ${resp ? resp.status : 'unknown'}`, data: detail };
  }

  const answer = (((resp.data || {}).choices || [])[0] || {}).message?.content || '（无回复）';

  await db.collection('ai_messages').add({
    data: {
      owner: openid,
      role: 'assistant',
      content: answer,
      files: [],
      created_at: new Date()
    }
  });

  return { success: true, message: 'ok', data: { reply: answer } };
};
