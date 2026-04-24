// profile 云函数（昵称设置/读取）
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

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

exports.main = async (event) => {
  const { action, nickname } = event || {};
  const userAuth = auth();
  if (!userAuth) return { success: false, message: 'unauthorized', data: null };

  const { openid, role } = userAuth;

  if (action === 'get') {
    const r = await db.collection('users').where({ openid }).limit(1).get();
    const user = (r.data && r.data[0]) || null;
    return { success: true, message: 'ok', data: { nickname: user?.nickname || '', role } };
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
        role,
        nickname: name,
        created_at: new Date(),
        updated_at: new Date()
      }
    });
  } else {
    await db.collection('users').doc(user._id).update({ data: { role, nickname: name, updated_at: new Date() } });
  }

  return { success: true, message: 'ok', data: { nickname: name, role } };
};
