Page({
  onShow() {
    const token = wx.getStorageSync('token');
    if (!token) {
      wx.reLaunch({ url: '/pages/login/login' });
    }
  },
  toAlbum() { wx.navigateTo({ url: '/pages/album/album' }); },
  toMessages() { wx.navigateTo({ url: '/pages/messages/messages' }); },
  toDiary() { wx.navigateTo({ url: '/pages/diary/diary' }); }
})
