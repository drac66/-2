import 'dart:convert';
import 'dart:math';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

void main() => runApp(const MobileApp());

class Mistake {
  final String id;
  final String question;
  final String wrongAnswer;
  final String correctAnswer;
  final String reason;
  final String category;

  Mistake({
    required this.id,
    required this.question,
    required this.wrongAnswer,
    required this.correctAnswer,
    required this.reason,
    required this.category,
  });

  factory Mistake.fromJson(Map<String, dynamic> j) => Mistake(
        id: (j['id'] ?? '').toString(),
        question: (j['question'] ?? '').toString(),
        wrongAnswer: (j['wrongAnswer'] ?? '').toString(),
        correctAnswer: (j['correctAnswer'] ?? '').toString(),
        reason: (j['reason'] ?? '').toString(),
        category: (j['category'] ?? '未分类').toString(),
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'question': question,
        'wrongAnswer': wrongAnswer,
        'correctAnswer': correctAnswer,
        'reason': reason,
        'category': category,
      };
}

class MistakeApi {
  // Android 模拟器请改成: http://10.0.2.2:8787
  final String baseUrl;
  MistakeApi({this.baseUrl = 'http://127.0.0.1:8787'});

  Future<List<Mistake>> list({String keyword = '', String category = '全部分类'}) async {
    final uri = Uri.parse('$baseUrl/mistakes').replace(queryParameters: {
      'keyword': keyword,
      'category': category,
    });
    final res = await http.get(uri);
    if (res.statusCode ~/ 100 != 2) throw Exception('list failed: ${res.statusCode}');
    final arr = jsonDecode(res.body) as List<dynamic>;
    return arr.map((e) => Mistake.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<Mistake> add(Mistake m) async {
    final res = await http.post(
      Uri.parse('$baseUrl/mistakes'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode(m.toJson()),
    );
    if (res.statusCode ~/ 100 != 2) throw Exception('add failed: ${res.statusCode}');
    return Mistake.fromJson(jsonDecode(res.body) as Map<String, dynamic>);
  }

  Future<void> remove(String id) async {
    final res = await http.delete(Uri.parse('$baseUrl/mistakes/$id'));
    if (res.statusCode ~/ 100 != 2) throw Exception('delete failed: ${res.statusCode}');
  }

  Future<Mistake?> randomOne() async {
    final res = await http.get(Uri.parse('$baseUrl/mistakes/random'));
    if (res.statusCode ~/ 100 != 2) throw Exception('random failed: ${res.statusCode}');
    if (res.body.trim() == 'null') return null;
    return Mistake.fromJson(jsonDecode(res.body) as Map<String, dynamic>);
  }
}

class LocalCache {
  static const _k = 'mistakes_cache';

  Future<void> save(List<Mistake> items) async {
    final sp = await SharedPreferences.getInstance();
    await sp.setString(_k, jsonEncode(items.map((e) => e.toJson()).toList()));
  }

  Future<List<Mistake>> load() async {
    final sp = await SharedPreferences.getInstance();
    final raw = sp.getString(_k);
    if (raw == null || raw.isEmpty) return [];
    final arr = jsonDecode(raw) as List<dynamic>;
    return arr.map((e) => Mistake.fromJson(e as Map<String, dynamic>)).toList();
  }
}

class MobileApp extends StatelessWidget {
  const MobileApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Error Book Mobile',
      theme: ThemeData(useMaterial3: true, colorSchemeSeed: Colors.green),
      home: const MobileHome(),
    );
  }
}

class MobileHome extends StatefulWidget {
  const MobileHome({super.key});

  @override
  State<MobileHome> createState() => _MobileHomeState();
}

class _MobileHomeState extends State<MobileHome> {
  int tab = 0;
  List<Mistake> items = [];
  bool loading = true;

  final api = MistakeApi();
  final cache = LocalCache();

  @override
  void initState() {
    super.initState();
    _init();
  }

  Future<void> _init() async {
    final local = await cache.load();
    if (mounted) {
      setState(() {
        items = local;
        loading = false;
      });
    }
    await reloadFromServer(silent: true);
  }

  Future<void> reloadFromServer({bool silent = false}) async {
    try {
      final remote = await api.list();
      if (mounted) setState(() => items = remote);
      await cache.save(remote);
      if (mounted && !silent) _toast('已从后端同步');
    } catch (_) {
      if (mounted && !silent) _toast('后端不可用，使用本地缓存');
    }
  }

  Future<void> addMistake(Mistake m) async {
    try {
      await api.add(m);
      await reloadFromServer(silent: true);
      _toast('已添加并同步');
    } catch (_) {
      final next = [m, ...items];
      setState(() => items = next);
      await cache.save(next);
      _toast('后端不可用，已保存到本地缓存');
    }
  }

  Future<void> deleteMistake(String id) async {
    try {
      await api.remove(id);
      await reloadFromServer(silent: true);
      _toast('已删除并同步');
    } catch (_) {
      final next = items.where((e) => e.id != id).toList();
      setState(() => items = next);
      await cache.save(next);
      _toast('后端不可用，本地已删除');
    }
  }

