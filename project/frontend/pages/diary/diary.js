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
  data: { list: [], title: '', content: '', visibility: 'self' },

  onTitle(e) { this.setData({ title: e.detail.value }); },
  onContent(e) { this.setData({ content: e.detail.value }); },
  onVisibility(e) {
    const idx = Number(e.detail.value || 0);
    this.setData({ visibility: idx === 0 ? 'self' : 'both' });
  },

  async loadList() {
    const viewer = app.globalData.openid || 'unknown';
    try {
      const res = await request(`/api/diary?viewer=${encodeURIComponent(viewer)}`, 'GET');
      if (!res.success) throw new Error(res.message || 'failed');
      this.setData({ list: res.data || [] });
    } catch (e) {
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  async save() {
    const author = app.globalData.openid || 'unknown';
    const content = (this.data.content || '').trim();
    if (!content) {
      wx.showToast({ title: '内容不能为空', icon: 'none' });
      return;
    }
    const res = await request('/api/diary', 'POST', {
      author,
      title: this.data.title || '',
      content,
      visibility: this.data.visibility
    });
    if (!res.success) {
      wx.showToast({ title: res.message || '保存失败', icon: 'none' });
      return;
    }
    this.setData({ title: '', content: '', visibility: 'self' });
    this.loadList();
  },

  onShow() { this.loadList(); }
});
