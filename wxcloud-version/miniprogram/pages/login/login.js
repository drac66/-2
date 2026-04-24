const app = getApp();

Page({
  data: {
    loggingIn: false,
    clickFx: []
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

  async finishLoginByWxContext() {
    const res = await wx.cloud.callFunction({ name: 'wxlogin', data: {} });
    const ret = res.result || {};

    if (!ret.success) {
      wx.showToast({ title: ret.message || '登录失败', icon: 'none' });
      return;
    }

    const { token, openid, nickname, needProfile } = ret.data || {};
    if (!token || !openid) {
      wx.showToast({ title: '登录信息异常', icon: 'none' });
      return;
    }

    app.globalData.token = token;
    app.globalData.openid = openid;
    app.globalData.nickname = nickname || '';
    wx.setStorageSync('token', token);
    wx.setStorageSync('openid', openid);
    wx.setStorageSync('nickname', nickname || '');

    if (needProfile || !nickname) {
      wx.reLaunch({ url: '/pages/settings/settings?first=1' });
    } else {
      wx.reLaunch({ url: '/pages/home/home' });
    }
  },

  async wxLogin() {
    if (this.data.loggingIn) return;

    this.setData({ loggingIn: true });
    wx.showLoading({ title: '登录中...', mask: true });

    try {
      await this.finishLoginByWxContext();
    } catch (e) {
      wx.showToast({ title: '登录失败，请重试', icon: 'none' });
      wx.removeStorageSync('token');
      wx.removeStorageSync('openid');
      wx.removeStorageSync('nickname');
      app.globalData.token = '';
      app.globalData.openid = '';
      app.globalData.nickname = '';
    } finally {
      wx.hideLoading();
      this.setData({ loggingIn: false });
    }
  },

  async onLoad() {
    const token = wx.getStorageSync('token');
    const openid = wx.getStorageSync('openid');
    const nickname = wx.getStorageSync('nickname') || '';

    // 有本地登录态且昵称完整：直接进首页
    if (token && openid && nickname) {
      app.globalData.token = token;
      app.globalData.openid = openid;
      app.globalData.nickname = nickname;
      wx.reLaunch({ url: '/pages/home/home' });
      return;
    }

    // 有 openid 但昵称缺失：静默调用 wxlogin 判断是否首登补资料
    if (openid) {
      try {
        await this.finishLoginByWxContext();
      } catch (e) {
        // 静默失败时停留登录页，交给用户手动点登录
      }
    }
  }
});
