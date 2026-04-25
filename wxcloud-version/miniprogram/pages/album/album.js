const app = getApp();

function fmtTime(v) {
  if (!v) return '';

  let d = null;
  if (v instanceof Date) d = v;
  else if (typeof v === 'string' || typeof v === 'number') {
    const parsed = new Date(v);
    if (!Number.isNaN(parsed.getTime())) d = parsed;
  }

  if (!d) return `${v}`;

  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  const hh = `${d.getHours()}`.padStart(2, '0');
  const mm = `${d.getMinutes()}`.padStart(2, '0');
  return `${y}-${m}-${day}\n${hh}:${mm}`;
}

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
  data: { list: [], note: '', loadingList: false, uploading: false, clickFx: [] },

  onGlobalTap(e) {
    const d = (e && e.detail) || {};
    const t = (e && e.touches && e.touches[0]) || (e && e.changedTouches && e.changedTouches[0]) || null;
    const x = t && typeof t.clientX === 'number' ? t.clientX : (typeof d.x === 'number' ? d.x : 0);
    const y = t && typeof t.clientY === 'number' ? t.clientY : (typeof d.y === 'number' ? d.y : 0);
    const id = `${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const fx = { id, x, y };

    this.setData({ clickFx: [...this.data.clickFx, fx] });
    setTimeout(() => {
      this.setData({ clickFx: this.data.clickFx.filter((it) => it.id !== id) });
    }, 520);
  },

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

      const merged = list.map((it) => {
        const show_time = fmtTime(it.created_at);
        return { ...it, show_time };
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

  previewImage(e) {
    const current = (e.currentTarget && e.currentTarget.dataset && e.currentTarget.dataset.src) || '';
    const urls = (this.data.list || [])
      .filter((it) => it.media_type === 'image' && it.media_url)
      .map((it) => it.media_url);

    if (!current) return;
    wx.previewImage({
      current,
      urls: urls.length ? urls : [current]
    });
  },

  onShow() {
    this.loadList();
  },

  onPullDownRefresh() {
    this.loadList(true).finally(() => wx.stopPullDownRefresh());
  }
});

