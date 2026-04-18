const app = getApp();

function request(path, method, data) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${app.globalData.apiBase}${path}`,
      method,
      data,
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
      this.setData({ list: res.data || [] });
    } catch (e) {
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  async chooseImage() {
    const owner = app.globalData.user || 'unknown';
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      success: async (r) => {
        const path = r.tempFiles[0].tempFilePath;
        await request('/api/albums', 'POST', { owner, media_type: 'image', media_url: path, note: this.data.note });
        this.setData({ note: '' });
        this.loadList();
      }
    });
  },

  async chooseVideo() {
    const owner = app.globalData.user || 'unknown';
    wx.chooseMedia({
      count: 1,
      mediaType: ['video'],
      success: async (r) => {
        const path = r.tempFiles[0].tempFilePath;
        await request('/api/albums', 'POST', { owner, media_type: 'video', media_url: path, note: this.data.note });
        this.setData({ note: '' });
        this.loadList();
      }
    });
  },

  onShow() { this.loadList(); }
});
