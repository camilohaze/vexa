import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/models/paged_result.dart';
import '../../../core/network/api_client.dart';

enum CourierStatus {
  offline('OFFLINE', 'Desconectado'),
  available('AVAILABLE', 'Disponible'),
  busy('BUSY', 'Ocupado');

  const CourierStatus(this.value, this.label);

  final String value;
  final String label;

  static CourierStatus fromValue(Object? raw) => values.firstWhere(
        (status) => status.value == raw,
        orElse: () => CourierStatus.offline,
      );
}

class CourierRepository {
  CourierRepository({required ApiClient api}) : _api = api;

  final ApiClient _api;

  Future<CourierStatus> fetchStatus() async {
    final response = await _api.dio.get<Map<String, dynamic>>('/couriers/me');
    return CourierStatus.fromValue(response.data?['status']);
  }

  Future<Map<String, dynamic>> fetchEarnings() async {
    final response =
        await _api.dio.get<Map<String, dynamic>>('/couriers/me/earnings');
    return response.data ?? const {};
  }

  Future<Map<String, dynamic>> fetchTransactions(PageDateFilter filter) async {
    final response = await _api.dio.get<Map<String, dynamic>>(
      '/couriers/me/transactions',
      queryParameters: filter.toQueryParams(),
    );
    return response.data ?? const {};
  }

  Future<Map<String, dynamic>> fetchVerification() async {
    final response =
        await _api.dio.get<Map<String, dynamic>>('/couriers/me/verification');
    return response.data ?? const {};
  }

  Future<void> submitVerification(String type, List<String> urls,
      {Map<String, dynamic>? meta}) {
    return _api.dio.post<dynamic>(
      '/couriers/me/verification',
      data: {'type': type, 'urls': urls, if (meta != null) 'meta': meta},
    );
  }

  Future<void> updateVehicle(Map<String, dynamic> details) =>
      _api.dio.patch<dynamic>('/couriers/me/vehicle', data: details);

  Future<void> requestPayout(double amount, String method) => _api.dio
      .post<dynamic>('/couriers/me/payouts', data: {'amount': amount, 'method': method});

  Future<Map<String, dynamic>> fetchPayouts(PageDateFilter filter) async {
    final response = await _api.dio.get<Map<String, dynamic>>(
      '/couriers/me/payouts',
      queryParameters: filter.toQueryParams(),
    );
    return response.data ?? const {};
  }

  Future<Map<String, dynamic>> fetchBonuses(PageDateFilter filter) async {
    final response = await _api.dio.get<Map<String, dynamic>>(
      '/couriers/me/bonuses',
      queryParameters: filter.toQueryParams(),
    );
    return response.data ?? const {};
  }

  Future<Map<String, dynamic>> fetchMyReviews(PageDateFilter filter) async {
    final response = await _api.dio.get<Map<String, dynamic>>(
      '/couriers/me/reviews',
      queryParameters: filter.toQueryParams(),
    );
    return response.data ?? const {};
  }

  Future<Map<String, dynamic>> fetchNotifications(PageDateFilter filter) async {
    final response = await _api.dio.get<Map<String, dynamic>>(
      '/couriers/me/notifications',
      queryParameters: filter.toQueryParams(),
    );
    return response.data ?? const {};
  }

  Future<void> markNotificationRead(String id) =>
      _api.dio.patch<dynamic>('/couriers/me/notifications/$id/read');

  Future<Map<String, dynamic>> fetchPerformance() async {
    final response =
        await _api.dio.get<Map<String, dynamic>>('/couriers/me/performance');
    return response.data ?? const {};
  }

  Future<Map<String, dynamic>> fetchRewards() async {
    final response =
        await _api.dio.get<Map<String, dynamic>>('/couriers/me/rewards');
    return response.data ?? const {};
  }

  Future<List<Map<String, dynamic>>> fetchPayoutMethods() async {
    final response =
        await _api.dio.get<List<dynamic>>('/couriers/me/payout-methods');
    return (response.data ?? const [])
        .whereType<Map>()
        .map(Map<String, dynamic>.from)
        .toList();
  }

  Future<CourierStatus> updateStatus(CourierStatus status) async {
    final response = await _api.dio.patch<Map<String, dynamic>>(
      '/couriers/me/status',
      data: {'status': status.value},
    );
    return CourierStatus.fromValue(response.data?['status'] ?? status.value);
  }
}

final courierRepositoryProvider = Provider<CourierRepository>(
  (ref) => CourierRepository(api: ref.watch(apiClientProvider)),
);
