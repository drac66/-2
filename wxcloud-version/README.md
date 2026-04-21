# 微信云开发版（推荐稳定）

## 架构
- 小程序前端：wxcloud-version/miniprogram
- 云函数：wxcloud-version/cloudfunctions
- 云数据库：集合 messages/diary/albums/tokens
- 云存储：cloud://<env-id>/albums/*

## 功能对齐
- 微信登录（code2session）+ openid 白名单
- 留言发送/读取
- 日记发送/读取（self/both）
- 图片上传并长期保存（云存储）

## 成本目标（<=10元/月）
- 双人使用通常可压在免费额度或低于10元
- 控制点：
  - 图片上传前压缩
  - 限制视频时长/大小
  - 仅进入页面时拉取数据，不做高频轮询

## 部署步骤（简版）
1) 在微信开发者工具开通云开发环境
2) 上传并部署 cloudfunctions 下函数
3) 初始化数据库集合与索引
4) 小程序前端改为调用云函数
