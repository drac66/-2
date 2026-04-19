const app = getApp();

function request(path, method, data) {
  return new Promise((resolve, reject) => {
    const token = app.globalData.token || wx.getStorageSync('token') || '';
    wx.request({
      url: `${app.globalData.apiBase}${path}`,
      method,
      data,
      header: token ? { 'X-Auth-Token': token } : {},
      success: (res) => resolve(res.data),
      fail: reject
    });
  });
}

Page({
  data: { list: [], note: '' },

  onNoteInput(e) { this.setData({ note: e.detail.value }); },

  async loadList() {
    try {
      const res = await request('/api/albums?limit=100', 'GET');
      if (!res.success) throw new Error(res.message || 'failed');
      this.setData({ list: res.data || [] });
    } catch (e) {
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  async chooseImage() {
    const owner = app.globalData.openid || 'unknown';
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      success: async (r) => {
        const path = r.tempFiles[0].tempFilePath;
        const res = await request('/api/albums', 'POST', { owner, media_type: 'image', media_url: path, note: this.data.note });
        if (!res.success) {
          wx.showToast({ title: res.message || '上传失败', icon: 'none' });
          return;
        }
        this.setData({ note: '' });
        this.loadList();
      }
    });
  },

  async chooseVideo() {
    const owner = app.globalData.openid || 'unknown';
    wx.chooseMedia({
      count: 1,
      mediaType: ['video'],
      success: async (r) => {
        const path = r.tempFiles[0].tempFilePath;
        const res = await request('/api/albums', 'POST', { owner, media_type: 'video', media_url: path, note: this.data.note });
        if (!res.success) {
          wx.showToast({ title: res.message || '上传失败', icon: 'none' });
          return;
        }
        this.setData({ note: '' });
        this.loadList();
      }
    });
  },

  onShow() { this.loadList(); }
});
