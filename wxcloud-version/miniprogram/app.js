// 微信云开发版入口（初始化）
App({
  onLaunch() {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上基础库以使用云能力');
      return;
    }
    wx.cloud.init({
      env: 'replace-with-your-env-id',
      traceUser: true
    });
  },
  globalData: {
    token: '',
    openid: ''
  }
});
