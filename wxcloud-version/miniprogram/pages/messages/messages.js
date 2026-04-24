const app = getApp();

function fmtTime(v) {
  if (!v) return '';

  let d = null;
  if (v instanceof Date) d = v;
  else if (typeof v === 'string' || typeof v === 'number') {
    const parsed = new Date(v);
    if (!Number.isNaN(parsed.getTime())) d = parsed;
  }

  if (!d) return `${v}`;

  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  const hh = `${d.getHours()}`.padStart(2, '0');
  const mm = `${d.getMinutes()}`.padStart(2, '0');
  return `${y}-${m}-${day}\n${hh}:${mm}`;
}

Page({
  data: { list: [], content: '', clickFx: [] },

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
