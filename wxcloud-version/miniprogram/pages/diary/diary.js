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
  data: { list: [], title: '', content: '', visibility: 'self' },

  onTitle(e) { this.setData({ title: e.detail.value }); },
  onContent(e) { this.setData({ content: e.detail.value }); },
  onVisibility(e) {
    const idx = Number(e.detail.value || 0);
    this.setData({ visibility: idx === 0 ? 'self' : 'both' });
  },

  async loadList() {
    const ret = await request('/api/diary', 'GET');
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

  async save() {
    const content = (this.data.content || '').trim();
    if (!content) {
      wx.showToast({ title: '内容不能为空', icon: 'none' });
      return;
    }
    const ret = await request('/api/diary', 'POST', {
      title: this.data.title || '',
      content,
      visibility: this.data.visibility
    });

    if (!ret.ok) {
      wx.showToast({ title: '保存失败(网络)', icon: 'none' });
      return;
    }
    const res = ret.data || {};
    if (ret.statusCode !== 200 || !res.success) {
      wx.showToast({ title: res.message || '保存失败', icon: 'none' });
      return;
    }

    this.setData({ title: '', content: '', visibility: 'self' });
    this.loadList();
  },

  onShow() { this.loadList(); }
});
