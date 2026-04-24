// diary 云函数
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

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

async function getNickname(openid) {
  const r = await db.collection('users').where({ openid }).limit(1).get();
  const u = (r.data && r.data[0]) || null;
  return (u && u.nickname) || '未命名用户';
}

exports.main = async (event) => {
  const { action, title, content, visibility } = event || {};
  const userAuth = auth();
  if (!userAuth) return { success: false, message: 'unauthorized', data: null };

  const { openid } = userAuth;

  if (action === 'list') {
    const r = await db.collection('diary')
      .where(_.or([{ visibility: 'both' }, { author: openid }]))
      .orderBy('created_at', 'desc')
      .limit(200)
      .get();
    return { success: true, message: 'ok', data: r.data || [] };
  }

  const text = (content || '').trim();
  const v = visibility || 'self';
  if (!text) return { success: false, message: 'content cannot be empty', data: null };
  if (!['self', 'both'].includes(v)) return { success: false, message: 'visibility must be self or both', data: null };

  const nickname = await getNickname(openid);
  const r = await db.collection('diary').add({
    data: {
      author: openid,
      author_name: nickname,
      title: (title || '').trim(),
      content: text,
      visibility: v,
      created_at: new Date()
    }
  });
  return { success: true, message: 'ok', data: { id: r._id } };
};
