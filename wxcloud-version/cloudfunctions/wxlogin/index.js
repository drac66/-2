// wxlogin 云函数
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

const ALLOWED = {
  odwpk3URVeGOtpsBIALGCfDxnAu0: 'owner',
  odwpk3XulKP3Bq5AdkJRzn42Oabs: 'partner'
};

function resolveRole(openid) {
  return ALLOWED[openid] || '';
}

exports.main = async () => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const role = resolveRole(openid);

  if (!role) {
    return { success: false, message: 'forbidden', data: null };
  }

  let nickname = '';
  let needProfile = true;

  try {
    const u = await db.collection('users').where({ openid }).limit(1).get();
    const user = (u.data && u.data[0]) || null;
    if (user && user.nickname) {
      nickname = user.nickname;
      needProfile = false;
    } else if (!user) {
      await db.collection('users').add({
        data: {
          openid,
          role,
          nickname: '',
          created_at: new Date(),
          updated_at: new Date()
        }
      });
    }
  } catch (e) {
    return { success: false, message: 'users collection missing', data: null };
  }

  return { success: true, message: 'ok', data: { token: 'session-ok', openid, role, nickname, needProfile } };
};
