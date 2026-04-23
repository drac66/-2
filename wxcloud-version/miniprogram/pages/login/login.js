const app = getApp();

Page({
  data: {
    loggingIn: false
  },

  async wxLogin() {
    if (this.data.loggingIn) return;

    this.setData({ loggingIn: true });
    wx.showLoading({ title: '登录中...', mask: true });

    try {
      const res = await wx.cloud.callFunction({ name: 'wxlogin', data: {} });
      const ret = res.result || {};

      if (!ret.success) {
        wx.showToast({ title: ret.message || '登录失败', icon: 'none' });
        return;
      }

      const { token, openid } = ret.data || {};
      if (!token || !openid) {
        wx.showToast({ title: '登录信息异常', icon: 'none' });
        return;
      }

      app.globalData.token = token;
      app.globalData.openid = openid;
      wx.setStorageSync('token', token);
      wx.setStorageSync('openid', openid);
      wx.reLaunch({ url: '/pages/home/home' });
    } catch (e) {
      wx.showToast({ title: '登录失败，请重试', icon: 'none' });
      wx.removeStorageSync('token');
      wx.removeStorageSync('openid');
      app.globalData.token = '';
      app.globalData.openid = '';
    } finally {
      wx.hideLoading();
      this.setData({ loggingIn: false });
    }
  },

  onLoad() {
    const token = wx.getStorageSync('token');
    const openid = wx.getStorageSync('openid');
    if (token && openid) {
      app.globalData.token = token;
      app.globalData.openid = openid;
      wx.reLaunch({ url: '/pages/home/home' });
    }
  }
});
