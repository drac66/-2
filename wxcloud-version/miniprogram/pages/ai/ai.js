const app = getApp();

function timeText(v) {
  const d = new Date(v || Date.now());
  const hh = `${d.getHours()}`.padStart(2, '0');
  const mm = `${d.getMinutes()}`.padStart(2, '0');
  return `${hh}:${mm}`;
}

Page({
  data: {
    input: '',
    list: [],
    uploading: false,
    pendingFileIDs: [],
    pendingFilesText: ''
  },

  onInput(e) {
    this.setData({ input: e.detail.value || '' });
  },

  async loadList() {
    const token = app.globalData.token || wx.getStorageSync('token') || '';
    const res = await wx.cloud.callFunction({ name: 'aiChat', data: { action: 'list', token } });
    const ret = res.result || {};
    if (!ret.success) {
      wx.showToast({ title: ret.message || '加载失败', icon: 'none' });
      return;
    }
    const list = (ret.data || []).map((it) => ({ ...it, show_time: timeText(it.created_at) }));
    this.setData({ list });
  },

  async chooseFile() {
    if (this.data.uploading) return;
    this.setData({ uploading: true });

    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      extension: ['pdf', 'doc', 'docx', 'txt'],
      success: async (r) => {
        try {
          const f = (r.tempFiles || [])[0];
          if (!f || !f.path) return;
          wx.showLoading({ title: '上传文件中...' });
          const cloudPath = `ai-input/${Date.now()}_${f.name || 'file'}`;
          const up = await wx.cloud.uploadFile({ cloudPath, filePath: f.path });
          const fileID = up.fileID;
          const arr = [...this.data.pendingFileIDs, fileID];
          this.setData({
            pendingFileIDs: arr,
            pendingFilesText: `${arr.length}个文件待发送`
          });
          wx.showToast({ title: '文件已加入', icon: 'success' });
        } catch (e) {
          wx.showToast({ title: '上传失败', icon: 'none' });
        } finally {
          wx.hideLoading();
          this.setData({ uploading: false });
        }
      },
      fail: () => this.setData({ uploading: false })
    });
  },

  async send() {
    const message = (this.data.input || '').trim();
    const fileIDs = this.data.pendingFileIDs || [];
    if (!message && !fileIDs.length) return;

    try {
      wx.showLoading({ title: '思考中...' });
      const token = app.globalData.token || wx.getStorageSync('token') || '';
      const res = await wx.cloud.callFunction({
        name: 'aiChat',
        data: { action: 'chat', token, message, fileIDs }
      });
      const ret = res.result || {};
      if (!ret.success) {
        wx.showToast({ title: ret.message || '发送失败', icon: 'none' });
        return;
      }

      this.setData({ input: '', pendingFileIDs: [], pendingFilesText: '' });
      await this.loadList();
    } catch (e) {
      wx.showToast({ title: '发送失败(网络)', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },

  onShow() {
    this.loadList();
  }
});
