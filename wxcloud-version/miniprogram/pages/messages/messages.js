const app = getApp();

Page({
  data: { list: [], content: '' },

  onInput(e) {
    this.setData({ content: e.detail.value });
  },

  async loadList() {
    try {
      const token = app.globalData.token || wx.getStorageSync('token') || '';
      const res = await wx.cloud.callFunction({
        name: 'messages',
        data: { action: 'list', token }
      });
      const ret = res.result || {};
      if (!ret.success) {
        wx.showToast({ title: ret.message || '加载失败', icon: 'none' });
        return;
      }
      this.setData({ list: ret.data || [] });
    } catch (e) {
      wx.showToast({ title: '加载失败(网络)', icon: 'none' });
    }
  },

  async send() {
    const content = (this.data.content || '').trim();
    if (!content) return;

    try {
      const token = app.globalData.token || wx.getStorageSync('token') || '';
      const res = await wx.cloud.callFunction({
        name: 'messages',
        data: { token, content }
      });
      const ret = res.result || {};
      if (!ret.success) {
        wx.showToast({ title: ret.message || '发送失败', icon: 'none' });
        return;
      }

      this.setData({ content: '' });
      this.loadList();
    } catch (e) {
      wx.showToast({ title: '发送失败(网络)', icon: 'none' });
    }
  },

  onShow() {
    this.loadList();
  }
});
