Page({
  data: {
    clickFx: []
  },

  onShow() {
    const token = wx.getStorageSync('token');
    if (!token) {
      wx.reLaunch({ url: '/pages/login/login' });
    }
  },

  onGlobalTap(e) {
    const d = (e && e.detail) || {};
    const t = (e && e.touches && e.touches[0]) || (e && e.changedTouches && e.changedTouches[0]) || null;
    const x = t && typeof t.clientX === 'number' ? t.clientX : (typeof d.x === 'number' ? d.x : 0);
    const y = t && typeof t.clientY === 'number' ? t.clientY : (typeof d.y === 'number' ? d.y : 0);
    const id = `${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const fx = { id, x, y };

    this.setData({ clickFx: [...this.data.clickFx, fx] });
    setTimeout(() => {
      this.setData({ clickFx: this.data.clickFx.filter((it) => it.id !== id) });
    }, 520);
  },

  toAlbum() { wx.navigateTo({ url: '/pages/album/album' }); },
  toMessages() { wx.navigateTo({ url: '/pages/messages/messages' }); },
  toDiary() { wx.navigateTo({ url: '/pages/diary/diary' }); },
  toSettings() { wx.navigateTo({ url: '/pages/settings/settings' }); },

  logout() {
    wx.removeStorageSync('token');
    wx.removeStorageSync('openid');
    wx.removeStorageSync('nickname');

    const app = getApp();
    app.globalData.token = '';
    app.globalData.openid = '';
    app.globalData.nickname = '';

    wx.showToast({ title: '已退出登录', icon: 'success' });
    setTimeout(() => {
      wx.reLaunch({ url: '/pages/login/login' });
    }, 300);
  }
});
