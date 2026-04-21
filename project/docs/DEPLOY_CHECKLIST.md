# Love App 部署与验收（稳定登录/消息/图片永久保存）

## 目标
- 不减少现有功能（登录、消息、日记、相册）
- 仅你和你女朋友可登录（openid 白名单）
- 消息可稳定发送
- 图片可稳定上传与长期保存（后端持久化存储）

## 已完成的代码改造
1. 登录链路增强（backend/AuthController）
   - 增加微信接口 HTTP 超时控制
   - 更清晰错误信息（包含微信 errcode/errmsg）
   - 保留 openid 白名单机制（仅白名单可登录）

2. 权限模型增强
   - MessageController / DiaryController / AlbumController 写入作者来源改为 token 解析，避免前端伪造 sender/author/owner

3. 图片上传改造（frontend+backend）
   - 前端 album 页改为 wx.uploadFile 上传真实文件
   - 后端新增 /api/albums/upload（multipart/form-data）
   - 后端保存文件到 uploads/albums/ 并持久化相对地址 /uploads/albums/xxx
   - 新增静态资源映射 /uploads/**

4. 前端网络鲁棒性
   - login/messages/diary/album 请求统一增加 timeout 和状态码判断
   - 失败提示从“笼统失败”升级为更可定位的错误

## 你必须配置（部署前）
### 1) 后端环境变量
- WECHAT_APPID=你的小程序 AppID
- WECHAT_SECRET=你的小程序 AppSecret
- WECHAT_OPENID_WHITELIST=openid_你,openid_她
- DB_URL=你的 Postgres 连接串（可 Supabase）
- DB_USER=...
- DB_PASSWORD=...

### 2) 数据库初始化
执行 backend/sql/init.sql

### 3) 图片目录持久化（非常关键）
需要把后端运行目录下的 uploads/ 绑定到持久磁盘（云盘/挂载卷），否则重建容器会丢图。

## 微信小程序发布前要求
1. 后端使用 HTTPS 域名（不要内网 IP）
2. 小程序后台配置 request 合法域名（https://你的域名）
3. frontend/app.js 的 apiBase 改成正式 HTTPS 域名
4. 关闭开发者工具“忽略合法域名/证书”后仍可正常请求

## 验收清单
- [ ] 你能登录
- [ ] 她能登录
- [ ] 白名单外账号提示 no permission
- [ ] 你和她都能发送消息并互相可见
- [ ] 你和她都能上传图片并互相可见
- [ ] 重启后端后历史图片链接仍可打开

## 备注
当前“永久保存”定义为：
- 元数据存 PostgreSQL（长期）
- 文件存服务器持久卷 uploads/（长期）
如果需要更高可靠（跨服务器/自动CDN/多副本），下一步可升级到对象存储（如 Supabase Storage / COS / OSS）。
