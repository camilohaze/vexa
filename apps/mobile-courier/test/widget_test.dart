import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_courier/features/jobs/domain/job.dart';

void main() {
  test('Job parses backend payloads', () {
    final job = Job.fromJson({
      'id': 'job-1',
      'companyId': 'company-1',
      'status': 'OFFERED',
      'pickup': {'line1': 'Calle 1', 'city': 'Bogotá', 'lat': 4.7, 'lng': -74.0},
      'dropoff': {'line1': 'Calle 2', 'city': 'Bogotá', 'lat': 4.8, 'lng': -74.1},
      'price': 12000,
      'createdAt': '2026-01-01T00:00:00.000Z',
    });

    expect(job.id, 'job-1');
    expect(job.status, JobStatus.offered);
    expect(job.pickup.lat, 4.7);
    expect(job.price, 12000);
  });

  testWidgets('renders a Material widget', (tester) async {
    await tester.pumpWidget(const MaterialApp(home: Scaffold(body: Text('Vexa'))));
    expect(find.text('Vexa'), findsOneWidget);
  });
}
