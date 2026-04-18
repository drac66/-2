const app = getApp();

Page({
  data: { name: '' },

  onNameInput(e) { this.setData({ name: e.detail.value }); },

  login() {
    const name = (this.data.name || '').trim();
    if (!name) {
      wx.showToast({ title: '请输入你的名字', icon: 'none' });
      return;
    }
    app.globalData.user = name;
    wx.setStorageSync('user', name);
    wx.reLaunch({ url: '/pages/home/home' });
  },

  onLoad() {
    const saved = wx.getStorageSync('user');
    if (saved) {
      app.globalData.user = saved;
      wx.reLaunch({ url: '/pages/home/home' });
    }
  }
});
