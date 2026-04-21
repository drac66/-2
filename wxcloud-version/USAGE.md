# 小程序调用云函数示例（登录）

```js
// pages/login/login.js (示例)
Page({
  async wxLogin() {
    const res = await wx.cloud.callFunction({ name: 'wxlogin', data: {} });
    const ret = res.result || {};
    if (!ret.success) {
      wx.showToast({ title: ret.message || '登录失败', icon: 'none' });
      return;
    }
    const { token, openid } = ret.data;
    wx.setStorageSync('token', token);
    wx.setStorageSync('openid', openid);
    wx.reLaunch({ url: '/pages/home/home' });
  }
});
```
