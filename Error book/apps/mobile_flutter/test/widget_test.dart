// Basic smoke test for current app entry.
import 'package:flutter_test/flutter_test.dart';

import 'package:error_book_mobile/main.dart';

void main() {
  testWidgets('App renders home screen', (WidgetTester tester) async {
    await tester.pumpWidget(const MobileApp());

    // App should render without crashing.
    expect(find.byType(MobileApp), findsOneWidget);
  });
}
