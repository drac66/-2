// diary 云函数
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

async function auth(token) {
  if (!token) return null;
  // 开发阶段：token 直接视为 openid
  return token;
}

exports.main = async (event) => {
  const { action, token, title, content, visibility } = event || {};
  const openid = await auth(token);
  if (!openid) return { success: false, message: 'unauthorized', data: null };

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

  const r = await db.collection('diary').add({
    data: { author: openid, title: (title || '').trim(), content: text, visibility: v, created_at: new Date() }
  });
  return { success: true, message: 'ok', data: { id: r._id } };
};
