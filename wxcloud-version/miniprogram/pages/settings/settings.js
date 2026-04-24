const app = getApp();

Page({
  data: {
    nickname: '',
    saving: false,
    first: false
  },

  onLoad(query) {
    const first = !!(query && query.first === '1');
    const currentName = app.globalData.nickname || wx.getStorageSync('nickname') || '';
    this.setData({ first, nickname: currentName });
  },

  onInput(e) {
    this.setData({ nickname: e.detail.value || '' });
  },

  async saveNickname() {
    const nickname = (this.data.nickname || '').trim();
    if (!nickname) {
      wx.showToast({ title: '请先填写昵称', icon: 'none' });
      return;
    }

    if (this.data.saving) return;
    this.setData({ saving: true });
    wx.showLoading({ title: '保存中...', mask: true });

    try {
      const token = app.globalData.token || wx.getStorageSync('token') || '';
      const res = await wx.cloud.callFunction({
        name: 'profile',
        data: { action: 'set', token, nickname }
      });
      const ret = res.result || {};
      if (!ret.success) {
        wx.showToast({ title: ret.message || '保存失败', icon: 'none' });
        return;
      }

      const finalName = (ret.data && ret.data.nickname) || nickname;
      app.globalData.nickname = finalName;
      wx.setStorageSync('nickname', finalName);
      wx.showToast({ title: '昵称已保存', icon: 'success' });

      if (this.data.first) {
        setTimeout(() => {
          wx.reLaunch({ url: '/pages/home/home' });
        }, 250);
      }
    } catch (e) {
      wx.showToast({ title: '保存失败，请重试', icon: 'none' });
    } finally {
      wx.hideLoading();
      this.setData({ saving: false });
    }
  }
});

