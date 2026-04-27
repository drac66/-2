import 'package:flutter/material.dart';

void main() => runApp(const MobileApp());

class MobileApp extends StatelessWidget {
  const MobileApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Error Book Mobile',
      home: const Scaffold(
        body: Center(child: Text('Mobile Skeleton')),
      ),
    );
  }
}
