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

function extractDirectFileIntent(text) {
  const s = String(text || '').trim();
  if (!s) return null;

  const trigger = /(发|生成|做|给我).*(文件|文档|word|docx)/i.test(s);
  if (!trigger) return null;

  // 支持：内容为xxx / 内容是xxx / 内容仅“xxx” / 内容:xxx
  let content = '';
  const contentMatch = s.match(/内容(?:为|是|仅|：|:)\s*([\s\S]+)$/i);
  if (contentMatch) {
    content = String(contentMatch[1] || '').trim();
  }

  // 优先提取中文引号/英文引号中的内容
  if (!content) {
    const quote = s.match(/[“"']([^“”"'\n]{1,200})[”"']/);
    if (quote) content = String(quote[1] || '').trim();
  }

  if (!content) return null;

  const nameMatch = s.match(/(?:名字|文件名)(?:叫|为|是|：|:)\s*([^\n，。,.]+)/i);
  const filename = nameMatch ? nameMatch[1].trim() : '';

  return { content, filename, format: 'docx' };
}

function sanitizeBaseName(name) {
  const base = String(name || '').trim().replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, '_');
  return base.slice(0, 64);
}

function hhmmNow() {
  const d = new Date();
  const hh = `${d.getHours()}`.padStart(2, '0');
  const mm = `${d.getMinutes()}`.padStart(2, '0');
  return `${hh}${mm}`;
}

function stripUrls(text) {
  return String(text || '').replace(/https?:\/\/[^\s]+/g, '【链接已隐藏，请点下方文件卡片】');
}

function firstUrl(text) {
  const m = String(text || '').match(/https?:\/\/[^\s]+/);
  return m ? m[0] : '';
}

async function getNickname(openid) {
  try {
    const r = await db.collection('users').where({ openid }).limit(1).get();
    const u = (r.data && r.data[0]) || null;
    return (u && u.nickname) || '';
  } catch (e) {
    return '';
  }
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

async function createTextFile(openid, text, customBaseName = '') {
  const body = String(text || '').trim();
  if (!body) throw new Error('empty text');

  const safeExt = 'docx';

  let baseName = sanitizeBaseName(customBaseName);
  if (!baseName) {
    const nick = sanitizeBaseName(await getNickname(openid)) || '用户';
    baseName = `${nick}_${hhmmNow()}`;
  }

  const filename = `${baseName}.${safeExt}`;
  const cloudPath = `ai-output/${openid}/${Date.now()}_${filename}`;

  let fileContent;
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

  const up = await cloud.uploadFile({ cloudPath, fileContent });
  const fileID = up.fileID;
  const temp = await cloud.getTempFileURL({ fileList: [fileID] });
  const tempUrl = ((temp.fileList || [])[0] || {}).tempFileURL || '';

  return { fileID, tempFileURL: tempUrl, name: filename, sourceText: body, baseName };
}

exports.main = async (event) => {
  const userAuth = auth();
  if (!userAuth) return { success: false, message: 'unauthorized', data: null };

  const { action = 'chat', message = '', fileIDs = [], text = '', format = '', filename = '' } = event || {};
  const { openid } = userAuth;

  if (action === 'list') {
    const r = await db.collection('ai_messages').where({ owner: openid }).orderBy('created_at', 'asc').limit(200).get();
    const rows = await refreshMessageFiles(r.data || []);
    return { success: true, message: 'ok', data: rows };
  }

  if (action === 'regenerateFile') {
    const targetFileID = String((event || {}).fileID || '').trim();

    const r = await db.collection('ai_messages')
      .where({ owner: openid })
      .orderBy('created_at', 'desc')
      .limit(80)
      .get();

    const rows = r.data || [];
    let hit = null;

    if (targetFileID) {
      hit = rows.find((m) => (m.files || []).some((f) => f.fileID === targetFileID)) || null;
    }
    if (!hit) {
      // 兜底：找最近一条带 sourceText 的文件消息
      hit = rows.find((m) => (m.files || []).some((f) => f && f.sourceText)) || null;
    }

    if (!hit) return { success: false, message: '未找到可重生成的文件', data: null };

    const old = targetFileID
      ? ((hit.files || []).find((f) => f.fileID === targetFileID) || null)
      : ((hit.files || []).find((f) => f && f.sourceText) || null);

    if (!old || !old.sourceText) return { success: false, message: '缺少源内容，无法重生成', data: null };

    const file = await createTextFile(openid, old.sourceText, old.baseName || old.name || '文件');

    await db.collection('ai_messages').add({
      data: {
        owner: openid,
        role: 'assistant',
        content: '文件已重新生成，点下方卡片打开。',
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

  // 直出文件意图：不走模型自由发挥，按用户内容原样生成
  const directIntent = extractDirectFileIntent(userText);
  if (directIntent) {
    const file = await createTextFile(openid, directIntent.content, directIntent.filename);
    const ext = file.name.toLowerCase().endsWith('.pdf') ? 'PDF' : 'WORD';

    await db.collection('ai_messages').add({
      data: {
        owner: openid,
        role: 'assistant',
        content: `文件已生成：${file.name}`,
        files: [file],
        created_at: new Date()
      }
    });

    return { success: true, message: 'ok', data: { reply: `文件已生成。` } };
  }

  const baseUrl = process.env.AI_BASE_URL || 'https://cmdme.cn';
  const apiKey = process.env.AI_API_KEY || '';
  const model = process.env.AI_MODEL || 'gpt-5.3-codex';

  if (!apiKey) return { success: false, message: 'AI_API_KEY missing', data: null };

  const recent = await db.collection('ai_messages').where({ owner: openid }).orderBy('created_at', 'desc').limit(20).get();
  const history = (recent.data || []).reverse();

  const messages = [
    {
      role: 'system',
      content: '你是小程序里的私人助手。只用简体中文回复，短句，直接给结果。不要英文、不要代码、不要Markdown链接。'
    },
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

  const answerRaw = (((resp.data || {}).choices || [])[0] || {}).message?.content || '（无回复）';
  const rawUrl = firstUrl(answerRaw);
  const answer = stripUrls(answerRaw);

  const assistantFiles = rawUrl
    ? [{ fileID: '', tempFileURL: rawUrl, name: '文件（点我打开）' }]
    : [];

  await db.collection('ai_messages').add({
    data: {
      owner: openid,
      role: 'assistant',
      content: answer,
      files: assistantFiles,
      created_at: new Date()
    }
  });

  return { success: true, message: 'ok', data: { reply: answer } };
};
