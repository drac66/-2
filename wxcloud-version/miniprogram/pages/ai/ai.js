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

  fillSummaryPrompt() {
    const tpl = [
      '请帮我处理我上传的文档，并按以下格式输出：',
      '1) 三句话总结全文',
      '2) 关键要点（3-8条）',
      '3) 可执行建议（按优先级）',
      '4) 如果是合同/论文/报告，请列出风险点或疑问点',
      '5) 最后给出一个“给小白看的简版结论”'
    ].join('\n');
    this.setData({ input: tpl });
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

  openFile(e) {
    const url = (e.currentTarget && e.currentTarget.dataset && e.currentTarget.dataset.url) || '';
    if (!url) {
      wx.showToast({ title: '文件链接已过期，请刷新', icon: 'none' });
      return;
    }
    wx.downloadFile({
      url,
      success: (res) => {
        if (res.statusCode === 200 && res.tempFilePath) {
          wx.openDocument({ filePath: res.tempFilePath, showMenu: true });
        } else {
          wx.showToast({ title: '文件下载失败', icon: 'none' });
        }
      },
      fail: () => wx.showToast({ title: '文件下载失败', icon: 'none' })
    });
  },

  async exportAsTxt(e) {
    const text = (e.currentTarget && e.currentTarget.dataset && e.currentTarget.dataset.text) || '';
    if (!text) {
      wx.showToast({ title: '没有可导出的内容', icon: 'none' });
      return;
    }

    try {
      wx.showLoading({ title: '生成文件中...' });
      const token = app.globalData.token || wx.getStorageSync('token') || '';
      const res = await wx.cloud.callFunction({
        name: 'aiChat',
        data: {
          action: 'exportTxt',
          token,
          text,
          filename: `gpt_reply_${Date.now()}.txt`
        }
      });
      const ret = res.result || {};
      if (!ret.success) {
        wx.showToast({ title: ret.message || '导出失败', icon: 'none' });
        return;
      }
      wx.showToast({ title: '已生成文件', icon: 'success' });
      await this.loadList();
    } catch (err) {
      wx.showToast({ title: '导出失败', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
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
