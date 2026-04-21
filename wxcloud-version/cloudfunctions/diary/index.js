// diary 云函数
const cloud = require('wx-server-sdk');
const config = require('../config');
cloud.init({ env: config.envId });
const db = cloud.database();
const _ = db.command;

async function auth(token) {
  if (!token) return null;
  const r = await db.collection('tokens').where({ token }).limit(1).get();
  return r.data && r.data[0] ? r.data[0].openid : null;
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
