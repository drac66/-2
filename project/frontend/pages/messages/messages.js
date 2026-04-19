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
  data: { list: [], content: '' },
  onInput(e) { this.setData({ content: e.detail.value }); },

  async loadList() {
    try {
      const res = await request('/api/messages?limit=100', 'GET');
      if (!res.success) throw new Error(res.message || 'failed');
      this.setData({ list: res.data || [] });
    } catch (e) {
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  async send() {
    const content = (this.data.content || '').trim();
    if (!content) return;
    const sender = app.globalData.openid || 'unknown';
    const res = await request('/api/messages', 'POST', { sender, content });
    if (!res.success) {
      wx.showToast({ title: res.message || '发送失败', icon: 'none' });
      return;
    }
    this.setData({ content: '' });
    this.loadList();
  },

  onShow() { this.loadList(); }
});
