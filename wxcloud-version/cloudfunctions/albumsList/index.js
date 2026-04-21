// albumsList 云函数
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
  const { token } = event || {};
  const openid = await auth(token);
  if (!openid) return { success: false, message: 'unauthorized', data: null };

  const r = await db.collection('albums').orderBy('created_at', 'desc').limit(100).get();
  return { success: true, message: 'ok', data: r.data || [] };
};
