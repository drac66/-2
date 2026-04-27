import 'package:flutter/material.dart';

void main() => runApp(const DesktopApp());

class DesktopApp extends StatelessWidget {
  const DesktopApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Error Book Desktop',
      home: Scaffold(
        body: Row(
          children: const [
            Expanded(child: Center(child: Text('筛选区'))),
            VerticalDivider(width: 1),
            Expanded(child: Center(child: Text('列表区'))),
            VerticalDivider(width: 1),
            Expanded(child: Center(child: Text('详情区'))),
          ],
        ),
      ),
    );
  }
}
