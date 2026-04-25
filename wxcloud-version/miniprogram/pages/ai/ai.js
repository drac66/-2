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
    sending: false,
    pendingFiles: [],
    scrollIntoView: 'chat-bottom-anchor'
  },

  showBusy() {},
  hideBusy() {},

  onInput(e) {
    this.setData({ input: e.detail.value || '' });
  },

  onInputConfirm() {
    this.send();
  },

  onMessageLongPress(e) {
    const role = (e.currentTarget && e.currentTarget.dataset && e.currentTarget.dataset.role) || '';
    const text = (e.currentTarget && e.currentTarget.dataset && e.currentTarget.dataset.text) || '';
    if (role !== 'assistant' || !text) return;

    wx.setClipboardData({
      data: text,
      success: () => wx.showToast({ title: '已复制', icon: 'success' }),
      fail: () => wx.showToast({ title: '复制失败', icon: 'none' })
    });
  },

  scrollToBottom() {
    this.setData({ scrollIntoView: '' });
    setTimeout(() => this.setData({ scrollIntoView: 'chat-bottom-anchor' }), 30);
  },

  async loadList() {
    const token = app.globalData.token || wx.getStorageSync('token') || '';
    try {
      const res = await wx.cloud.callFunction({ name: 'aiChat', data: { action: 'list', token } });
      const ret = res.result || {};
      if (!ret.success) {
        wx.showToast({ title: ret.message || '加载失败', icon: 'none' });
        return;
      }
      const list = (ret.data || []).map((it) => ({ ...it, show_time: timeText(it.created_at) }));
      this.setData({ list });
      this.scrollToBottom();
    } catch (e) {
      wx.showToast({ title: '加载失败(网络)', icon: 'none' });
    }
  },

  async chooseFile() {
    if (this.data.uploading) return;
    this.setData({ uploading: true });

    wx.chooseMessageFile({
      count: 5,
      type: 'file',
      extension: ['pdf', 'doc', 'docx', 'txt'],
      success: async (r) => {
        try {
          const files = (r.tempFiles || []).filter((f) => f && f.path);
          if (!files.length) return;

          const uploaded = [];
          for (const f of files) {
            const cloudPath = `ai-input/${Date.now()}_${Math.random().toString(16).slice(2)}_${f.name || 'file'}`;
            const up = await wx.cloud.uploadFile({ cloudPath, filePath: f.path });
            uploaded.push({ fileID: up.fileID, name: f.name || '文件' });
          }

          this.setData({ pendingFiles: [...this.data.pendingFiles, ...uploaded] });
          wx.showToast({ title: `已加入${uploaded.length}个文件`, icon: 'success' });
        } catch (e) {
          wx.showToast({ title: '上传失败', icon: 'none' });
        } finally {
          this.setData({ uploading: false });
        }
      },
      fail: () => this.setData({ uploading: false })
    });
  },

  removePendingFile(e) {
    const idx = Number((e.currentTarget && e.currentTarget.dataset && e.currentTarget.dataset.index) || -1);
    if (idx < 0) return;
    const arr = [...this.data.pendingFiles];
    arr.splice(idx, 1);
    this.setData({ pendingFiles: arr });
  },

  clearPendingFiles() {
    if (!this.data.pendingFiles.length) return;
    this.setData({ pendingFiles: [] });
  },

  async openFile(e) {
    let url = (e.currentTarget && e.currentTarget.dataset && e.currentTarget.dataset.url) || '';
    const fileID = (e.currentTarget && e.currentTarget.dataset && e.currentTarget.dataset.fileid) || '';

    if (fileID) {
      try {
        const d = await wx.cloud.downloadFile({ fileID });
        if (d && d.tempFilePath) {
          wx.openDocument({ filePath: d.tempFilePath, showMenu: true });
          return;
        }
      } catch (_) {}
    }

    if (!url && fileID) {
      try {
        const t = await wx.cloud.getTempFileURL({ fileList: [fileID] });
        url = (((t || {}).fileList || [])[0] || {}).tempFileURL || '';
      } catch (_) {
        url = '';
      }
    }

    if (!url) {
      this.offerRegenerate(fileID);
      return;
    }

    wx.downloadFile({
      url,
      timeout: 60000,
      success: (res) => {
        if (res.statusCode === 200 && res.tempFilePath) {
          wx.openDocument({ filePath: res.tempFilePath, showMenu: true });
        } else {
          this.offerRegenerate(fileID);
        }
      },
      fail: () => this.offerRegenerate(fileID)
    });
  },

  async offerRegenerate(fileID) {
    wx.showLoading({ title: '正在重生成...', mask: true });
    try {
      const token = app.globalData.token || wx.getStorageSync('token') || '';
      const res = await wx.cloud.callFunction({
        name: 'aiChat',
        data: { action: 'regenerateFile', token, fileID: fileID || '' },
        timeout: 120000
      });
      const ret = res.result || {};
      if (!ret.success) {
        wx.showToast({ title: ret.message || '重生成失败', icon: 'none' });
        return;
      }
      wx.showToast({ title: '已重生成', icon: 'success' });
      await this.loadList();
    } catch (_) {
      wx.showToast({ title: '重生成超时，请稍后重试', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },

  async send() {
    if (this.data.sending) return;

    const message = (this.data.input || '').trim();
    const fileIDs = (this.data.pendingFiles || []).map((f) => f.fileID).filter(Boolean);
    if (!message && !fileIDs.length) return;

    this.setData({ sending: true });
    try {
      const token = app.globalData.token || wx.getStorageSync('token') || '';
      const res = await wx.cloud.callFunction({
        name: 'aiChat',
        data: { action: 'chat', token, message, fileIDs }
      });
      const ret = res.result || {};
      if (!ret.success) {
        const tip = /timeout/i.test(ret.message || '') ? '请求超时，请稍后重试' : '服务繁忙，请稍后重试';
        wx.showToast({ title: tip, icon: 'none' });
        return;
      }

      this.setData({ input: '', pendingFiles: [] });
      await this.loadList();
    } catch (_) {
      wx.showToast({ title: '发送失败(网络)', icon: 'none' });
    } finally {
      this.setData({ sending: false });
    }
  },

  onShow() {
    this.loadList();
  }
});
