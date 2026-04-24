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

  spawnClickFx(e) {
    const x = (e && e.detail && typeof e.detail.x === 'number') ? e.detail.x : 0;
    const y = (e && e.detail && typeof e.detail.y === 'number') ? e.detail.y : 0;
    const id = `${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const fx = { id, x, y };

    this.setData({ clickFx: [...this.data.clickFx, fx] });
    setTimeout(() => {
      this.setData({ clickFx: this.data.clickFx.filter((it) => it.id !== id) });
    }, 520);
  },

  goWithFx(e, url) {
    this.spawnClickFx(e);
    setTimeout(() => {
      wx.navigateTo({ url });
    }, 120);
  },

  toAlbum(e) { this.goWithFx(e, '/pages/album/album'); },
  toMessages(e) { this.goWithFx(e, '/pages/messages/messages'); },
  toDiary(e) { this.goWithFx(e, '/pages/diary/diary'); },
  toSettings(e) { this.goWithFx(e, '/pages/settings/settings'); },

  logout(e) {
    this.spawnClickFx(e);
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
