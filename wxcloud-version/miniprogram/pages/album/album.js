const app = getApp();

async function uploadToCloud(filePath, mediaType) {
  const suffix = mediaType === 'video' ? '.mp4' : '.jpg';
  const cloudPath = `albums/${Date.now()}_${Math.random().toString(16).slice(2)}${suffix}`;

  const uploadRes = await wx.cloud.uploadFile({
    cloudPath,
    filePath
  });

  return uploadRes.fileID;
}

async function saveAlbumRecord(mediaType, fileID, note) {
  const token = app.globalData.token || wx.getStorageSync('token') || '';
  const res = await wx.cloud.callFunction({
    name: 'albumsUpload',
    data: {
      token,
      cloudPath: fileID,
      mediaType,
      note: note || ''
    }
  });

  return res.result || {};
}

Page({
  data: { list: [], note: '' },

  onNoteInput(e) {
    this.setData({ note: e.detail.value });
  },

  async loadList() {
    try {
      const token = app.globalData.token || wx.getStorageSync('token') || '';
      const res = await wx.cloud.callFunction({
        name: 'albumsList',
        data: { token }
      });
      const ret = res.result || {};
      if (!ret.success) {
        wx.showToast({ title: ret.message || '加载失败', icon: 'none' });
        return;
      }

      const list = ret.data || [];
      const fileIDs = list
        .map((it) => it.media_url)
        .filter((v) => typeof v === 'string' && v.startsWith('cloud://'));

      let tempMap = {};
      if (fileIDs.length) {
        const tmp = await wx.cloud.getTempFileURL({ fileList: fileIDs });
        tempMap = (tmp.fileList || []).reduce((m, it) => {
          m[it.fileID] = it.tempFileURL || '';
          return m;
        }, {});
      }

      const merged = list.map((it) => {
        const fileID = it.media_url || '';
        if (fileID.startsWith('cloud://')) {
          return { ...it, media_url: tempMap[fileID] || '' };
        }
        return it;
      });

      this.setData({ list: merged });
    } catch (e) {
      wx.showToast({ title: '加载失败(网络)', icon: 'none' });
    }
  },

  async chooseImage() {
    this.chooseAndUpload('image');
  },

  async chooseVideo() {
    this.chooseAndUpload('video');
  },

  chooseAndUpload(mediaType) {
    wx.chooseMedia({
      count: 1,
      mediaType: [mediaType],
      success: async (r) => {
        try {
          const file = r.tempFiles && r.tempFiles[0];
          if (!file || !file.tempFilePath) {
            wx.showToast({ title: '未选择文件', icon: 'none' });
            return;
          }

          const fileID = await uploadToCloud(file.tempFilePath, mediaType);
          const ret = await saveAlbumRecord(mediaType, fileID, this.data.note);

          if (!ret.success) {
            wx.showToast({ title: ret.message || '写入记录失败', icon: 'none' });
            return;
          }

          wx.showToast({ title: '上传成功', icon: 'success' });
          this.setData({ note: '' });
          this.loadList();
        } catch (e) {
          wx.showToast({ title: '上传失败', icon: 'none' });
        }
      }
    });
  },

  onShow() {
    this.loadList();
  }
});
