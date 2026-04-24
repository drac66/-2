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
  data: { list: [], title: '', content: '', visibility: 'self' },

  onTitle(e) {
    this.setData({ title: e.detail.value });
  },
  onContent(e) {
    this.setData({ content: e.detail.value });
  },
  onVisibility(e) {
    const idx = Number(e.detail.value || 0);
    this.setData({ visibility: idx === 0 ? 'self' : 'both' });
  },

  async loadList() {
    try {
      const token = app.globalData.token || wx.getStorageSync('token') || '';
      const res = await wx.cloud.callFunction({
        name: 'diary',
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

  async save() {
    const content = (this.data.content || '').trim();
    if (!content) {
      wx.showToast({ title: '内容不能为空', icon: 'none' });
      return;
    }

    try {
      const token = app.globalData.token || wx.getStorageSync('token') || '';
      const res = await wx.cloud.callFunction({
        name: 'diary',
        data: {
          token,
          title: this.data.title || '',
          content,
          visibility: this.data.visibility
        }
      });
      const ret = res.result || {};
      if (!ret.success) {
        wx.showToast({ title: ret.message || '保存失败', icon: 'none' });
        return;
      }

      this.setData({ title: '', content: '', visibility: 'self' });
      this.loadList();
    } catch (e) {
      wx.showToast({ title: '保存失败(网络)', icon: 'none' });
    }
  },

  onShow() {
    this.loadList();
  }
});
