import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/models/paged_result.dart';
import '../profile/data/courier_repository.dart';
import 'domain/notification_item.dart';

/// Bandeja de notificaciones del repartidor (distinto de `providers.dart`,
/// que maneja las preferencias/toggles de la pantalla de Configuración).
final courierNotificationsFilterProvider =
    StateProvider.autoDispose<PageDateFilter>((ref) => const PageDateFilter());

final courierNotificationsProvider =
    FutureProvider.autoDispose.family<PagedResult<NotificationItem>, PageDateFilter>((ref, filter) async {
  try {
    final data = await ref.watch(courierRepositoryProvider).fetchNotifications(filter);
    return PagedResult.fromJson(data, NotificationItem.fromJson);
  } catch (_) {
    return PagedResult.empty();
  }
});
