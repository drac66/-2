const app = getApp();

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withTimeout(promise, ms, label) {
  let timer = null;
  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label || 'request'} timeout`)), ms);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function retry(fn, options = {}) {
  const times = options.times || 2;
  const delayMs = options.delayMs || 500;
  let lastErr = null;

  for (let i = 0; i < times; i++) {
    try {
      return await fn(i + 1);
    } catch (e) {
      lastErr = e;
      if (i < times - 1) await sleep(delayMs);
    }
  }

  throw lastErr || new Error('retry failed');
}

async function uploadToCloud(filePath, mediaType) {
  const suffix = mediaType === 'video' ? '.mp4' : '.jpg';
  const cloudPath = `albums/${Date.now()}_${Math.random().toString(16).slice(2)}${suffix}`;

  const uploadRes = await withTimeout(wx.cloud.uploadFile({ cloudPath, filePath }), 30000, 'upload');
  return uploadRes.fileID;
}

async function saveAlbumRecord(mediaType, fileID, note) {
  const token = app.globalData.token || wx.getStorageSync('token') || '';
  const res = await withTimeout(
    wx.cloud.callFunction({
      name: 'albumsUpload',
      data: {
        token,
        cloudPath: fileID,
        mediaType,
        note: note || ''
      }
    }),
    15000,
    'albumsUpload'
  );

  return res.result || {};
}

Page({
  data: { list: [], note: '', loadingList: false, uploading: false },

  onNoteInput(e) {
    this.setData({ note: e.detail.value });
  },

  async loadList(silent = false) {
    if (!silent) this.setData({ loadingList: true });

    try {
      const token = app.globalData.token || wx.getStorageSync('token') || '';

      const ret = await retry(async () => {
        const res = await withTimeout(
          wx.cloud.callFunction({ name: 'albumsList', data: { token } }),
          12000,
          'albumsList'
        );
        return res.result || {};
      }, { times: 2, delayMs: 500 });

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
        try {
          const tmp = await retry(
            () => withTimeout(wx.cloud.getTempFileURL({ fileList: fileIDs }), 12000, 'getTempFileURL'),
            { times: 2, delayMs: 500 }
          );
          tempMap = (tmp.fileList || []).reduce((m, it) => {
            m[it.fileID] = it.tempFileURL || '';
            return m;
          }, {});
        } catch (e) {
          console.warn('getTempFileURL failed:', e);
          wx.showToast({ title: '图片链接获取超时，已显示文本', icon: 'none' });
        }
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
      console.error('loadList error:', e);
      wx.showToast({ title: '加载超时，请下拉重试', icon: 'none' });
    } finally {
      this.setData({ loadingList: false });
    }
  },

  async chooseImage() {
    this.chooseAndUpload('image');
  },

  async chooseVideo() {
    this.chooseAndUpload('video');
  },

  chooseAndUpload(mediaType) {
    if (this.data.uploading) return;

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

          this.setData({ uploading: true });
          wx.showLoading({ title: '上传中...', mask: true });

          const fileID = await retry(
            () => uploadToCloud(file.tempFilePath, mediaType),
            { times: 2, delayMs: 700 }
          );

          const ret = await retry(
            () => saveAlbumRecord(mediaType, fileID, this.data.note),
            { times: 2, delayMs: 500 }
          );

          if (!ret.success) {
            wx.showToast({ title: ret.message || '写入记录失败', icon: 'none' });
            return;
          }

          wx.showToast({ title: '上传成功', icon: 'success' });
          this.setData({ note: '' });
          this.loadList(true);
        } catch (e) {
          console.error('upload error:', e);
          wx.showToast({ title: '上传超时，请重试', icon: 'none' });
        } finally {
          wx.hideLoading();
          this.setData({ uploading: false });
        }
      }
    });
  },

  onShow() {
    this.loadList();
  },

  onPullDownRefresh() {
    this.loadList(true).finally(() => wx.stopPullDownRefresh());
  }
});
