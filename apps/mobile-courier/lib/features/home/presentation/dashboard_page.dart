import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../../app/router.dart';
import '../../../core/theme/vexa_colors.dart';
import '../../../core/widgets/vexa_bottom_nav.dart';
import '../../auth/providers.dart';
import '../../earnings/providers.dart';
import '../../jobs/presentation/widgets/job_offer_card.dart';
import '../../jobs/providers.dart';
import '../../profile/data/courier_repository.dart';
import '../../profile/providers.dart';

/// Figma: courier-dashboard. Greeting + ONLINE toggle, earnings hero,
/// stats row, ofertas cercanas, actividad reciente.
class DashboardPage extends ConsumerWidget {
  const DashboardPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(currentUserProvider);
    final status = ref.watch(courierStatusProvider);
    final jobs = ref.watch(offeredJobsProvider);
    final earnings = ref.watch(earningsSummaryProvider);
    final txs = ref.watch(walletTransactionsProvider);
    final online = status.valueOrNull == CourierStatus.available;
    final theme = Theme.of(context);
    final today = earnings.valueOrNull?.today ?? 0;
    final completed = earnings.valueOrNull?.completed ?? 0;
    final lastTx = txs.valueOrNull?.firstOrNull;

    ref.listen<AsyncValue<dynamic>>(newJobStreamProvider, (prev, next) {
      next.whenData((job) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Nueva oferta: ${job.pickup.short}'),
            action: SnackBarAction(
              label: 'Ver',
              onPressed: () => context.push(AppRoutes.courierJob(job.id)),
            ),
          ),
        );
      });
    });

    return Scaffold(
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () => ref.read(offeredJobsProvider.notifier).refresh(),
          child: ListView(
            padding: const EdgeInsets.fromLTRB(24, 8, 24, 24),
            children: [
              // Header: saludo + toggle ONLINE
              Row(
                children: [
                  CircleAvatar(
                    radius: 20,
                    backgroundColor: VexaColors.primary100,
                    backgroundImage: user?.avatarUrl != null
                        ? NetworkImage(user!.avatarUrl!)
                        : null,
                    child: user?.avatarUrl == null
                        ? const Icon(Icons.person, color: VexaColors.primary700)
                        : null,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Hola, ${user?.fullName.split(' ').first ?? 'repartidor'}!',
                            style: theme.textTheme.titleMedium
                                ?.copyWith(fontWeight: FontWeight.w600)),
                        const Text('Vexa Express Partner',
                            style: TextStyle(
                                fontSize: 12, color: VexaColors.gray500)),
                      ],
                    ),
                  ),
                  _OnlineToggle(
                    online: online,
                    loading: status.isLoading,
                    onChanged: (v) => ref
                        .read(courierStatusProvider.notifier)
                        .setAvailable(v),
                  ),
                ],
              ),
              const SizedBox(height: 20),

              // Earnings hero
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: VexaColors.gray900,
                  borderRadius: BorderRadius.circular(VexaColors.radiusLg),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('GANANCIAS DE HOY',
                        style: TextStyle(
                            fontSize: 11, letterSpacing: 0.8,
                            color: Colors.white60, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 10),
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text('\$${today.toStringAsFixed(2)}',
                            style: theme.textTheme.displaySmall?.copyWith(
                                color: Colors.white,
                                fontWeight: FontWeight.w700)),
                        const SizedBox(width: 8),
                        const Padding(
                          padding: EdgeInsets.only(bottom: 8),
                          child: Text('Ganancias hoy',
                              style: TextStyle(
                                  fontSize: 13, color: VexaColors.success300)),
                        ),
                      ],
                    ),
                    const Divider(color: Colors.white24, height: 28),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('$completed entregas completadas',
                            style: TextStyle(
                                fontSize: 12, color: Colors.white70)),
                        GestureDetector(
                          onTap: () => context.go(AppRoutes.courierEarnings),
                          child: const Text('Ver desglose',
                              style: TextStyle(
                                  fontSize: 12,
                                  color: VexaColors.secondary300,
                                  fontWeight: FontWeight.w600)),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // Stats row
              Row(
                children: [
                  _StatBox(label: 'Hoy', value: '$completed pedidos'),
                  const SizedBox(width: 12),
                  _StatBox(label: 'Esta semana', value: '${(earnings.valueOrNull?.completed ?? 0)} pedidos'),
                  const SizedBox(width: 12),
                  _StatBox(label: 'Rating', value: '★ ${(earnings.valueOrNull?.rating ?? 0).toStringAsFixed(2)}'),
                ],
              ),
              const SizedBox(height: 24),

              // Nearby offers
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Ofertas cercanas (${jobs.valueOrNull?.length ?? 0})',
                    style: theme.textTheme.titleSmall
                        ?.copyWith(fontWeight: FontWeight.w700),
                  ),
                  TextButton(
                    onPressed: () => context.go(AppRoutes.courierJobBoard),
                    child: const Text('Ver todas'),
                  ),
                ],
              ),
              switch (jobs) {
                AsyncData(value: final items) when items.isNotEmpty =>
                  JobOfferCard(job: items.first),
                _ => const Card(
                    child: Padding(
                      padding: EdgeInsets.all(16),
                      child: Text('No hay ofertas cerca por ahora',
                          style: TextStyle(color: VexaColors.gray500)),
                    ),
                  ),
              },
              const SizedBox(height: 16),

              // Recent activity
              Text('Actividad reciente',
                  style: theme.textTheme.titleSmall
                      ?.copyWith(fontWeight: FontWeight.w700)),
              const SizedBox(height: 8),
              if (lastTx != null)
                _ActivityItem(
                  icon: Icons.check_circle,
                  title: lastTx.title,
                  subtitle:
                      '${lastTx.subtitle} • ${NumberFormat.currency(locale: 'es_CO', symbol: r'$', decimalDigits: 0).format(lastTx.amount)}',
                )
              else
                const _ActivityItem(
                  icon: Icons.info,
                  title: 'Sin actividad reciente',
                  subtitle: 'Completa tu primera entrega para ver movimientos',
                ),
            ],
          ),
        ),
      ),
      bottomNavigationBar: const VexaBottomNav(current: 0, items: VexaBottomNav.courierItems),
    );
  }
}

