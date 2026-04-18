# 恋爱小程序（微信原生 + Java + Supabase）

> 目录：`project/`

## 已实现功能

- 相册：上传图片/视频（当前保存资源路径到数据库，适合 MVP）
- 留言板：双方互相留言
- 日记：支持“仅自己可见 / 双方可见”
- Java 后端 REST API（Spring Boot）
- Supabase(PostgreSQL) 表结构 SQL

---

## 目录结构

- `frontend/` 微信小程序前端
- `backend/` Java 后端
- `backend/sql/init.sql` Supabase 建表脚本

---

## 一、先部署 Supabase 数据库

1. 打开你的 Supabase 项目 SQL Editor
2. 复制执行：`backend/sql/init.sql`
3. 确认出现 3 张表：
   - `couple_messages`
   - `couple_diary`
   - `couple_albums`

---

## 二、启动 Java 后端

### 1) 前置

- JDK 17+
- Maven 3.9+

### 2) 环境变量（PowerShell）

> 你发过数据库信息，我建议你现在**立刻旋转密码和 key**，再使用新凭据。

```powershell
$env:DB_URL="jdbc:postgresql://db.lfgnwafzbtpheyqgjrhj.supabase.co:5432/postgres?sslmode=require"
$env:DB_USER="postgres"
$env:DB_PASSWORD="<你的新数据库密码>"
```

### 3) 启动

```powershell
cd C:\Users\damaster\.openclaw\workspace\project\backend
mvn spring-boot:run
```

成功后监听：`http://127.0.0.1:8080`

---

## 三、运行微信小程序前端（本地）

1. 安装并打开【微信开发者工具】
2. 导入项目目录：
   `C:\Users\damaster\.openclaw\workspace\project\frontend`
3. 在“详情-本地设置”中，开发阶段可勾选“不校验合法域名、TLS版本及HTTPS证书”
4. 确认 `frontend/app.js` 中：

```js
apiBase: 'http://127.0.0.1:8080'
```

5. 编译运行

---

## 四、发布到微信（你们两个人使用）

1. 注册并认证小程序账号（个人主体即可）
2. 获取 AppID
3. 在微信开发者工具中填写 AppID
4. 上传代码到微信后台
5. 提交审核（如果只体验可先走体验版）
6. 审核通过后发布

> 如果只你和女朋友使用，前期可以先通过“体验版 + 体验成员”方式快速验证。

---

## 五、上线注意点（必须做）

1. **密钥安全**
   - 不要把数据库密码硬编码到前端
   - 前端只调用你自己的 Java 后端
2. **网络安全**
   - 生产环境后端请部署 HTTPS 域名
   - 小程序后台配置 request 合法域名
3. **你刚刚在聊天里公开了数据库密码和 key**
   - 立刻去 Supabase 旋转数据库密码
   - 重新生成/替换泄露的 key

---

## 六、下一步建议（我可以继续做）

- 接入 Supabase Storage（真正上传文件到云端，不只存临时路径）
- 登录鉴权（微信 openid + 双人白名单）
- 相册按时间线/主题分组
- 日记评论与点赞
- 纪念日提醒

---

## 七、常见问题

### 1) 小程序请求不到后端

- 先确认后端已启动在 `127.0.0.1:8080`
- 开发工具里是否关闭了域名校验（仅开发阶段）

### 2) 后端连不上 Supabase

- `sslmode=require` 是否加上
- 数据库密码是否正确
- Supabase 项目是否正常运行

---

需要我下一步把“**图片/视频真正上传到 Supabase Storage**”这块也直接写进当前代码吗？
我可以继续在这个项目里补完成可上线版本。
