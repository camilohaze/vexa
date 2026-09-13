import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/router.dart';
import '../../../core/models/paged_result.dart';
import '../../../core/theme/vexa_colors.dart';
import '../../../core/widgets/date_range_filter_bar.dart';
import '../../../core/widgets/pagination_bar.dart';
import '../../profile/data/courier_repository.dart';
import '../domain/notification_item.dart';
import '../feed_providers.dart';

/// Bandeja de notificaciones del repartidor — mismo patrón que la de
/// company, con filtro de rango de fecha y paginador reales.
class NotificationsFeedPage extends ConsumerWidget {
  const NotificationsFeedPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final filter = ref.watch(courierNotificationsFilterProvider);
    final notifications = ref.watch(courierNotificationsProvider(filter));

    void updateFilter(PageDateFilter next) =>
        ref.read(courierNotificationsFilterProvider.notifier).state = next;

    Future<void> markRead(String id) async {
      await ref.read(courierRepositoryProvider).markNotificationRead(id);
      ref.invalidate(courierNotificationsProvider);
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Notificaciones'),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings_outlined),
            tooltip: 'Preferencias',
            onPressed: () => context.push(AppRoutes.courierNotificationSettings),
          ),
        ],
      ),
      body: notifications.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (_, __) => const Center(child: Text('No se pudieron cargar las notificaciones')),
        data: (page) {
          final groups = _groupByDay(page.items);
          return Column(
            children: [
              DateRangeFilterBar(filter: filter, onChanged: updateFilter),
              Expanded(
                child: page.items.isEmpty
                    ? Center(
                        child: Text(
                          filter.hasDateRange ? 'Sin notificaciones en este rango.' : 'Sin notificaciones',
                          style: const TextStyle(color: VexaColors.gray500),
                        ),
                      )
                    : ListView(
                        padding: const EdgeInsets.fromLTRB(20, 0, 20, 0),
                        children: [
                          for (final entry in groups.entries) ...[
                            Text(entry.key.toUpperCase(),
                                style: const TextStyle(
                                    fontSize: 12, fontWeight: FontWeight.w800, color: VexaColors.gray400)),
                            const SizedBox(height: 12),
                            for (final n in entry.value)
                              Padding(
                                padding: const EdgeInsets.only(bottom: 12),
                                child: _NotificationRow(n: n, onTap: n.unread ? () => markRead(n.id) : null),
                              ),
                            const SizedBox(height: 8),
                          ],
                        ],
                      ),
              ),
              PaginationBar(result: page, onPageChanged: (p) => updateFilter(filter.copyWith(page: p))),
            ],
          );
        },
      ),
    );
  }

  Map<String, List<NotificationItem>> _groupByDay(List<NotificationItem> list) {
    final now = DateTime.now();
    final groups = <String, List<NotificationItem>>{};
    for (final n in list) {
      final diff = now.difference(DateTime(n.when.year, n.when.month, n.when.day)).inDays;
      final key = diff == 0
          ? 'Hoy'
          : diff == 1
              ? 'Ayer'
              : 'Anteriores';
      groups.putIfAbsent(key, () => []).add(n);
    }
    return groups;
  }
}

class _NotificationRow extends StatelessWidget {
  const _NotificationRow({required this.n, this.onTap});

  final NotificationItem n;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final diff = DateTime.now().difference(n.when);
    final ago = diff.inMinutes < 60
        ? 'hace ${diff.inMinutes.clamp(1, 59)} min'
        : diff.inHours < 24
            ? 'hace ${diff.inHours} h'
            : 'hace ${diff.inDays} d';
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(VexaColors.radiusLg),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: VexaColors.gray50,
          border: Border.all(color: VexaColors.gray200),
          borderRadius: BorderRadius.circular(VexaColors.radiusLg),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: n.unread ? VexaColors.success100 : VexaColors.gray200,
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(Icons.notifications, size: 16, color: VexaColors.gray700),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(n.title, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700)),
                  const SizedBox(height: 2),
                  Text(n.body, style: const TextStyle(fontSize: 13, color: VexaColors.gray600)),
                  const SizedBox(height: 4),
                  Text(ago, style: const TextStyle(fontSize: 11, color: VexaColors.gray400)),
                ],
              ),
            ),
            if (n.unread)
              Container(
                margin: const EdgeInsets.only(top: 4),
                width: 8,
                height: 8,
                decoration: const BoxDecoration(color: VexaColors.primary600, shape: BoxShape.circle),
              ),
          ],
        ),
      ),
    );
  }
}
