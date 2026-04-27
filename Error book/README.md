# Error Book（多端错题本）

## 技术栈
- 电脑端：Java Swing（`apps/desktop_java`）
- 手机端：Flutter（`apps/mobile_flutter`）
- 统一后端：Node.js Mock API（`backend/mock-api`）

## 已完成功能
### 电脑端（Java）
1. 错题添加
2. 错题查询（分类/关键词）
3. 随机复习
4. 错题编辑/删除
5. 统计面板（总数 + 分类计数）
6. 对接统一后端 API

### 手机端（Flutter）
1. 错题添加
2. 错题查询（关键词）
3. 随机复习（优先后端随机）
4. 错题删除
5. 本地缓存持久化（shared_preferences）
6. 对接统一后端 API（含手动同步）

### 后端（Mock API）
- `GET /mistakes`
- `POST /mistakes`
- `PUT /mistakes/:id`
- `DELETE /mistakes/:id`
- `GET /mistakes/random`
- `GET /stats`

## 一键启动（Windows）
在 `Error book` 根目录：
```bat
run-all.bat
```
- 会自动拉起后端和 Java 电脑端（分别在新窗口）
- 手机端可按提示执行 `run-mobile.bat` 或手动 `flutter run`

## 快速运行（手动）
### 1) 启动后端
```bash
cd backend/mock-api
node server.js
```

### 2) 启动 Java 电脑端
```bat
cd apps\desktop_java
run.bat
```

### 3) 启动 Flutter 手机端
```bash
cd apps/mobile_flutter
flutter pub get
flutter run
```

## 说明
- 手机端默认请求 `http://127.0.0.1:8787`，安卓模拟器改为 `http://10.0.2.2:8787`。
