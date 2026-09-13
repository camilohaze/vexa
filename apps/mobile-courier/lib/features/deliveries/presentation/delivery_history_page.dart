import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/router.dart';
import '../../../core/models/paged_result.dart';
import '../../../core/theme/vexa_colors.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/widgets/company_app_bar.dart';
import '../../../core/widgets/date_range_filter_bar.dart';
import '../../../core/widgets/pagination_bar.dart';
import '../../jobs/domain/job.dart';
import '../providers.dart';

/// Figma: delivery-history — filtro de rango de fecha y paginador, ambos
/// aplicados por el backend (no solo la página actual).
class DeliveryHistoryPage extends ConsumerWidget {
  const DeliveryHistoryPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final filter = ref.watch(companyHistoryFilterProvider);
    final history = ref.watch(companyHistoryProvider(filter));
    final money = AppFormatters.money;
    final date = AppFormatters.date;

    void updateFilter(PageDateFilter next) =>
        ref.read(companyHistoryFilterProvider.notifier).state = next;

    return Scaffold(
      appBar: companyAppBar(context, 'Historial de envíos'),
      body: history.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (_, __) => const Center(child: Text('No se pudo cargar el historial')),
        data: (result) => Column(
          children: [
            DateRangeFilterBar(filter: filter, onChanged: updateFilter),
            Expanded(
              child: RefreshIndicator(
                onRefresh: () async => ref.invalidate(companyHistoryProvider),
                child: ListView(
                  padding: const EdgeInsets.fromLTRB(24, 8, 24, 0),
                  children: [
                    if (result.page.items.isEmpty)
                      Padding(
                        padding: const EdgeInsets.only(top: 40),
                        child: Center(
                          child: Text(
                            filter.hasDateRange ? 'Sin envíos entregados en este rango.' : 'Aún no hay envíos entregados',
                            style: const TextStyle(color: VexaColors.gray500),
                          ),
                        ),
                      )
                    else
                      for (final job in result.page.items)
                        Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: _HistoryCard(
                            job: job, money: money, date: date,
                            onTap: () => context.push(AppRoutes.companyJob(job.id)),
                          ),
                        ),
                  ],
                ),
              ),
            ),
            PaginationBar(
              result: PagedResult(
                items: result.page.items,
                total: result.page.total,
                page: result.page.page,
                pageSize: result.page.pageSize,
              ),
              onPageChanged: (p) => updateFilter(filter.copyWith(page: p)),
            ),
          ],
        ),
      ),
    );
  }
}

class _HistoryCard extends StatelessWidget {
  const _HistoryCard({required this.job, required this.money, required this.date, required this.onTap});

  final Job job;
  final String Function(num) money;
  final String Function(DateTime) date;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final cancelled = job.status == JobStatus.cancelled;
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
                  Text('${date(job.createdAt)} • VX-${job.id.substring(0, 6).toUpperCase()}',
                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: VexaColors.gray400)),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: cancelled ? VexaColors.error100 : VexaColors.success100,
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(job.status.label.toUpperCase(),
                        style: TextStyle(
                            fontSize: 11, fontWeight: FontWeight.w700,
                            color: cancelled ? VexaColors.error700 : VexaColors.success700)),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text(job.packageTypeLabel ?? 'Envío', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
              Text('${job.pickup.short} → ${job.dropoff.short}',
                  style: const TextStyle(fontSize: 13, color: VexaColors.gray600),
                  maxLines: 1, overflow: TextOverflow.ellipsis),
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(money(job.price),
                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: VexaColors.primary600)),
                  const Text('Detalles →', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: VexaColors.primary600)),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
