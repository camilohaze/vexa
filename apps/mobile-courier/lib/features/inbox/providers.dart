import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/network/api_client.dart';
import 'domain/company_notification.dart';

final companyNotificationsProvider = FutureProvider<List<CompanyNotification>>((ref) async {
  final api = ref.watch(apiClientProvider);
  final response = await api.dio.get<dynamic>('/companies/me/notifications');
  final raw = response.data;
  if (raw is! List) return const [];
  return raw
      .whereType<Map>()
      .map((m) => CompanyNotification.fromJson(Map<String, dynamic>.from(m)))
      .toList();
});
