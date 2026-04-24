// albumsUpload 云函数（接收 cloudPath）
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

async function getNickname(openid) {
  const r = await db.collection('users').where({ openid }).limit(1).get();
  const u = (r.data && r.data[0]) || null;
  return (u && u.nickname) || '未命名用户';
}

exports.main = async (event) => {
  const { cloudPath, mediaType, note } = event || {};
  const userAuth = auth();
  if (!userAuth) return { success: false, message: 'unauthorized', data: null };
  if (!cloudPath) return { success: false, message: 'cloudPath required', data: null };

  const { openid } = userAuth;
  const type = mediaType === 'video' ? 'video' : 'image';
  const nickname = await getNickname(openid);
  const r = await db.collection('albums').add({
    data: {
      owner: openid,
      owner_name: nickname,
      media_type: type,
      media_url: cloudPath,
      note: (note || '').trim(),
      created_at: new Date()
    }
  });

  return { success: true, message: 'ok', data: { id: r._id, media_url: cloudPath } };
};
