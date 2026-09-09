import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../../core/theme/vexa_colors.dart';
import '../domain/job.dart';
import '../providers.dart';

/// Figma: courier-delivery-history ("Completed Jobs") — buscador,
/// filtro de rango y filas con ruta, stats, precio y rating.
class DeliveryHistoryPage extends ConsumerWidget {
  const DeliveryHistoryPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final history = ref.watch(myJobsProvider);
    final money = NumberFormat.currency(
        locale: 'es_CO', symbol: r'$', decimalDigits: 2).format;

    return Scaffold(
      appBar: AppBar(title: const Text('Pedidos completados')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 8, 20, 0),
            child: TextField(
              decoration: InputDecoration(
                hintText: 'Buscar por ID, punto o ciudad…',
                prefixIcon:
                    const Icon(Icons.search, color: VexaColors.gray400),
                isDense: true,
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 10, 20, 4),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Rango: últimos 30 días',
                    style:
                        TextStyle(fontSize: 12, color: VexaColors.gray500)),
                TextButton(
                  onPressed: () {},
                  child: const Text('Restablecer',
                      style: TextStyle(fontSize: 12)),
                ),
              ],
            ),
          ),
          Expanded(
            child: switch (history) {
              AsyncData(value: final items) => ListView.builder(
                  padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
                  itemCount: items.length,
                  itemBuilder: (context, i) {
                    final job = items[i];
                    return _HistoryRow(job: job, money: money);
                  },
                ),
              AsyncError() =>
                const Center(child: Text('No se pudo cargar el historial')),
              _ => const Center(child: CircularProgressIndicator()),
            },
          ),
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
            const SizedBox(height: 2),
            Text(DateFormat('d MMM, y').format(job.createdAt),
                style: const TextStyle(
                    fontSize: 11, color: VexaColors.gray400)),
            const SizedBox(height: 8),
            Text('${job.pickup.short} → ${job.dropoff.short}',
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                    fontSize: 13, color: VexaColors.gray700)),
            const SizedBox(height: 6),
            Row(
              children: [
                const Icon(Icons.schedule,
                    size: 13, color: VexaColors.gray400),
                const SizedBox(width: 4),
                Text(
                  job.distanceKm != null
                      ? '${job.distanceKm!.toStringAsFixed(1)} km'
                      : '—',
                  style: const TextStyle(
                      fontSize: 12, color: VexaColors.gray500),
                ),
                const Spacer(),
                const Icon(Icons.star, size: 14, color: VexaColors.warning500),
                const SizedBox(width: 4),
                const Text('5.0',
                    style: TextStyle(
                        fontSize: 12, fontWeight: FontWeight.w600)),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