class _OnlineToggle extends StatelessWidget {
  const _OnlineToggle({
    required this.online,
    required this.loading,
    required this.onChanged,
  });

  final bool online;
  final bool loading;
  final ValueChanged<bool> onChanged;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: online ? VexaColors.success50 : VexaColors.gray100,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(
            color: online ? VexaColors.success300 : VexaColors.gray200),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(online ? 'EN LÍNEA' : 'OFFLINE',
              style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  color: online
                      ? VexaColors.success700
                      : VexaColors.gray500)),
          Transform.scale(
            scale: 0.7,
            child: Switch(
              value: online,
              onChanged: loading ? null : onChanged,
            ),
          ),
        ],
      ),
    );
  }
}

class _StatBox extends StatelessWidget {
  const _StatBox({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(VexaColors.radiusMd),
          border: Border.all(color: VexaColors.gray200),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label,
                style: const TextStyle(fontSize: 11, color: VexaColors.gray500)),
            const SizedBox(height: 4),
            Text(value,
                style: const TextStyle(
                    fontSize: 15, fontWeight: FontWeight.w700)),
          ],
        ),
      ),
    );
  }
}

class _ActivityItem extends StatelessWidget {
  const _ActivityItem({
    required this.icon,
    required this.title,
    required this.subtitle,
  });

  final IconData icon;
  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: EdgeInsets.zero,
      child: ListTile(
        leading: CircleAvatar(
          radius: 16,
          backgroundColor: VexaColors.success100,
          child: Icon(icon, size: 18, color: VexaColors.success700),
        ),
        title: Text(title,
            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
        subtitle: Text(subtitle,
            style: const TextStyle(fontSize: 12, color: VexaColors.gray500)),
      ),
    );
  }
}
