# Error Book（多端错题本）

## 技术栈
- 电脑端：Java Swing（`apps/desktop_java`）
- 手机端：Flutter（`apps/mobile_flutter`）
- 统一字段：`packages/shared_schema/mistake.schema.json`

## 已完成功能
### 电脑端（Java）
1. 错题添加
2. 错题查询（分类/关键词）
3. 随机复习
4. 错题编辑/删除
5. 本地 JSON 存储

### 手机端（Flutter）
1. 错题添加
2. 错题查询（关键词）
3. 随机复习
4. 错题删除

## 快速运行
### Java 电脑端
```bat
cd apps\desktop_java
run.bat
```

### Flutter 手机端
```bash
cd apps/mobile_flutter
flutter pub get
flutter run
```

## 下一步建议
- 手机端加本地持久化（shared_preferences/sqflite）
- 两端统一接后端 API（CloudBase/Supabase）
- 增加“分类筛选 + 编辑 + 复习统计”
