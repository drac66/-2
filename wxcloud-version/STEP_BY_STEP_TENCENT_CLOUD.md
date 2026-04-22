# wxcloud-version：从 0 到跑通（腾讯云/微信云开发）

> 适用场景：你一个人先开发，后续再加女朋友一起用。
> 当前项目已改成纯 wx.cloud（不依赖 Supabase / 外部 HTTP API）。

## 0. 你需要准备什么

你来做：
1) 微信开发者工具可以正常打开
2) 当前云环境可用（你已有：`dsx57-d1gpxn8u87a6ddbb8`）
3) 手机微信可扫码预览

我已做：
- 已把前端改为云函数 + 云存储调用
- 已写入 envId
- 已加“开发阶段免白名单开关”（`enforceWhitelist: false`）

---

## 1. 导入并确认项目结构

在微信开发者工具中导入：
- 目录：`wxcloud-version/miniprogram`

确保同级有：
- `wxcloud-version/cloudfunctions`

如果工具里看不到云函数目录：
- 在项目设置中确认“云开发”开启
- 或重新导入项目（目录指向 `wxcloud-version` 根目录再选择小程序源）

---

## 2. 部署云函数（必须）

依次对以下目录执行“上传并部署：云端安装依赖”：
1) `cloudfunctions/wxlogin`
2) `cloudfunctions/messages`
3) `cloudfunctions/diary`
4) `cloudfunctions/albumsUpload`
5) `cloudfunctions/albumsList`

成功标准：
- 每个函数部署后无报错
- 云开发控制台可看到 5 个函数

---

## 3. 创建数据库集合（必须）

在云开发控制台 -> 文档型数据库，创建 4 个集合：
1) `tokens`
2) `messages`
3) `diary`
4) `albums`

权限先用开发默认（先跑通，最后再收口）。

---

## 4. 运行与验证（按页面）

### 4.1 登录
- 打开登录页，点“微信登录”
- 预期：跳转到 home

若失败：
- 看控制台是否 `wxlogin` 未部署 / env 错误

### 4.2 留言
- 进入 messages，发一条文本
- 预期：列表出现新留言
- 在数据库 `messages` 能看到记录

### 4.3 日记
- 进入 diary，填标题+内容，点保存
- 预期：列表出现日记
- 在 `diary` 集合能看到记录

### 4.4 相册
- 进入 album，选图上传
- 预期：上传成功并显示图片
- `albums` 集合有记录
- 云存储有对应 `albums/...` 文件

---

## 5. 当前关键配置位置（你可能会用到）

1) 小程序云环境初始化：
- `miniprogram/app.js`

2) 云函数配置（白名单开关 + envId）：
- `cloudfunctions/config.js`

3) 登录白名单判断：
- `cloudfunctions/wxlogin/index.js`

---

## 6. 你后续要提供给我的信息（最后上锁用）

等你准备好再给：
1) 你的 openid
2) 女朋友的 openid

我会做：
- 把 `openidWhitelist` 填成真实值
- 把 `enforceWhitelist` 改成 `true`
- 给你一份最终数据库权限规则（最小权限）

---

## 7. 常见报错排查

1) `Error: timeout`
- 常见原因：云函数未部署、网络问题、envId 不对

2) `Function not found`
- 云函数没上传部署成功

3) `unauthorized`
- token 不存在/失效，先重新登录

4) 图片上传成功但列表不显示
- `wx.cloud.getTempFileURL` 获取临时链接失败；检查 fileID 是否是 `cloud://` 开头

---

## 8. 成本控制（先免费额度优先）

1) 只开当前环境，不新增环境
2) 图片上传前压缩（后续可加）
3) 列表分页（后续可加）
4) 关闭不必要高频刷新

---

## 9. 当前状态结论

你现在可以不买域名、不买传统服务器，直接把小程序核心功能跑通。
等功能稳定后，再做白名单和权限收口即可。
