// albumsList 云函数
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

exports.main = async () => {
  const userAuth = auth();
  if (!userAuth) return { success: false, message: 'unauthorized', data: null };

  const r = await db.collection('albums').orderBy('created_at', 'desc').limit(100).get();
  const rows = r.data || [];

  const ownerIds = [...new Set(rows.map((it) => it.owner).filter(Boolean))];
  const nameMap = {};

  await Promise.all(ownerIds.map(async (id) => {
    try {
      const ur = await db.collection('users').where({ openid: id }).limit(1).get();
      const u = (ur.data && ur.data[0]) || null;
      nameMap[id] = (u && u.nickname) || id;
    } catch (e) {
      nameMap[id] = id;
    }
  }));

  // 在云端统一换取临时链接，避免前端因文件权限差异导致“文字可见但图片不可见”
  const fileIDs = rows
    .map((it) => it.media_url)
    .filter((v) => typeof v === 'string' && v.startsWith('cloud://'));

  let tempMap = {};
  if (fileIDs.length) {
    try {
      const tmp = await cloud.getTempFileURL({ fileList: fileIDs });
      tempMap = (tmp.fileList || []).reduce((m, it) => {
        // 临时链接失败时，tempFileURL 可能为空；保留原值兜底
        m[it.fileID] = it.tempFileURL || '';
        return m;
      }, {});
    } catch (e) {
      // 忽略，走原始 fileID 兜底
      tempMap = {};
    }
  }

  const data = rows.map((it) => {
    const fileID = it.media_url || '';
    const tempUrl = fileID.startsWith('cloud://') ? (tempMap[fileID] || fileID) : fileID;
    return {
      ...it,
      media_file_id: fileID,
      media_url: tempUrl,
      owner_name: it.owner_name || nameMap[it.owner] || it.owner
    };
  });

  return { success: true, message: 'ok', data };
};

