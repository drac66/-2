Page({
  onShow() {
    const token = wx.getStorageSync('token');
    if (!token) {
      wx.reLaunch({ url: '/pages/login/login' });
    }
  },

  toAlbum() { wx.navigateTo({ url: '/pages/album/album' }); },
  toMessages() { wx.navigateTo({ url: '/pages/messages/messages' }); },
  toDiary() { wx.navigateTo({ url: '/pages/diary/diary' }); },

  logout() {
    wx.removeStorageSync('token');
    wx.removeStorageSync('openid');

    const app = getApp();
    app.globalData.token = '';
    app.globalData.openid = '';

    wx.showToast({ title: '已退出登录', icon: 'success' });
    setTimeout(() => {
      wx.reLaunch({ url: '/pages/login/login' });
    }, 300);
  }
});
