const app = getApp();

function request(path, method, data) {
  return new Promise((resolve, reject) => {
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
  async wxLogin() {
    wx.login({
      success: async (r) => {
        try {
          const code = r.code;
          if (!code) {
            wx.showToast({ title: '获取登录code失败', icon: 'none' });
            return;
          }

          const ret = await request('/api/auth/wx-login', 'POST', { code });
          if (!ret.ok) {
            wx.showToast({ title: '网络超时，请重试', icon: 'none' });
            return;
          }

          const res = ret.data || {};
          if (ret.statusCode !== 200 || !res.success) {
            wx.showToast({ title: res.message || `登录失败(${ret.statusCode})`, icon: 'none' });
            return;
          }

          const { token, openid } = res.data || {};
          app.globalData.token = token || '';
          app.globalData.openid = openid || '';
          app.globalData.user = openid || '';
          wx.setStorageSync('token', token || '');
          wx.setStorageSync('openid', openid || '');
          wx.reLaunch({ url: '/pages/home/home' });
        } catch (e) {
          wx.showToast({ title: '登录失败', icon: 'none' });
        }
      },
      fail: () => wx.showToast({ title: '微信登录失败', icon: 'none' })
    });
  },

  onLoad() {
    const token = wx.getStorageSync('token');
    const openid = wx.getStorageSync('openid');
    if (token && openid) {
      app.globalData.token = token;
      app.globalData.openid = openid;
      app.globalData.user = openid;
      wx.reLaunch({ url: '/pages/home/home' });
    }
  }
});
