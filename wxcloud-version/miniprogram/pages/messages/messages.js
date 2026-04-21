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

Page({
  data: { list: [], content: '' },
  onInput(e) { this.setData({ content: e.detail.value }); },

  async loadList() {
    const ret = await request('/api/messages?limit=100', 'GET');
    if (!ret.ok) {
      wx.showToast({ title: '加载失败(网络)', icon: 'none' });
      return;
    }
    const res = ret.data || {};
    if (ret.statusCode !== 200 || !res.success) {
      wx.showToast({ title: res.message || '加载失败', icon: 'none' });
      return;
    }
    this.setData({ list: res.data || [] });
  },

  async send() {
    const content = (this.data.content || '').trim();
    if (!content) return;

    const ret = await request('/api/messages', 'POST', { content });
    if (!ret.ok) {
      wx.showToast({ title: '发送失败(网络)', icon: 'none' });
      return;
    }
    const res = ret.data || {};
    if (ret.statusCode !== 200 || !res.success) {
      wx.showToast({ title: res.message || '发送失败', icon: 'none' });
      return;
    }

    this.setData({ content: '' });
    this.loadList();
  },

  onShow() { this.loadList(); }
});
