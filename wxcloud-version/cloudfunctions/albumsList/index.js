// albumsList 云函数
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

async function auth(token) {
  if (!token) return null;
  // 开发阶段：token 直接视为 openid
  return token;
}

exports.main = async (event) => {
  const { token } = event || {};
  const openid = await auth(token);
  if (!openid) return { success: false, message: 'unauthorized', data: null };

  const r = await db.collection('albums').orderBy('created_at', 'desc').limit(100).get();
  return { success: true, message: 'ok', data: r.data || [] };
};
