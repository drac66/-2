// profile 云函数（昵称设置/读取）
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

function auth(token) {
  return token || null; // 开发阶段 token=openid
}

exports.main = async (event) => {
  const { action, token, nickname } = event || {};
  const openid = auth(token);
  if (!openid) return { success: false, message: 'unauthorized', data: null };

  if (action === 'get') {
    const r = await db.collection('users').where({ openid }).limit(1).get();
    const user = (r.data && r.data[0]) || null;
    return { success: true, message: 'ok', data: { nickname: user?.nickname || '' } };
  }

  const name = (nickname || '').trim();
  if (!name) return { success: false, message: 'nickname required', data: null };
  if (name.length > 20) return { success: false, message: 'nickname too long', data: null };

  const r = await db.collection('users').where({ openid }).limit(1).get();
  const user = (r.data && r.data[0]) || null;

  if (!user) {
    await db.collection('users').add({
      data: {
        openid,
        nickname: name,
        created_at: new Date(),
        updated_at: new Date()
      }
    });
  } else {
    await db.collection('users').doc(user._id).update({ data: { nickname: name, updated_at: new Date() } });
  }

  return { success: true, message: 'ok', data: { nickname: name } };
};
