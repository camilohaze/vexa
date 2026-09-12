import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/vexa_colors.dart';
import '../../../core/widgets/company_app_bar.dart';
import '../domain/company_notification.dart';
import '../providers.dart';

/// Figma: notifications-screen.
class NotificationsScreenPage extends ConsumerWidget {
  const NotificationsScreenPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notifications = ref.watch(companyNotificationsProvider);

    return Scaffold(
      appBar: companyAppBar(context, 'Notificaciones'),
      body: notifications.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (_, __) => const Center(child: Text('No se pudieron cargar las notificaciones')),
        data: (list) {
          if (list.isEmpty) {
            return const Center(child: Text('Sin notificaciones', style: TextStyle(color: VexaColors.gray500)));
          }
          final groups = _groupByDay(list);
          return ListView(
            padding: const EdgeInsets.all(24),
            children: [
              for (final entry in groups.entries) ...[
                Text(entry.key.toUpperCase(),
                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: VexaColors.gray400)),
                const SizedBox(height: 12),
                for (final n in entry.value)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: _NotificationRow(n: n),
                  ),
                const SizedBox(height: 8),
              ],
            ],
          );
        },
      ),
    );
  }

  Map<String, List<CompanyNotification>> _groupByDay(List<CompanyNotification> list) {
    final now = DateTime.now();
    final groups = <String, List<CompanyNotification>>{};
    for (final n in list) {
      final diff = now.difference(DateTime(n.when.year, n.when.month, n.when.day)).inDays;
      final key = diff == 0 ? 'Hoy' : diff == 1 ? 'Ayer' : 'Anteriores';
      groups.putIfAbsent(key, () => []).add(n);
    }
    return groups;
  }
}

class _NotificationRow extends StatelessWidget {
  const _NotificationRow({required this.n});

  final CompanyNotification n;

  @override
  Widget build(BuildContext context) {
    final diff = DateTime.now().difference(n.when);
    final ago = diff.inMinutes < 60
        ? 'hace ${diff.inMinutes.clamp(1, 59)} min'
        : diff.inHours < 24
            ? 'hace ${diff.inHours} h'
            : 'hace ${diff.inDays} d';
    return Container(
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
              width: 8, height: 8,
              decoration: const BoxDecoration(color: VexaColors.primary600, shape: BoxShape.circle),
            ),
        ],
      ),
    );
  }
}
