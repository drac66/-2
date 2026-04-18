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
  data: { list: [], title: '', content: '', visibility: 'self' },

  onTitle(e) { this.setData({ title: e.detail.value }); },
  onContent(e) { this.setData({ content: e.detail.value }); },
  onVisibility(e) {
    const idx = Number(e.detail.value || 0);
    this.setData({ visibility: idx === 0 ? 'self' : 'both' });
  },

  async loadList() {
    const viewer = app.globalData.user || 'unknown';
    try {
      const res = await request(`/api/diary?viewer=${encodeURIComponent(viewer)}`, 'GET');
      this.setData({ list: res.data || [] });
    } catch (e) {
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  async save() {
    const author = app.globalData.user || 'unknown';
    const content = (this.data.content || '').trim();
    if (!content) {
      wx.showToast({ title: '内容不能为空', icon: 'none' });
      return;
    }
    await request('/api/diary', 'POST', {
      author,
      title: this.data.title || '',
      content,
      visibility: this.data.visibility
    });
    this.setData({ title: '', content: '', visibility: 'self' });
    this.loadList();
  },

  onShow() { this.loadList(); }
});
