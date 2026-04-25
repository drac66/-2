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

  showBusy() {
    // 不再使用全局 showLoading，避免与页面其他流程冲突导致配对警告
  },

  hideBusy() {
    // no-op
  },

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
      success: () => wx.showToast({ title: '已复制GPT内容', icon: 'success' }),
      fail: () => wx.showToast({ title: '复制失败', icon: 'none' })
    });
  },

  async exportAsFile(e) {
    const text = (e.currentTarget && e.currentTarget.dataset && e.currentTarget.dataset.text) || '';
    const format = (e.currentTarget && e.currentTarget.dataset && e.currentTarget.dataset.format) || 'txt';
    if (!text) {
      wx.showToast({ title: '没有可导出的内容', icon: 'none' });
      return;
    }

    try {
      this.showBusy('生成文件中...');
      const token = app.globalData.token || wx.getStorageSync('token') || '';
      const res = await wx.cloud.callFunction({
        name: 'aiChat',
        data: {
          action: 'exportTxt',
          token,
          text,
          format
        }
      });
      const ret = res.result || {};
      if (!ret.success) {
        wx.showToast({ title: ret.message || '生成失败', icon: 'none' });
        return;
      }
      wx.showToast({ title: '文件已发送', icon: 'success' });
      await this.loadList();
    } catch (err) {
      wx.showToast({ title: '生成失败', icon: 'none' });
    } finally {
      this.hideBusy();
    }
  },

  scrollToBottom() {
    // 先清空再设置同一锚点，确保重复消息也能触发滚动
    this.setData({ scrollIntoView: '' });
    setTimeout(() => {
      this.setData({ scrollIntoView: 'chat-bottom-anchor' });
    }, 30);
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

          this.showBusy('上传文件中...');
          const uploaded = [];
          for (const f of files) {
            const cloudPath = `ai-input/${Date.now()}_${Math.random().toString(16).slice(2)}_${f.name || 'file'}`;
            const up = await wx.cloud.uploadFile({ cloudPath, filePath: f.path });
            uploaded.push({ fileID: up.fileID, name: f.name || '文件' });
          }

          const next = [...this.data.pendingFiles, ...uploaded];
          this.setData({ pendingFiles: next });
          wx.showToast({ title: `已加入${uploaded.length}个文件`, icon: 'success' });
        } catch (e) {
          wx.showToast({ title: '上传失败', icon: 'none' });
        } finally {
          this.hideBusy();
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

  openFile(e) {
    const url = (e.currentTarget && e.currentTarget.dataset && e.currentTarget.dataset.url) || '';
    if (!url) {
      wx.showToast({ title: '文件链接已过期，请刷新', icon: 'none' });
      return;
    }
    wx.downloadFile({
      url,
      timeout: 25000,
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

  async send() {
    if (this.data.sending) return;

    const message = (this.data.input || '').trim();
    const fileIDs = (this.data.pendingFiles || []).map((f) => f.fileID).filter(Boolean);
    if (!message && !fileIDs.length) return;

    this.setData({ sending: true });
    try {
      this.showBusy('思考中...');
      const token = app.globalData.token || wx.getStorageSync('token') || '';
      const res = await wx.cloud.callFunction({
        name: 'aiChat',
        data: { action: 'chat', token, message, fileIDs }
      });
      const ret = res.result || {};
      if (!ret.success) {
        const tip = /timeout/i.test(ret.message || '') ? '请求超时，请重试' : (ret.message || '发送失败');
        wx.showToast({ title: tip, icon: 'none' });
        return;
      }

      this.setData({ input: '', pendingFiles: [] });
      await this.loadList();
    } catch (e) {
      wx.showToast({ title: '发送失败(网络)', icon: 'none' });
    } finally {
      this.hideBusy();
      this.setData({ sending: false });
    }
  },

  onShow() {
    this.loadList();
  },

  onHide() {
    this.hideBusy();
  },

  onUnload() {
    this.hideBusy();
  }
});
