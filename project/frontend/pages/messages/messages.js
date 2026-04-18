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
  data: { list: [], content: '' },
  onInput(e) { this.setData({ content: e.detail.value }); },

  async loadList() {
    try {
      const res = await request('/api/messages?limit=100', 'GET');
      this.setData({ list: res.data || [] });
    } catch (e) {
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  async send() {
    const content = (this.data.content || '').trim();
    if (!content) return;
    const sender = app.globalData.user || 'unknown';
    await request('/api/messages', 'POST', { sender, content });
    this.setData({ content: '' });
    this.loadList();
  },

  onShow() { this.loadList(); }
});
