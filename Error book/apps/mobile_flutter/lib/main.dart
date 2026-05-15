import 'dart:convert';
import 'dart:math';

import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  runApp(const ErrorBookApp());
}

class Mistake {
  final String id;
  final String question;
  final String wrongAnswer;
  final String correctAnswer;
  final String reason;
  final String category;
  final DateTime createdAt;

  Mistake({
    required this.id,
    required this.question,
    required this.wrongAnswer,
    required this.correctAnswer,
    required this.reason,
    required this.category,
    required this.createdAt,
  });

  Map<String, dynamic> toJson() => {
        'id': id,
        'question': question,
        'wrongAnswer': wrongAnswer,
        'correctAnswer': correctAnswer,
        'reason': reason,
        'category': category,
        'createdAt': createdAt.toIso8601String(),
      };

  factory Mistake.fromJson(Map<String, dynamic> j) => Mistake(
        id: (j['id'] ?? '').toString(),
        question: (j['question'] ?? '').toString(),
        wrongAnswer: (j['wrongAnswer'] ?? '').toString(),
        correctAnswer: (j['correctAnswer'] ?? '').toString(),
        reason: (j['reason'] ?? '').toString(),
        category: (j['category'] ?? '未分类').toString(),
        createdAt: DateTime.tryParse((j['createdAt'] ?? '').toString()) ?? DateTime.now(),
      );
}

class LocalStore {
  static const _key = 'error_book_local_data_v2';

