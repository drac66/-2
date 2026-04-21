// albumsUpload 云函数（接收 cloudPath）
const cloud = require('wx-server-sdk');
const config = require('../config');
cloud.init({ env: config.envId });
const db = cloud.database();

async function auth(token) {
  if (!token) return null;
  const r = await db.collection('tokens').where({ token }).limit(1).get();
  return r.data && r.data[0] ? r.data[0].openid : null;
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
