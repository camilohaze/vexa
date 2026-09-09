import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../../core/theme/vexa_colors.dart';
import '../data/jobs_repository.dart';
import '../providers.dart';

/// Figma: proof-of-delivery — resumen post-entrega con log,
/// fotos de verificación y acciones de recibo.
class ProofOfDeliveryPage extends ConsumerWidget {
  const ProofOfDeliveryPage({super.key, required this.jobId});

  final String jobId;

  Future<void> _downloadReceipt(BuildContext context, WidgetRef ref) async {
    final url = await ref.read(jobsRepositoryProvider).fetchReceiptUrl(jobId);
    if (url == null || url.isEmpty || !context.mounted) return;
    await showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Recibo'),
        content: Text(url),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cerrar')),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final job = ref.watch(jobDetailProvider(jobId)).valueOrNull;
    final theme = Theme.of(context);
    final refCode = 'VX-${jobId.substring(0, jobId.length.clamp(0, 6)).toUpperCase()}';
    final time = job?.completedAt ?? DateTime.now();

    return Scaffold(
      appBar: AppBar(title: const Text('Prueba de entrega')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          const Center(
            child: _DeliveredPill(),
          ),
          const SizedBox(height: 12),
          Center(
            child: Text('Envío #$refCode',
                style: theme.textTheme.titleLarge
                    ?.copyWith(fontWeight: FontWeight.w700)),
          ),
          Center(
            child: Text(
              'Entregado el ${DateFormat('d MMM, y').format(time)} a las ${DateFormat('h:mm a').format(time)}',
              style: const TextStyle(fontSize: 12, color: VexaColors.gray500),
            ),
          ),
          const SizedBox(height: 20),
          Text('REGISTRO DE ENTREGA',
              style: theme.textTheme.labelSmall?.copyWith(
                  letterSpacing: 0.6, color: VexaColors.gray500)),
          const SizedBox(height: 8),
          Card(
            margin: EdgeInsets.zero,
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  _LogRow('Hora de operación',
                      DateFormat('h:mm a').format(job?.acceptedAt ?? time)),
                  _LogRow('Hora de entrega', DateFormat('h:mm a').format(time)),
                  _LogRow(
                      'Distancia total',
                      job?.distanceKm != null
                          ? '${job!.distanceKm!.toStringAsFixed(1)} km'
                          : '—'),
                  _LogRow(
                      'Coordenadas GPS',
                      job != null
                          ? '${job.dropoff.lat.toStringAsFixed(4)}° N, ${job.dropoff.lng.abs().toStringAsFixed(4)}° W'
                          : '—'),
                ],
              ),
            ),
          ),
          const SizedBox(height: 20),
          Text('FOTOS DE VERIFICACIÓN',
              style: theme.textTheme.labelSmall?.copyWith(
                  letterSpacing: 0.6, color: VexaColors.gray500)),
          const SizedBox(height: 8),
          const Row(
            children: [
              Expanded(child: _ProofTile(icon: Icons.photo, label: 'Foto de entrega')),
              SizedBox(width: 12),
              Expanded(child: _ProofTile(icon: Icons.draw, label: 'Firma digital')),
            ],
          ),
          const SizedBox(height: 24),
          FilledButton.icon(
            onPressed: () => _downloadReceipt(context, ref),
            icon: const Icon(Icons.download, size: 18),
            label: const Text('Descargar recibo PDF'),
          ),
          const SizedBox(height: 12),
          OutlinedButton(
            onPressed: () {},
            child: const Text('Compartir comprobante'),
          ),
        ],
      ),
    );
  }
}

class _DeliveredPill extends StatelessWidget {
  const _DeliveredPill();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
      decoration: BoxDecoration(
        color: VexaColors.success100,
        borderRadius: BorderRadius.circular(999),
      ),
      child: const Text('ENTREGADO CON ÉXITO',
          style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.5,
              color: VexaColors.success700)),
    );
  }
}

class _LogRow extends StatelessWidget {
  const _LogRow(this.label, this.value);

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label,
              style: const TextStyle(fontSize: 12, color: VexaColors.gray500)),
          Text(value,
              style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}

class _ProofTile extends StatelessWidget {
  const _ProofTile({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 110,
      decoration: BoxDecoration(
        color: VexaColors.gray100,
        borderRadius: BorderRadius.circular(VexaColors.radiusMd),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, color: VexaColors.gray400, size: 28),
          const SizedBox(height: 6),
          Text(label,
              style: const TextStyle(fontSize: 11, color: VexaColors.gray500)),
        ],
      ),
    );
  }
}
