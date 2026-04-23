// messages 云函数
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

async function auth(token) {
  if (!token) return null;
  // 开发阶段：token 直接视为 openid
  return token;
}

exports.main = async (event) => {
  const { action, token, content } = event || {};
  const openid = await auth(token);
  if (!openid) return { success: false, message: 'unauthorized', data: null };

  if (action === 'list') {
    const r = await db.collection('messages').orderBy('created_at', 'desc').limit(100).get();
    return { success: true, message: 'ok', data: r.data || [] };
  }

  const text = (content || '').trim();
  if (!text) return { success: false, message: 'content cannot be empty', data: null };
  const r = await db.collection('messages').add({ data: { sender: openid, content: text, created_at: new Date() } });
  return { success: true, message: 'ok', data: { id: r._id } };
};
