// albumsUpload 云函数（接收 cloudPath）
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

async function auth(token) {
  if (!token) return null;
  // 开发阶段：token 直接视为 openid
  return token;
}

exports.main = async (event) => {
  const { token, cloudPath, mediaType, note } = event || {};
  const openid = await auth(token);
  if (!openid) return { success: false, message: 'unauthorized', data: null };
  if (!cloudPath) return { success: false, message: 'cloudPath required', data: null };

  const type = mediaType === 'video' ? 'video' : 'image';
  const r = await db.collection('albums').add({
    data: {
      owner: openid,
      media_type: type,
      media_url: cloudPath,
      note: (note || '').trim(),
      created_at: new Date()
    }
  });

  return { success: true, message: 'ok', data: { id: r._id, media_url: cloudPath } };
};
