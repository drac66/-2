# Error Book（纯手机离线版说明）

这是错题本 Flutter 客户端的 **离线版本**：
- 不依赖后端 API
- 不依赖电脑常驻服务
- 数据保存在手机本地（SharedPreferences）

## 手机上像应用一样使用

### 1) 获取代码
拉取本仓库后进入：

```bash
cd "Error book/apps/mobile_flutter"
```

### 2) 安装依赖

```bash
flutter pub get
```

### 3) 连接手机并运行

```bash
flutter run
```

首次运行会在手机安装调试版 App。

### 4) 打包 APK（给别人安装）

```bash
flutter build apk --release
```

生成文件路径：

`build/app/outputs/flutter-apk/app-release.apk`

把 APK 发到手机安装即可（记得允许“安装未知来源应用”）。

---

## 当前离线版功能

- 添加错题（题目/错答/正答/解析/分类）
- 本地搜索 + 分类筛选
- 随机复习（显示答案/下一题）
- 本地持久化（重开 app 不丢）

---

## 说明

此版本主打“手机单端可用”，因此移除了后端同步依赖。
如果后续你想加“可选云同步”（如 GitHub Gist、Supabase、你自己的 API），可以在此离线基础上再加。
