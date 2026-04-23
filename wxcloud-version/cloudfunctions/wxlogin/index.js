// wxlogin 云函数
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async () => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  // 开发阶段：直接用 openid 作为 token，避免依赖 tokens 集合
  return { success: true, message: 'ok', data: { token: openid, openid } };
};


