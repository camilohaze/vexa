import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/router.dart';
import '../../../core/theme/vexa_colors.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/widgets/vexa_bottom_nav.dart';
import '../../auth/providers.dart';
import '../../deliveries/providers.dart';
import '../../settings/providers.dart';
import '../../jobs/domain/job.dart';

/// Figma: company-dashboard.
class CompanyDashboardPage extends ConsumerWidget {
  const CompanyDashboardPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(currentUserProvider);
    final profile = ref.watch(companyProfileProvider).valueOrNull;
    final jobs = ref.watch(companyJobsProvider).valueOrNull?.items ?? const <Job>[];
    final active = jobs.where((j) => !j.status.isFinished).length;
    final completed = jobs.where((j) => j.status == JobStatus.delivered).length;
    final pending = jobs.where((j) => j.status == JobStatus.pending).length;
    final recent = [...jobs]..sort((a, b) => b.createdAt.compareTo(a.createdAt));

    return Scaffold(
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () async => ref.invalidate(companyJobsProvider),
          child: ListView(
            padding: const EdgeInsets.fromLTRB(24, 8, 24, 24),
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Vexa Dashboard',
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800)),
                  IconButton(
                    icon: const Icon(Icons.notifications_none),
                    onPressed: () => context.push(AppRoutes.companyNotifications),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text('Hola, ${profile?.name ?? user?.fullName ?? 'empresa'}',
                  style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: VexaColors.gray800)),
              const Text('Gestiona tus envíos y el seguimiento de rutas.',
                  style: TextStyle(fontSize: 14, color: VexaColors.gray600)),
              const SizedBox(height: 20),
              Row(
                children: [
                  _StatCard(label: 'Activos', value: '$active', color: VexaColors.primary600),
                  const SizedBox(width: 12),
                  _StatCard(label: 'Completados', value: '$completed', color: VexaColors.success500),
                  const SizedBox(width: 12),
                  _StatCard(label: 'Pendientes', value: '$pending', color: VexaColors.warning500),
                ],
              ),
              const SizedBox(height: 24),
              const Text('ACCIONES RÁPIDAS',
                  style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: VexaColors.gray800)),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: _ActionCard(
                      icon: Icons.add_circle_outline,
                      label: 'Nuevo envío',
                      primary: true,
                      onTap: () => context.push(AppRoutes.companyJobCreate),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _ActionCard(
                      icon: Icons.explore_outlined,
                      label: 'Rastrear',
                      onTap: () => context.push(AppRoutes.companyTrack),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _ActionCard(
                      icon: Icons.account_balance_wallet_outlined,
                      label: 'Billetera',
                      onTap: () => context.push(AppRoutes.companyWallet),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('ACTIVIDAD RECIENTE',
                      style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: VexaColors.gray800)),
                  TextButton(
                    onPressed: () => context.push(AppRoutes.companyJobs),
                    child: const Text('Ver todo'),
                  ),
                ],
              ),
              const SizedBox(height: 4),
              if (recent.isEmpty)
                const Card(
                  child: Padding(
                    padding: EdgeInsets.all(16),
                    child: Text('Sin actividad reciente', style: TextStyle(color: VexaColors.gray500)),
                  ),
                )
              else
                for (final job in recent.take(5))
                  _ActivityItem(job: job, onTap: () => context.push(AppRoutes.companyJob(job.id))),
            ],
          ),
        ),
      ),
      bottomNavigationBar: const VexaBottomNav(current: 0, items: VexaBottomNav.companyItems),
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({required this.label, required this.value, required this.color});

  final String label;
  final String value;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: VexaColors.gray50,
          border: Border.all(color: VexaColors.gray200),
          borderRadius: BorderRadius.circular(VexaColors.radiusLg),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label.toUpperCase(),
                style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: VexaColors.gray600)),
            const SizedBox(height: 6),
            Text(value, style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: color)),
          ],
        ),
      ),
    );
  }
}

class _ActionCard extends StatelessWidget {
  const _ActionCard({required this.icon, required this.label, required this.onTap, this.primary = false});

  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final bool primary;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: primary ? VexaColors.primary600 : VexaColors.gray50,
      borderRadius: BorderRadius.circular(VexaColors.radiusLg),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(VexaColors.radiusLg),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 16),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(VexaColors.radiusLg),
            border: primary ? null : Border.all(color: VexaColors.gray200),
          ),
          child: Column(
            children: [
              Icon(icon, color: primary ? Colors.white : VexaColors.gray700),
              const SizedBox(height: 8),
              Text(label,
                  style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: primary ? Colors.white : VexaColors.gray800)),
            ],
          ),
        ),
      ),
    );
  }
}

class _ActivityItem extends StatelessWidget {
  const _ActivityItem({required this.job, required this.onTap});

  final Job job;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final money = AppFormatters.money;
    final done = job.status == JobStatus.delivered;
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        onTap: onTap,
        leading: CircleAvatar(
          radius: 16,
          backgroundColor: done ? VexaColors.success100 : VexaColors.primary50,
          child: Icon(done ? Icons.check_circle : Icons.local_shipping,
              size: 18, color: done ? VexaColors.success700 : VexaColors.primary600),
        ),
        title: Text('${job.pickup.city.isEmpty ? job.pickup.line1 : job.pickup.city} → '
            '${job.dropoff.city.isEmpty ? job.dropoff.line1 : job.dropoff.city}',
            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
        subtitle: Text('${job.status.label} • ${money(job.price)}',
            style: const TextStyle(fontSize: 12, color: VexaColors.gray500)),
      ),
    );
  }
}
