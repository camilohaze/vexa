import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../../core/models/paged_result.dart';
import '../../../core/theme/vexa_colors.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/widgets/date_range_filter_bar.dart';
import '../../../core/widgets/pagination_bar.dart';
import '../domain/job.dart';
import '../providers.dart';

/// Figma: courier-delivery-history ("Completed Jobs") — filtro de rango de
/// fecha y filas con ruta, stats, precio y rating, paginado por el backend.
class DeliveryHistoryPage extends ConsumerWidget {
  const DeliveryHistoryPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final filter = ref.watch(courierHistoryFilterProvider);
    final history = ref.watch(courierHistoryProvider(filter));
    final page = history.valueOrNull ?? PagedResult<Job>.empty();
    final money = AppFormatters.money;

    void updateFilter(PageDateFilter next) =>
        ref.read(courierHistoryFilterProvider.notifier).state = next;

    return Scaffold(
      appBar: AppBar(title: const Text('Pedidos completados')),
      body: Column(
        children: [
          DateRangeFilterBar(filter: filter, onChanged: updateFilter),
          Expanded(
            child: switch (history) {
              AsyncData() when page.items.isEmpty => Center(
                  child: Text(
                    filter.hasDateRange ? 'Sin entregas en este rango.' : 'Aún no tienes entregas completadas.',
                    style: const TextStyle(fontSize: 13, color: VexaColors.gray500),
                  ),
                ),
              AsyncData(value: final _) => ListView.builder(
                  padding: const EdgeInsets.fromLTRB(16, 4, 16, 0),
                  itemCount: page.items.length,
                  itemBuilder: (context, i) {
                    final job = page.items[i];
                    return _HistoryRow(job: job, money: money);
                  },
                ),
              AsyncError() =>
                const Center(child: Text('No se pudo cargar el historial')),
              _ => const Center(child: CircularProgressIndicator()),
            },
          ),
          PaginationBar(result: page, onPageChanged: (p) => updateFilter(filter.copyWith(page: p))),
        ],
      ),
    );
  }
}

class _HistoryRow extends StatelessWidget {
  const _HistoryRow({required this.job, required this.money});

  final Job job;
  final String Function(double) money;

  @override
  Widget build(BuildContext context) {
    final refCode = job.id.substring(0, job.id.length.clamp(0, 6)).toUpperCase();
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text('ID: VX-$refCode',
                      style: const TextStyle(
                          fontSize: 13, fontWeight: FontWeight.w700)),
                ),
                Text(money(job.price),
                    style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                        color: VexaColors.primary700)),
              ],
            ),
            const SizedBox(height: 6),
            Text(job.packageTypeLabel ?? 'Envío',
                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
            Text('${job.pickup.short} → ${job.dropoff.short}',
                style: const TextStyle(fontSize: 12, color: VexaColors.gray500)),
            const SizedBox(height: 6),
            Row(
              children: [
                Icon(Icons.schedule, size: 13, color: VexaColors.gray400),
                const SizedBox(width: 4),
                Text(
                  job.completedAt != null
                      ? DateFormat('d MMM, HH:mm', 'es').format(job.completedAt!)
                      : '',
                  style: const TextStyle(fontSize: 11, color: VexaColors.gray400),
                ),
                if (job.ratingScore != null) ...[
                  const Spacer(),
                  const Icon(Icons.star, size: 13, color: VexaColors.warning500),
                  const SizedBox(width: 2),
                  Text(job.ratingScore!.toStringAsFixed(1),
                      style: const TextStyle(fontSize: 11, color: VexaColors.gray500)),
                ],
              ],
            ),
          ],
        ),
      ),
    );
  }
}
