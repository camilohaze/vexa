import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/models/paged_result.dart';
import '../../core/network/api_client.dart';
import 'domain/company_notification.dart';

final companyNotificationsFilterProvider =
    StateProvider.autoDispose<PageDateFilter>((ref) => const PageDateFilter());

final companyNotificationsProvider =
    FutureProvider.autoDispose.family<PagedResult<CompanyNotification>, PageDateFilter>((ref, filter) async {
  final api = ref.watch(apiClientProvider);
  final response = await api.dio.get<Map<String, dynamic>>(
    '/companies/me/notifications',
    queryParameters: filter.toQueryParams(),
  );
  return PagedResult.fromJson(response.data ?? const {}, CompanyNotification.fromJson);
});

Future<void> markCompanyNotificationRead(ApiClient api, String id) =>
    api.dio.patch<dynamic>('/companies/me/notifications/$id/read');
