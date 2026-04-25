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
  // 关闭“内容为xxx直接生成文件”捷径，避免覆盖正常 AI 生成逻辑
  return null;
}

function shouldAutoGenerateFileFromPrompt(text) {
  const s = String(text || '').trim();
  if (!s) return false;
  // 典型需求：让 AI 先生成，再发文件
  return /(发给我|给我|导出|生成).*(word|文档|文件)/i.test(s) || /(出师表|原文|作文|总结|报告|方案)/.test(s);
}

function extractPreferredFileBaseName(text) {
  const s = String(text || '').trim();
  if (!s) return '';
  const m = s.match(/(?:文件名|名字)(?:叫|为|是|：|:)\s*([^\n，。,.]+)/i);
  if (m && m[1]) return sanitizeBaseName(m[1]);
  // 无明确文件名时，用问题前 12 字做短名
  return sanitizeBaseName(s.replace(/[？?。！!]/g, '').slice(0, 12));
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

function sanitizeGeneratedDocText(text) {
  const lines = String(text || '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .filter((l) => !/^文件已生成[:：]?/i.test(l))
    .filter((l) => !/点击.*(下载|文件卡片)/.test(l))
    .filter((l) => !/用户上传文件/.test(l))
    .filter((l) => !/链接已隐藏/.test(l))
    .filter((l) => !/^https?:\/\//i.test(l));

  return lines.join('\n').trim();
}

function isBadDocBody(text) {
  const t = String(text || '').trim();
  if (!t) return true;
  if (t.length < 20) return true;
  if (/https?:\/\//i.test(t)) return true;
  if (/文件已生成|点击.*下载|链接已隐藏|用户上传文件/.test(t)) return true;
  return false;
}

function buildEndpointCandidates(baseUrl) {
  const base = String(baseUrl || '').replace(/\/$/, '');
  return /\/v1$/i.test(base)
    ? [
      `${base}/chat/completions`,
      `${base.replace(/\/v1$/i, '')}/v1/chat/completions`,
      `${base.replace(/\/v1$/i, '')}/chat/completions`
    ]
    : [
      `${base}/v1/chat/completions`,
      `${base}/chat/completions`
    ];
}

async function callChatCompletions(baseUrl, apiKey, model, messages) {
  const endpointCandidates = buildEndpointCandidates(baseUrl);
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

  return { resp, usedEndpoint };
}


function cleanPromptText(text) {
  return String(text || '')
    .replace(/https?:\/\/[^\s]+/g, '')
    .replace(/【链接已隐藏，请点下方文件卡片】/g, '')
    .replace(/文件已重新生成，点下方卡片打开。/g, '')
    .replace(/文件已生成[:：]?\s*[^\n]*/g, '')
    .trim();
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

    const regen = await Promise.race([
      createTextFile(openid, old.sourceText, old.baseName || old.name || '文件'),
      new Promise((_, reject) => setTimeout(() => reject(new Error('regen timeout')), 45000))
    ]).catch((e) => null);

    if (!regen) return { success: false, message: '重生成超时，请重试', data: null };

    await db.collection('ai_messages').add({
      data: {
        owner: openid,
        role: 'assistant',
        content: '文件已重新生成，点下方卡片打开。',
        files: [regen],
        created_at: new Date()
      }
    });

    return { success: true, message: 'ok', data: regen };
  }

  const userText = String(message || '').trim();
  if (!userText && (!Array.isArray(fileIDs) || !fileIDs.length)) {
    return { success: false, message: 'message or file required', data: null };
  }

  const autoFileMode = shouldAutoGenerateFileFromPrompt(userText);

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
  // 自动文档模式下，避免历史里的“链接/提示语”污染模型输出
  const promptHistory = autoFileMode
    ? history.filter((m) => m.role !== 'assistant').slice(-8)
    : history;

  const messages = [
    {
      role: 'system',
      content: '你是小程序里的私人助手。只用简体中文回复，短句，直接给结果。不要英文、不要代码、不要Markdown链接。'
    },
    ...(autoFileMode
      ? [{
        role: 'system',
        content: '当前任务用于生成可下载Word文档。请只输出最终正文内容本身，不要写“已生成”“点击下载”“下面是”等任何说明性句子。'
      }]
      : []),
    ...promptHistory.map((m) => {
      const baseText = cleanPromptText(m.content || '');
      const fileText = (m.files || []).length
        ? `\n\n用户上传文件（临时链接，可能过期）:\n${m.files.map((f) => `- ${f.tempFileURL || f.fileID}`).join('\n')}`
        : '';
      return {
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: `${baseText}${fileText}`.trim()
      };
    }).filter((m) => m.content)
  ];

  const { resp, usedEndpoint } = await callChatCompletions(baseUrl, apiKey, model, messages);

  if (!resp || resp.status < 200 || resp.status >= 300) {
    const detail = {
      endpoint: usedEndpoint,
      ...(resp && resp.data ? resp.data : {}),
      ...(resp && !resp.data ? { raw: String(resp.raw || '').slice(0, 500) } : {})
    };
    return { success: false, message: `ai http ${resp ? resp.status : 'unknown'}`, data: detail };
  }

  const answerRaw = (((resp.data || {}).choices || [])[0] || {}).message?.content || '（无回复）';
  const normalizedAnswer = autoFileMode ? sanitizeGeneratedDocText(answerRaw) : answerRaw;
  const rawUrl = firstUrl(normalizedAnswer);
  const answer = stripUrls(normalizedAnswer);

  const assistantFiles = rawUrl
    ? [{ fileID: '', tempFileURL: rawUrl, name: '文件（点我打开）' }]
    : [];

  // 自动文档模式：走文档专用二次生成，避免聊天历史污染正文
  if (autoFileMode) {
    try {
      const docPromptMessages = [
        {
          role: 'system',
          content: '你是文档正文生成器。只输出最终正文，不要任何说明、链接、标题前缀、注释。'
        },
        {
          role: 'user',
          content: `请根据我的需求生成可直接写入Word的正文内容。需求：${cleanPromptText(userText)}`
        }
      ];

      const { resp: docResp } = await callChatCompletions(baseUrl, apiKey, model, docPromptMessages);
      const docRaw = (((docResp && docResp.data) || {}).choices || [])[0]?.message?.content || '';
      const docBody = sanitizeGeneratedDocText(docRaw || answerRaw);

      if (!isBadDocBody(docBody)) {
        const autoBaseName = extractPreferredFileBaseName(userText) || '';
        const autoFile = await createTextFile(openid, docBody, autoBaseName);
        assistantFiles.push(autoFile);
      }
    } catch (e) {
      // 自动落文件失败不影响文本回复
    }
  }

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
