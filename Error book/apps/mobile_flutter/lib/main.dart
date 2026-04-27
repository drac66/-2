import 'dart:math';

import 'package:flutter/material.dart';

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
  final List<Mistake> items = [
    Mistake(
      id: 'm001',
      question: 'for循环边界写错导致数组越界',
      wrongAnswer: 'i <= arr.length',
      correctAnswer: 'i < arr.length',
      reason: 'length 是元素个数，最后一个索引是 length-1',
      category: 'Java',
    ),
  ];

  void addMistake(Mistake m) => setState(() => items.insert(0, m));
  void deleteMistake(String id) => setState(() => items.removeWhere((e) => e.id == id));

  @override
  Widget build(BuildContext context) {
    final pages = [
      AddPage(onAdd: addMistake),
      QueryPage(items: items, onDelete: deleteMistake),
      ReviewPage(items: items),
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
  final void Function(Mistake) onAdd;
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
            onPressed: () {
              if (q.text.trim().isEmpty) return;
              widget.onAdd(Mistake(
                id: DateTime.now().millisecondsSinceEpoch.toString(),
                question: q.text.trim(),
                wrongAnswer: w.text.trim(),
                correctAnswer: c.text.trim(),
                reason: r.text.trim(),
                category: cat.text.trim().isEmpty ? '未分类' : cat.text.trim(),
              ));
              q.clear(); w.clear(); c.clear(); r.clear(); cat.clear();
              ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('已添加错题')));
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
  final void Function(String id) onDelete;
  const QueryPage({super.key, required this.items, required this.onDelete});

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
      appBar: AppBar(title: const Text('手机端 · 错题查询')),
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
  const ReviewPage({super.key, required this.items});

  @override
  State<ReviewPage> createState() => _ReviewPageState();
}

class _ReviewPageState extends State<ReviewPage> {
  Mistake? current;
  bool showAnswer = false;

  void pick() {
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
