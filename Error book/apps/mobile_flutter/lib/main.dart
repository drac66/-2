import 'package:flutter/material.dart';

void main() => runApp(const MobileApp());

class MobileApp extends StatelessWidget {
  const MobileApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Error Book Mobile',
      home: Scaffold(
        appBar: AppBar(title: const Text('手机端（Flutter）')),
        body: const Center(child: Text('TODO: 添加/复习/搜索')),
      ),
    );
  }
}
