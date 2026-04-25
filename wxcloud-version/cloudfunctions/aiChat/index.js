// aiChat 云函数
const cloud = require('wx-server-sdk');
const https = require('https');

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
        ...headers
      },
      timeout: 30000
    }, (res) => {
      let raw = '';
      res.on('data', (d) => { raw += d; });
      res.on('end', () => {
        try {
          const parsed = raw ? JSON.parse(raw) : {};
          resolve({ status: res.statusCode || 0, data: parsed });
        } catch (e) {
          reject(new Error(`invalid json response: ${raw.slice(0, 500)}`));
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => req.destroy(new Error('request timeout')));
    if (body) req.write(body);
    req.end();
  });
}

async function buildFileHints(fileIDs) {
  if (!Array.isArray(fileIDs) || !fileIDs.length) return [];
  const temp = await cloud.getTempFileURL({ fileList: fileIDs });
  return (temp.fileList || []).map((f) => ({
    fileID: f.fileID,
    tempFileURL: f.tempFileURL || ''
  }));
}

exports.main = async (event) => {
  const userAuth = auth();
  if (!userAuth) return { success: false, message: 'unauthorized', data: null };

  const { action = 'chat', message = '', fileIDs = [] } = event || {};
  const { openid } = userAuth;

  if (action === 'list') {
    const r = await db.collection('ai_messages').where({ owner: openid }).orderBy('created_at', 'asc').limit(200).get();
    return { success: true, message: 'ok', data: r.data || [] };
  }

  const text = String(message || '').trim();
  if (!text && (!Array.isArray(fileIDs) || !fileIDs.length)) {
    return { success: false, message: 'message or file required', data: null };
  }

  const fileHints = await buildFileHints(fileIDs).catch(() => []);

  await db.collection('ai_messages').add({
    data: {
      owner: openid,
      role: 'user',
      content: text,
      files: fileHints,
      created_at: new Date()
    }
  });

  const baseUrl = process.env.AI_BASE_URL || 'https://cmdme.cn';
  const apiKey = process.env.AI_API_KEY || '';
  const model = process.env.AI_MODEL || 'gpt';

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

  const resp = await requestJson(
    `${baseUrl.replace(/\/$/, '')}/v1/chat/completions`,
    'POST',
    { Authorization: `Bearer ${apiKey}` },
    { model, messages, temperature: 0.7 }
  );

  if (resp.status < 200 || resp.status >= 300) {
    return { success: false, message: `ai http ${resp.status}`, data: resp.data || null };
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
