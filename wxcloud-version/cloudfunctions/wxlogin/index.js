// wxlogin 云函数
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async () => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  const token = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
  await db.collection('tokens').add({ data: { token, openid, created_at: new Date() } });
  return { success: true, message: 'ok', data: { token, openid } };
};

