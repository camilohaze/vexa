import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/router.dart';
import '../../../core/theme/vexa_colors.dart';
import '../../../core/widgets/vexa_bottom_nav.dart';
import '../../jobs/domain/job.dart';
import '../providers.dart';

enum _Filter { all, inTransit, pending }

final _filterProvider = StateProvider.autoDispose<_Filter>((ref) => _Filter.all);

/// Figma: active-deliveries.
class CompanyJobsListPage extends ConsumerWidget {
  const CompanyJobsListPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final jobs = ref.watch(companyJobsProvider);
    final filter = ref.watch(_filterProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Envíos activos'),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_none),
            onPressed: () => context.push(AppRoutes.companyNotifications),
          ),
        ],
      ),
      body: jobs.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (_, __) => const Center(child: Text('No se pudieron cargar los envíos')),
        data: (all) {
          final active = all.where((j) => !j.status.isFinished).toList();
          final filtered = switch (filter) {
            _Filter.all => active,
            _Filter.inTransit =>
              active.where((j) => j.status == JobStatus.inTransit || j.status == JobStatus.pickedUp).toList(),
            _Filter.pending =>
              active.where((j) => j.status == JobStatus.pending || j.status == JobStatus.offered).toList(),
          };
          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(companyJobsProvider),
            child: ListView(
              padding: const EdgeInsets.all(24),
              children: [
                Row(
                  children: [
                    _FilterChip(label: 'Todos', selected: filter == _Filter.all,
                        onTap: () => ref.read(_filterProvider.notifier).state = _Filter.all),
                    const SizedBox(width: 8),
                    _FilterChip(label: 'En camino', selected: filter == _Filter.inTransit,
                        onTap: () => ref.read(_filterProvider.notifier).state = _Filter.inTransit),
                    const SizedBox(width: 8),
                    _FilterChip(label: 'Pendientes', selected: filter == _Filter.pending,
                        onTap: () => ref.read(_filterProvider.notifier).state = _Filter.pending),
                  ],
                ),
                const SizedBox(height: 20),
                if (filtered.isEmpty)
                  const Padding(
                    padding: EdgeInsets.only(top: 40),
                    child: Center(
                      child: Text('No hay envíos en esta categoría', style: TextStyle(color: VexaColors.gray500)),
                    ),
                  )
                else
                  for (final job in filtered)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 16),
                      child: _DeliveryCard(
                        job: job,
                        onTap: () => context.push(AppRoutes.companyJob(job.id)),
                      ),
                    ),
              ],
            ),
          );
        },
      ),
      bottomNavigationBar: const VexaBottomNav(current: 1, items: VexaBottomNav.companyItems),
    );
  }
}

class _FilterChip extends StatelessWidget {
  const _FilterChip({required this.label, required this.selected, required this.onTap});

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: selected ? VexaColors.primary600 : VexaColors.gray50,
      borderRadius: BorderRadius.circular(VexaColors.radiusMd),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(VexaColors.radiusMd),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(VexaColors.radiusMd),
            border: Border.all(color: selected ? VexaColors.primary600 : VexaColors.gray200),
          ),
          child: Text(label,
              style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: selected ? Colors.white : VexaColors.gray600)),
        ),
      ),
    );
  }
}

class _DeliveryCard extends StatelessWidget {
  const _DeliveryCard({required this.job, required this.onTap});

  final Job job;
  final VoidCallback onTap;

  double get _progress => switch (job.status) {
        JobStatus.accepted => 0.25,
        JobStatus.pickedUp => 0.5,
        JobStatus.inTransit => 0.75,
        _ => 0.1,
      };

  Color get _badgeColor => switch (job.status) {
        JobStatus.inTransit => VexaColors.primary600,
        JobStatus.pickedUp => VexaColors.warning500,
        _ => VexaColors.gray500,
      };

  Color get _badgeBg => switch (job.status) {
        JobStatus.inTransit => VexaColors.primary50,
        JobStatus.pickedUp => VexaColors.warning100,
        _ => VexaColors.gray100,
      };

  @override
  Widget build(BuildContext context) {
    return Material(
      color: VexaColors.gray50,
      borderRadius: BorderRadius.circular(VexaColors.radiusLg),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(VexaColors.radiusLg),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            border: Border.all(color: VexaColors.gray200),
            borderRadius: BorderRadius.circular(VexaColors.radiusLg),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(children: [
                    CircleAvatar(
                      radius: 16,
                      backgroundColor: VexaColors.primary100,
                      backgroundImage: job.courierAvatarUrl != null
                          ? NetworkImage(job.courierAvatarUrl!) : null,
                      child: job.courierAvatarUrl == null
                          ? const Icon(Icons.person, size: 16, color: VexaColors.primary700) : null,
                    ),
                    const SizedBox(width: 8),
                    Text(job.courierName ?? 'Sin asignar',
                        style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700)),
                  ]),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(color: _badgeBg, borderRadius: BorderRadius.circular(6)),
                    child: Text(job.status.label.toUpperCase(),
                        style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: _badgeColor)),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(color: VexaColors.gray100, borderRadius: BorderRadius.circular(8)),
                  child: const Icon(Icons.inventory_2_outlined, size: 18, color: VexaColors.gray600),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('#${job.id.substring(0, 6).toUpperCase()}'
                          '${job.weightKg != null ? ' • ${job.weightKg}kg' : ''}',
                          style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
                      Text('${job.pickup.short} → ${job.dropoff.short}',
                          style: const TextStyle(fontSize: 12, color: VexaColors.gray600),
                          maxLines: 1, overflow: TextOverflow.ellipsis),
                    ],
                  ),
                ),
              ]),
              const SizedBox(height: 10),
              ClipRRect(
                borderRadius: BorderRadius.circular(100),
                child: LinearProgressIndicator(
                  value: _progress,
                  minHeight: 6,
                  backgroundColor: VexaColors.gray100,
                  valueColor: AlwaysStoppedAnimation(_badgeColor),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
