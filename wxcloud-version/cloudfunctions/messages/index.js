// messages 云函数
const cloud = require('wx-server-sdk');
const config = require('../config');
cloud.init({ env: config.envId });
const db = cloud.database();

async function auth(token) {
  if (!token) return null;
  const r = await db.collection('tokens').where({ token }).limit(1).get();
  return r.data && r.data[0] ? r.data[0].openid : null;
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
