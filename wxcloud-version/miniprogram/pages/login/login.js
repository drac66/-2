const app = getApp();

Page({
  async wxLogin() {
    try {
      const res = await wx.cloud.callFunction({ name: 'wxlogin', data: {} });
      const ret = res.result || {};

      if (!ret.success) {
        wx.showToast({ title: ret.message || '登录失败', icon: 'none' });
        return;
      }

      const { token, openid } = ret.data || {};
      app.globalData.token = token || '';
      app.globalData.openid = openid || '';
      wx.setStorageSync('token', token || '');
      wx.setStorageSync('openid', openid || '');
      wx.reLaunch({ url: '/pages/home/home' });
    } catch (e) {
      wx.showToast({ title: '登录失败，请检查云函数', icon: 'none' });
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
