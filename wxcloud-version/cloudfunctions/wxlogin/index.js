// wxlogin 云函数
const cloud = require('wx-server-sdk');
const config = require('../config');
cloud.init({ env: config.envId });
const db = cloud.database();

exports.main = async (event) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  if (!config.openidWhitelist.includes(openid)) {
    return { success: false, message: 'no permission', data: null };
  }

  const token = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
  await db.collection('tokens').add({ data: { token, openid, created_at: new Date() } });
  return { success: true, message: 'ok', data: { token, openid } };
};
