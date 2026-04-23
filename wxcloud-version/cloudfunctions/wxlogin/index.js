// wxlogin 云函数
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async () => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

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
          nickname: '',
          created_at: new Date(),
          updated_at: new Date()
        }
      });
    }
  } catch (e) {
    return { success: false, message: 'users collection missing', data: null };
  }

  // 开发阶段 token 仍使用 openid
  return { success: true, message: 'ok', data: { token: openid, openid, nickname, needProfile } };
};
