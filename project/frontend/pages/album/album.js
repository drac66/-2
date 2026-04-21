const app = getApp();

function request(path, method, data) {
  return new Promise((resolve) => {
    const token = app.globalData.token || wx.getStorageSync('token') || '';
    wx.request({
      url: `${app.globalData.apiBase}${path}`,
      method,
      data,
      timeout: 12000,
      header: token ? { 'X-Auth-Token': token } : {},
      success: (res) => resolve({ ok: true, statusCode: res.statusCode, data: res.data }),
      fail: (err) => resolve({ ok: false, error: err })
    });
  });
}

function chooseAndUpload(mediaType, note, done) {
  wx.chooseMedia({
    count: 1,
    mediaType: [mediaType],
    success: async (r) => {
      const file = r.tempFiles && r.tempFiles[0];
      if (!file || !file.tempFilePath) {
        wx.showToast({ title: '未选择文件', icon: 'none' });
        return;
      }

      const token = app.globalData.token || wx.getStorageSync('token') || '';
      wx.uploadFile({
        url: `${app.globalData.apiBase}/api/albums/upload?mediaType=${encodeURIComponent(mediaType)}&note=${encodeURIComponent(note || '')}`,
        filePath: file.tempFilePath,
        name: 'file',
        timeout: 20000,
        header: token ? { 'X-Auth-Token': token } : {},
        success: (res) => {
          try {
            const data = JSON.parse(res.data || '{}');
            if (res.statusCode !== 200 || !data.success) {
              wx.showToast({ title: data.message || '上传失败', icon: 'none' });
              return;
            }
            wx.showToast({ title: '上传成功', icon: 'success' });
            done && done();
          } catch (e) {
            wx.showToast({ title: '上传响应异常', icon: 'none' });
          }
        },
        fail: () => wx.showToast({ title: '上传超时或失败', icon: 'none' })
      });
    }
  });
}

Page({
  data: { list: [], note: '' },

  onNoteInput(e) { this.setData({ note: e.detail.value }); },

  async loadList() {
    const ret = await request('/api/albums?limit=100', 'GET');
    if (!ret.ok) {
      wx.showToast({ title: '加载失败(网络)', icon: 'none' });
      return;
    }
    const res = ret.data || {};
    if (ret.statusCode !== 200 || !res.success) {
      wx.showToast({ title: res.message || '加载失败', icon: 'none' });
      return;
    }

    const list = (res.data || []).map((it) => {
      const url = it.media_url || '';
      if (url.startsWith('http://') || url.startsWith('https://')) return it;
      return { ...it, media_url: `${app.globalData.apiBase}${url}` };
    });

    this.setData({ list });
  },

  async chooseImage() {
    chooseAndUpload('image', this.data.note, () => {
      this.setData({ note: '' });
      this.loadList();
    });
  },

  async chooseVideo() {
    chooseAndUpload('video', this.data.note, () => {
      this.setData({ note: '' });
      this.loadList();
    });
  },

  onShow() { this.loadList(); }
});