  void _toast(String msg) => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));

  @override
  Widget build(BuildContext context) {
    if (loading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    final pages = [
      AddPage(onAdd: addMistake),
      QueryPage(items: items, onDelete: deleteMistake, onRefresh: reloadFromServer),
      ReviewPage(items: items, api: api),
    ];

    return Scaffold(
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
  final cat = TextEditingController();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('手机端 · 添加错题')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _field('题干', q),
          _field('错误答案', w),
          _field('正确答案', c),
          _field('错误原因', r),
          _field('分类', cat),
          const SizedBox(height: 12),
          FilledButton(
            onPressed: () async {
              if (q.text.trim().isEmpty) return;
              await widget.onAdd(Mistake(
                id: DateTime.now().millisecondsSinceEpoch.toString(),
                question: q.text.trim(),
                wrongAnswer: w.text.trim(),
                correctAnswer: c.text.trim(),
                reason: r.text.trim(),
                category: cat.text.trim().isEmpty ? '未分类' : cat.text.trim(),
              ));
              q.clear();
              w.clear();
              c.clear();
              r.clear();
              cat.clear();
            },
            child: const Text('保存错题'),
          )
        ],
      ),
    );
  }

  Widget _field(String label, TextEditingController ctrl) => Padding(
        padding: const EdgeInsets.only(bottom: 10),
        child: TextField(
          controller: ctrl,
          decoration: InputDecoration(labelText: label, border: const OutlineInputBorder()),
          maxLines: label == '题干' || label == '错误原因' ? 3 : 1,
        ),
      );
}

class QueryPage extends StatefulWidget {
  final List<Mistake> items;
  final Future<void> Function(String id) onDelete;
  final Future<void> Function({bool silent}) onRefresh;
  const QueryPage({super.key, required this.items, required this.onDelete, required this.onRefresh});

  @override
  State<QueryPage> createState() => _QueryPageState();
}

class _QueryPageState extends State<QueryPage> {
  String keyword = '';

  @override
  Widget build(BuildContext context) {
    final filtered = widget.items
        .where((e) => e.question.contains(keyword) || e.reason.contains(keyword) || e.category.contains(keyword))
        .toList();

    return Scaffold(
      appBar: AppBar(
        title: const Text('手机端 · 错题查询'),
        actions: [
          IconButton(
            onPressed: () => widget.onRefresh(silent: false),
            icon: const Icon(Icons.sync),
            tooltip: '同步后端',
          )
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(12),
            child: TextField(
              decoration: const InputDecoration(prefixIcon: Icon(Icons.search), hintText: '关键词搜索（题干/原因/分类）', border: OutlineInputBorder()),
              onChanged: (v) => setState(() => keyword = v.trim()),
            ),
          ),
          Expanded(
            child: filtered.isEmpty
                ? const Center(child: Text('没有匹配到错题'))
                : ListView.builder(
                    itemCount: filtered.length,
                    itemBuilder: (_, i) {
                      final m = filtered[i];
                      return Card(
                        margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        child: ListTile(
                          title: Text(m.question, maxLines: 1, overflow: TextOverflow.ellipsis),
                          subtitle: Text('分类: ${m.category}\n原因: ${m.reason}', maxLines: 2, overflow: TextOverflow.ellipsis),
                          isThreeLine: true,
                          trailing: IconButton(
                            icon: const Icon(Icons.delete_outline),
                            onPressed: () => widget.onDelete(m.id),
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
  final MistakeApi api;
  const ReviewPage({super.key, required this.items, required this.api});

  @override
  State<ReviewPage> createState() => _ReviewPageState();
}

class _ReviewPageState extends State<ReviewPage> {
  Mistake? current;
  bool showAnswer = false;

  Future<void> pick() async {
    try {
      final remote = await widget.api.randomOne();
      if (remote != null) {
        setState(() {
          current = remote;
          showAnswer = false;
        });
        return;
      }
    } catch (_) {}

    if (widget.items.isEmpty) return;
    final m = widget.items[Random().nextInt(widget.items.length)];
    setState(() {
      current = m;
      showAnswer = false;
    });
  }

  @override
  void initState() {
    super.initState();
    if (widget.items.isNotEmpty) current = widget.items.first;
  }

  @override
  Widget build(BuildContext context) {
    final m = current;
    return Scaffold(
      appBar: AppBar(title: const Text('手机端 · 随机复习')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: m == null
            ? const Center(child: Text('暂无错题，请先添加'))
            : Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('题干', style: Theme.of(context).textTheme.titleMedium),
                  const SizedBox(height: 6),
                  Text(m.question),
                  const SizedBox(height: 16),
                  if (showAnswer) ...[
                    Text('正确答案：${m.correctAnswer}'),
                    const SizedBox(height: 8),
                    Text('错误原因：${m.reason}'),
                  ] else
                    const Text('先自己作答，再点“显示答案”'),
                  const Spacer(),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          onPressed: pick,
                          child: const Text('换一题'),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: FilledButton(
                          onPressed: () => setState(() => showAnswer = true),
                          child: const Text('显示答案'),
                        ),
                      ),
                    ],
                  )
                ],
              ),
      ),
    );
  }
}
