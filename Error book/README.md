# Error Book（多端错题本）

一个支持 **电脑端 + 手机端 + 统一后端** 的错题本项目。

## 目录结构
- `apps/desktop_java`：Java Swing 电脑端
- `apps/mobile_flutter`：Flutter 手机端
- `backend/mock-api`：Node.js Mock API
- `packages/`：共享模型/Schema

## 环境要求
- **Node.js 18+**（后端）
- **JDK 17+**（电脑端）
- **Flutter 3.x**（手机端）

---

## 一、最快启动（Windows）
在仓库根目录执行：

```bat
run-all.bat
```

作用：
- 自动启动后端 `backend/mock-api`
- 自动启动电脑端 `apps/desktop_java`

如果你还要跑手机端，再执行：

```bat
run-mobile.bat
```

---

## 二、分端手动启动

### 1) 启动后端
```bash
cd backend/mock-api
node server.js
```

启动后地址：`http://127.0.0.1:8787`

### 2) 启动电脑端（Java）
```bat
cd apps\desktop_java
run.bat
```

### 3) 启动手机端（Flutter）
```bash
cd apps/mobile_flutter
flutter pub get
flutter run
```

---

## 三、手机端后端地址说明（重要）
手机端默认请求：`http://127.0.0.1:8787`

不同运行环境请改成：
- Android 模拟器：`http://10.0.2.2:8787`
- iOS 模拟器：`http://127.0.0.1:8787`
- 真机调试：改成你电脑局域网 IP（如 `http://192.168.x.x:8787`）

---

## 四、后端 API
- `GET /mistakes?keyword=&category=`
- `GET /mistakes/random`
- `POST /mistakes`
- `PUT /mistakes/:id`
- `DELETE /mistakes/:id`
- `GET /stats`

---

## 五、已完成功能

### 电脑端（Java Swing）
- 错题新增
- 错题查询（分类 / 关键词）
- 随机复习
- 错题编辑 / 删除
- 统计面板（总数 + 分类计数）
- 对接统一后端 API

### 手机端（Flutter）
- 错题新增
- 错题查询（关键词）
- 随机复习（优先后端随机）
- 错题删除
- 本地缓存持久化（shared_preferences）
- 手动同步后端

---

## 六、常见问题

### Q1：手机端连不上后端？
优先检查：
1. 后端是否已启动（8787端口）
2. 手机端 Base URL 是否与运行环境匹配（见上文）
3. 真机是否与电脑在同一局域网

### Q2：我只想给别人源码，怎么发？
直接打包整个 `Error book` 文件夹即可（仓库已清理 IDE/构建缓存）。

