const app = getApp();

Page({
  data: {
    nickname: '',
    saving: false,
    first: false,
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
      const msg = (e && (e.errMsg || e.message)) || '';
      if (msg.includes('timeout')) {
        wx.showToast({ title: '保存超时，请先上传云函数', icon: 'none' });
      } else {
        wx.showToast({ title: '保存失败，请重试', icon: 'none' });
      }
      console.error('[settings.saveNickname] failed:', e);
    } finally {
      wx.hideLoading();
      this.setData({ saving: false });
    }
  }
});
