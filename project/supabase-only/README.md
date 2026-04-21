# Supabase-only 版本（无自建服务器）

## 架构
- 前端：微信小程序（project/supabase-only/frontend）
- 后端：Supabase Edge Functions
- 数据：Supabase Postgres
- 图片：Supabase Storage（bucket: albums）
- 鉴权：微信 code2session + openid 白名单

## 目录
- supabase/schema.sql
- supabase/functions/wx-login/index.ts
- supabase/functions/messages/index.ts
- supabase/functions/diary/index.ts
- supabase/functions/albums-list/index.ts
- supabase/functions/albums-upload/index.ts
- supabase/.env.example

## 核心原则
- 仅白名单 openid 可登录
- token 存 kv 表（或可改为 jwt）
- 图片上传后存 storage，数据库仅存公开 URL

## 部署步骤（简版）
1. 在 Supabase 执行 schema.sql
2. 配置函数环境变量（WECHAT_APPID/SECRET/OPENID_WHITELIST）
3. 部署 edge functions
4. 把 frontend/app.js apiBase 改成你的 functions gateway 域名

## 成本控制（目标 <= 10 元/月）
- 图片压缩后再传（建议 <= 500KB）
- 每次只上传 1 张
- 减少轮询，页面 onShow 才加载
- 开启 Storage 生命周期（可选）
