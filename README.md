# Error Book（离线错题本）

Error Book 现在以“可独立安装、离线可用”为主线：Android 端可打包成 APK，本机 SQLite 保存错题和图片路径；Java Swing 桌面端使用本地 JSON 文件保存数据。Node Mock API 仍保留在仓库中，但不再是手机端或桌面端的运行依赖。

## 技术栈
- 移动端：Flutter + SQLite（sqflite）+ 应用私有图片目录 + image_picker + ML Kit on-device OCR（`apps/mobile_flutter`）
- 桌面端：Java 17 + Swing + Gson + 本地 JSON 仓储（`apps/desktop_java`）
- 历史/测试工具：Node.js 原生 Mock API + JSON 文件存储（`backend/mock-api`）

## 主要功能
- 首页学习仪表盘：总错题、待复习、已掌握、最近复习
- 题库卡片列表：错题本、关键词、掌握状态筛选
- 添加/编辑错题：题干、错误答案、正确答案、解析、分类、标签、图片、OCR
- 翻卡复习：先看题干，再显示答案，并记录“还不会 / 继续复习 / 已掌握”
- 设置页：统计、重建示例数据、导出本机调试 JSON
- 桌面端离线新增、编辑、删除、搜索、随机复习、统计

## 数据模型
核心字段为：

```json
{
  "id": "m001",
  "notebookId": "default",
  "question": "题干",
  "wrongAnswer": "错误答案",
  "correctAnswer": "正确答案",
  "reason": "错误原因",
  "category": "分类",
  "tags": [],
  "questionImagePath": "",
  "wrongAnswerImagePath": "",
  "correctAnswerImagePath": "",
  "masteryStatus": "new",
  "reviewCount": 0,
  "createdAt": "2026-05-15T00:00:00.000",
  "updatedAt": "2026-05-15T00:00:00.000",
  "lastReviewedAt": null
}
```

## Android APK
```bash
cd apps/mobile_flutter
flutter pub get
flutter analyze
flutter test
flutter build apk --release
```

生成文件：

```text
apps/mobile_flutter/build/app/outputs/flutter-apk/app-release.apk
```

第一版 release APK 使用 debug signing，适合直接安装测试，不用于应用商店发布。

## 桌面端
```bat
cd apps\desktop_java
run.bat
```

桌面数据默认保存到：

```text
%USERPROFILE%\.error-book\desktop-mistakes.json
```

如果该文件不存在，首次启动会从 `backend/mock-api/db.json` 导入一份初始数据。

## Mock API（可选）
Node 后端只作为历史兼容和接口测试工具：

```bash
cd backend/mock-api
npm start
```

## 测试
```bash
cd backend/mock-api
npm test
```

```bat
cd apps\desktop_java
gradlew.bat test
```

```bash
cd apps/mobile_flutter
flutter analyze
flutter test
flutter build apk --release
```
