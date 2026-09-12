import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';
import '../domain/courier_profile.dart';

/// Vista de la empresa sobre el perfil público de un repartidor
/// (`/couriers/:id/profile` y `/reviews`, ambos con rol COMPANY/ADMIN).
class CourierDirectoryRepository {
  CourierDirectoryRepository({required ApiClient api}) : _api = api;

  final ApiClient _api;

  Future<CourierProfile> profile(String courierId) async {
    final response = await _api.dio.get<Map<String, dynamic>>('/couriers/$courierId/profile');
    return CourierProfile.fromJson(response.data ?? const {});
  }

  Future<List<CourierReview>> reviews(String courierId) async {
    final response = await _api.dio.get<dynamic>('/couriers/$courierId/reviews');
    final raw = response.data;
    if (raw is! List) return const [];
    return raw.whereType<Map>().map((m) => CourierReview.fromJson(Map<String, dynamic>.from(m))).toList();
  }
}

final courierDirectoryRepositoryProvider = Provider<CourierDirectoryRepository>(
  (ref) => CourierDirectoryRepository(api: ref.watch(apiClientProvider)),
);
