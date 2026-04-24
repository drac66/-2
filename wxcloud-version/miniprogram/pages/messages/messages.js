const app = getApp();

function fmtTime(v) {
  if (!v) return '';
  if (typeof v === 'string') return v;
  if (v instanceof Date) {
    const y = v.getFullYear();
    const m = `${v.getMonth() + 1}`.padStart(2, '0');
    const d = `${v.getDate()}`.padStart(2, '0');
    const hh = `${v.getHours()}`.padStart(2, '0');
    const mm = `${v.getMinutes()}`.padStart(2, '0');
    return `${y}-${m}-${d} ${hh}:${mm}`;
  }
  return `${v}`;
}

Page({
  data: { list: [], content: '' },

  onInput(e) {
    this.setData({ content: e.detail.value });
  },

  async loadList() {
    try {
      const token = app.globalData.token || wx.getStorageSync('token') || '';
      const res = await wx.cloud.callFunction({
        name: 'messages',
        data: { action: 'list', token }
      });
      const ret = res.result || {};
      if (!ret.success) {
        wx.showToast({ title: ret.message || '加载失败', icon: 'none' });
        return;
      }

      const list = (ret.data || []).map((it) => ({
        ...it,
        show_time: fmtTime(it.created_at)
      }));
      this.setData({ list });
    } catch (e) {
      wx.showToast({ title: '加载失败(网络)', icon: 'none' });
    }
  },

  async send() {
    const content = (this.data.content || '').trim();
    if (!content) return;

    try {
      const token = app.globalData.token || wx.getStorageSync('token') || '';
      const res = await wx.cloud.callFunction({
        name: 'messages',
        data: { token, content }
      });
      const ret = res.result || {};
      if (!ret.success) {
        wx.showToast({ title: ret.message || '发送失败', icon: 'none' });
        return;
      }

      this.setData({ content: '' });
      this.loadList();
    } catch (e) {
      wx.showToast({ title: '发送失败(网络)', icon: 'none' });
    }
  },

  onShow() {
    this.loadList();
  }
});