  Future<List<Mistake>> load() async {
    final sp = await SharedPreferences.getInstance();
    final raw = sp.getString(_key);
    if (raw == null || raw.isEmpty) return [];
    final arr = jsonDecode(raw) as List<dynamic>;
    return arr.map((e) => Mistake.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<void> save(List<Mistake> data) async {
    final sp = await SharedPreferences.getInstance();
    await sp.setString(_key, jsonEncode(data.map((e) => e.toJson()).toList()));
  }

  Future<String> exportJson(List<Mistake> data) async {
    final payload = {
      'schema': 'error_book_export_v1',
      'exportedAt': DateTime.now().toIso8601String(),
      'count': data.length,
      'items': data.map((e) => e.toJson()).toList(),
    };
    final json = const JsonEncoder.withIndent('  ').convert(payload);
    final sp = await SharedPreferences.getInstance();
    await sp.setString('${_key}_export_last', json);
    return json;
  }

  Future<int> importJson(String raw) async {
    final decoded = jsonDecode(raw);
    if (decoded is! Map<String, dynamic>) {
      throw const FormatException('格式错误：根节点必须是对象');
    }
    final items = decoded['items'];
    if (items is! List) {
      throw const FormatException('格式错误：缺少 items 数组');
    }
    final list = items
        .whereType<Map>()
        .map((e) => Mistake.fromJson(Map<String, dynamic>.from(e)))
        .toList();
    await save(list);
    return list.length;
  }
}

class ErrorBookApp extends StatelessWidget {
  const ErrorBookApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: '错题本（纯离线版）',
      theme: ThemeData(useMaterial3: true, colorSchemeSeed: Colors.teal),
      home: const HomePage(),
    );
  }
}

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  final store = LocalStore();
  final random = Random();

  List<Mistake> items = [];
  String keyword = '';
  String category = '全部';
  int tab = 0;
  bool loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final data = await store.load();
    if (!mounted) return;
    setState(() {
      items = data;
      loading = false;
    });
  }

  Future<void> _save() => store.save(items);

  Future<void> addMistake(Mistake m) async {
    setState(() => items = [m, ...items]);
    await _save();
  }

  Future<void> deleteMistake(String id) async {
    setState(() => items = items.where((e) => e.id != id).toList());
    await _save();
  }

  List<Mistake> get filtered {
    return items.where((m) {
      final okCategory = category == '全部' || m.category == category;
      final k = keyword.trim().toLowerCase();
      final okKeyword = k.isEmpty ||
          m.question.toLowerCase().contains(k) ||
          m.wrongAnswer.toLowerCase().contains(k) ||
          m.correctAnswer.toLowerCase().contains(k) ||
          m.reason.toLowerCase().contains(k);
      return okCategory && okKeyword;
    }).toList();
  }

  Set<String> get categories => {'全部', ...items.map((e) => e.category)};

  Future<void> _showDataTools() async {
    final controller = TextEditingController();
    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(
          left: 12,
          right: 12,
          top: 12,
          bottom: MediaQuery.of(ctx).viewInsets.bottom + 12,
        ),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('数据迁移（离线）', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
              const SizedBox(height: 8),
              const Text('导出会生成 JSON 文本，可复制到聊天/备忘录；导入时把 JSON 粘贴回来即可。'),
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () async {
                        final json = await store.exportJson(items);
                        controller.text = json;
                        if (!mounted) return;
                        ScaffoldMessenger.of(context)
                            .showSnackBar(SnackBar(content: Text('已导出 ${items.length} 条，可复制下方 JSON')));
                      },
                      icon: const Icon(Icons.upload_file_outlined),
                      label: const Text('导出 JSON'),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: FilledButton.icon(
                      onPressed: () async {
                        try {
                          final count = await store.importJson(controller.text.trim());
                          await _load();
                          if (!mounted) return;
                          Navigator.pop(ctx);
                          ScaffoldMessenger.of(context)
                              .showSnackBar(SnackBar(content: Text('导入成功，共 $count 条')));
                        } catch (e) {
                          if (!mounted) return;
                          ScaffoldMessenger.of(context)
                              .showSnackBar(SnackBar(content: Text('导入失败：$e')));
                        }
                      },
                      icon: const Icon(Icons.download_outlined),
                      label: const Text('导入 JSON'),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              TextField(
                controller: controller,
                maxLines: 14,
                decoration: const InputDecoration(
                  border: OutlineInputBorder(),
                  hintText: '这里会显示导出的 JSON，或粘贴待导入 JSON',
                ),
              ),
              const SizedBox(height: 6),
              const Text('提示：导入会覆盖当前本地数据。', style: TextStyle(color: Colors.redAccent)),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (loading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    final pages = [
      AddPage(onAdd: addMistake),
      ListPage(
        items: filtered,
        keyword: keyword,
        category: category,
        categories: categories.toList(),
        onKeywordChanged: (v) => setState(() => keyword = v),
        onCategoryChanged: (v) => setState(() => category = v),
        onDelete: deleteMistake,
      ),
      ReviewPage(items: items, random: random),
    ];

    return Scaffold(
      appBar: AppBar(
        title: const Text('错题本（纯手机离线）'),
        actions: [
          IconButton(
            tooltip: '数据导入/导出',
            onPressed: _showDataTools,
            icon: const Icon(Icons.import_export),
          )
        ],
      ),
      body: pages[tab],
      bottomNavigationBar: NavigationBar(
        selectedIndex: tab,
        onDestinationSelected: (i) => setState(() => tab = i),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.add_circle_outline), label: '添加'),
          NavigationDestination(icon: Icon(Icons.search), label: '查询'),
          NavigationDestination(icon: Icon(Icons.school_outlined), label: '复习'),
        ],
      ),
    );
  }
}

class AddPage extends StatefulWidget {
  final Future<void> Function(Mistake) onAdd;
  const AddPage({super.key, required this.onAdd});

  @override
  State<AddPage> createState() => _AddPageState();
}

class _AddPageState extends State<AddPage> {
  final q = TextEditingController();
  final w = TextEditingController();
  final c = TextEditingController();
  final r = TextEditingController();
  final cat = TextEditingController(text: '未分类');

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(12),
      child: ListView(
        children: [
          TextField(controller: q, decoration: const InputDecoration(labelText: '题目')),
          TextField(controller: w, decoration: const InputDecoration(labelText: '错误答案')),
          TextField(controller: c, decoration: const InputDecoration(labelText: '正确答案')),
          TextField(controller: r, decoration: const InputDecoration(labelText: '错误原因/解析')),
          TextField(controller: cat, decoration: const InputDecoration(labelText: '分类（如 数学/英语）')),
          const SizedBox(height: 14),
          FilledButton.icon(
            onPressed: () async {
              if (q.text.trim().isEmpty) {
                ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('题目不能为空')));
                return;
              }
              final m = Mistake(
                id: DateTime.now().millisecondsSinceEpoch.toString(),
                question: q.text.trim(),
                wrongAnswer: w.text.trim(),
                correctAnswer: c.text.trim(),
                reason: r.text.trim(),
                category: cat.text.trim().isEmpty ? '未分类' : cat.text.trim(),
                createdAt: DateTime.now(),
              );
              await widget.onAdd(m);
              if (!mounted) return;
              q.clear();
              w.clear();
              c.clear();
              r.clear();
              cat.text = '未分类';
              ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('已保存到本机')));
            },
            icon: const Icon(Icons.save_outlined),
            label: const Text('保存错题（离线）'),
          )
        ],
      ),
    );
  }
}

