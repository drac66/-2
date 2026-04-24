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
  const rows = r.data || [];

  const ownerIds = [...new Set(rows.map((it) => it.owner).filter(Boolean))];
  const nameMap = {};

  await Promise.all(ownerIds.map(async (id) => {
    try {
      const ur = await db.collection('users').where({ openid: id }).limit(1).get();
      const u = (ur.data && ur.data[0]) || null;
      nameMap[id] = (u && u.nickname) || id;
    } catch (e) {
      nameMap[id] = id;
    }
  }));

  const data = rows.map((it) => ({
    ...it,
    owner_name: it.owner_name || nameMap[it.owner] || it.owner
  }));

  return { success: true, message: 'ok', data };
};

