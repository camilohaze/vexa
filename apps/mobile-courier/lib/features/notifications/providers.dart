import 'package:flutter_riverpod/flutter_riverpod.dart';

class NotificationCategory {
  const NotificationCategory({
    required this.id,
    required this.title,
    required this.subtitle,
    required this.enabled,
  });

  final String id;
  final String title;
  final String subtitle;
  final bool enabled;

  NotificationCategory copyWith({bool? enabled}) => NotificationCategory(
        id: id,
        title: title,
        subtitle: subtitle,
        enabled: enabled ?? this.enabled,
      );
}

class NotificationPrefs {
  const NotificationPrefs({
    required this.enabled,
    required this.quietHours,
    required this.categories,
  });

  final bool enabled;
  final bool quietHours;
  final List<NotificationCategory> categories;

  NotificationPrefs copyWith({
    bool? enabled,
    bool? quietHours,
    List<NotificationCategory>? categories,
  }) =>
      NotificationPrefs(
        enabled: enabled ?? this.enabled,
        quietHours: quietHours ?? this.quietHours,
        categories: categories ?? this.categories,
      );
}

final notificationPrefsProvider =
    StateNotifierProvider<NotificationPrefsNotifier, NotificationPrefs>(
  (ref) => NotificationPrefsNotifier(),
);

class NotificationPrefsNotifier extends StateNotifier<NotificationPrefs> {
  NotificationPrefsNotifier()
      : super(const NotificationPrefs(
          enabled: true,
          quietHours: false,
          categories: [
            NotificationCategory(
              id: 'delivery-status',
              title: 'Estado de entregas',
              subtitle: 'Seguimiento en tiempo real de tus envíos asignados',
              enabled: true,
            ),
            NotificationCategory(
              id: 'payouts',
              title: 'Pagos y finanzas',
              subtitle: 'Avisos sobre transferencias y movimientos de billetera',
              enabled: true,
            ),
            NotificationCategory(
              id: 'job-recommendations',
              title: 'Nuevos pedidos sugeridos',
              subtitle: 'Alertas cuando un pedido cercano coincide con tu vehículo',
              enabled: false,
            ),
            NotificationCategory(
              id: 'platform-messages',
              title: 'Mensajes de la plataforma',
              subtitle: 'Chats y avisos de clientes o del equipo Vexa',
              enabled: true,
            ),
          ],
        ));

  void setEnabled(bool value) => state = state.copyWith(enabled: value);
  void setQuietHours(bool value) => state = state.copyWith(quietHours: value);
  void setCategory(String id, bool value) => state = state.copyWith(
        categories: [
          for (final c in state.categories)
            c.id == id ? c.copyWith(enabled: value) : c,
        ],
      );
}