class ListPage extends StatelessWidget {
  final List<Mistake> items;
  final String keyword;
  final String category;
  final List<String> categories;
  final ValueChanged<String> onKeywordChanged;
  final ValueChanged<String> onCategoryChanged;
  final Future<void> Function(String id) onDelete;

  const ListPage({
    super.key,
    required this.items,
    required this.keyword,
    required this.category,
    required this.categories,
    required this.onKeywordChanged,
    required this.onCategoryChanged,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(12),
      child: Column(
        children: [
          TextField(
            decoration: const InputDecoration(prefixIcon: Icon(Icons.search), hintText: '关键词搜索'),
            onChanged: onKeywordChanged,
          ),
          const SizedBox(height: 8),
          DropdownButtonFormField<String>(
            value: categories.contains(category) ? category : '全部',
            items: categories.map((e) => DropdownMenuItem(value: e, child: Text(e))).toList(),
            onChanged: (v) => onCategoryChanged(v ?? '全部'),
            decoration: const InputDecoration(labelText: '分类'),
          ),
          const SizedBox(height: 8),
          Expanded(
            child: items.isEmpty
                ? const Center(child: Text('暂无数据'))
                : ListView.builder(
                    itemCount: items.length,
                    itemBuilder: (_, i) {
                      final m = items[i];
                      return Card(
                        child: ListTile(
                          title: Text(m.question),
                          subtitle: Text('分类: ${m.category}\n错: ${m.wrongAnswer}\n对: ${m.correctAnswer}'),
                          isThreeLine: true,
                          trailing: IconButton(
                            icon: const Icon(Icons.delete_outline),
                            onPressed: () async {
                              await onDelete(m.id);
                              if (context.mounted) {
                                ScaffoldMessenger.of(context)
                                    .showSnackBar(const SnackBar(content: Text('已删除')));
                              }
                            },
                          ),
                        ),
                      );
                    },
                  ),
          )
        ],
      ),
    );
  }
}

class ReviewPage extends StatefulWidget {
  final List<Mistake> items;
  final Random random;
  const ReviewPage({super.key, required this.items, required this.random});

  @override
  State<ReviewPage> createState() => _ReviewPageState();
}

class _ReviewPageState extends State<ReviewPage> {
  Mistake? current;
  bool showAnswer = false;

  @override
  void initState() {
    super.initState();
    _next();
  }

  void _next() {
    if (widget.items.isEmpty) {
      setState(() => current = null);
      return;
    }
    final idx = widget.random.nextInt(widget.items.length);
    setState(() {
      current = widget.items[idx];
      showAnswer = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (current == null) {
      return const Center(child: Text('暂无错题可复习'));
    }
    final m = current!;
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('分类：${m.category}', style: const TextStyle(color: Colors.teal)),
          const SizedBox(height: 8),
          Text('题目：${m.question}', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
          const SizedBox(height: 8),
          Text('你的错答：${m.wrongAnswer}'),
          const SizedBox(height: 14),
          if (showAnswer) ...[
            Text('正确答案：${m.correctAnswer}', style: const TextStyle(color: Colors.green)),
            const SizedBox(height: 6),
            Text('解析：${m.reason}'),
          ] else
            const Text('先想一想，再点“显示答案” 👇'),
          const Spacer(),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: () => setState(() => showAnswer = !showAnswer),
                  child: Text(showAnswer ? '隐藏答案' : '显示答案'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: FilledButton(
                  onPressed: _next,
                  child: const Text('下一题'),
                ),
              ),
            ],
          )
        ],
      ),
    );
  }
}
