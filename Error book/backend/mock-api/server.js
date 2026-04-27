const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = 8787;
const dbPath = path.join(__dirname, 'db.json');

function seed() {
  return [
    {
      id: 'm001',
      question: 'for循环边界写错导致数组越界',
      wrongAnswer: 'i <= arr.length',
      correctAnswer: 'i < arr.length',
      reason: 'length 是元素个数，最后一个索引是 length-1',
      category: 'Java',
      tags: ['循环', '边界']
    },
    {
      id: 'm002',
      question: '二分查找边界条件错误',
      wrongAnswer: 'while(l < r)',
      correctAnswer: 'while(l <= r)',
      reason: '漏掉最后一个候选值',
      category: '算法',
      tags: ['二分']
    }
  ];
}

function loadDb() {
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify(seed(), null, 2), 'utf-8');
  }
  try {
    return JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
  } catch {
    const data = seed();
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf-8');
    return data;
  }
}

function saveDb(data) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf-8');
}

function json(res, code, data) {
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(data));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', chunk => (raw += chunk));
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return json(res, 200, { ok: true });

  const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
  const pathname = url.pathname;

  let data = loadDb();

  if (pathname === '/health') return json(res, 200, { ok: true, count: data.length });

  if (pathname === '/mistakes' && req.method === 'GET') {
    const keyword = (url.searchParams.get('keyword') || '').trim().toLowerCase();
    const category = (url.searchParams.get('category') || '全部分类').trim();
    const filtered = data.filter(m => {
      const okCat = category === '全部分类' || m.category === category;
      const text = `${m.question} ${m.reason} ${m.category}`.toLowerCase();
      const okKey = !keyword || text.includes(keyword);
      return okCat && okKey;
    });
    return json(res, 200, filtered);
  }

  if (pathname === '/mistakes/random' && req.method === 'GET') {
    if (!data.length) return json(res, 200, null);
    const m = data[Math.floor(Math.random() * data.length)];
    return json(res, 200, m);
  }

  if (pathname === '/mistakes' && req.method === 'POST') {
    const body = await readBody(req);
    const item = {
      id: body.id || `m${Date.now()}`,
      question: body.question || '',
      wrongAnswer: body.wrongAnswer || '',
      correctAnswer: body.correctAnswer || '',
      reason: body.reason || '',
      category: body.category || '未分类',
      tags: Array.isArray(body.tags) ? body.tags : []
    };
    data.unshift(item);
    saveDb(data);
    return json(res, 201, item);
  }

  if (pathname.startsWith('/mistakes/') && req.method === 'PUT') {
    const id = pathname.split('/')[2];
    const body = await readBody(req);
    const idx = data.findIndex(x => x.id === id);
    if (idx < 0) return json(res, 404, { error: 'not found' });
    data[idx] = { ...data[idx], ...body, id };
    saveDb(data);
    return json(res, 200, data[idx]);
  }

  if (pathname.startsWith('/mistakes/') && req.method === 'DELETE') {
    const id = pathname.split('/')[2];
    const next = data.filter(x => x.id !== id);
    saveDb(next);
    return json(res, 200, { ok: true });
  }

  if (pathname === '/stats' && req.method === 'GET') {
    const byCategory = {};
    data.forEach(x => { byCategory[x.category] = (byCategory[x.category] || 0) + 1; });
    return json(res, 200, { total: data.length, byCategory });
  }

  return json(res, 404, { error: 'not found' });
});

server.listen(PORT, () => {
  console.log(`Error Book mock API running at http://127.0.0.1:${PORT}`);
});
