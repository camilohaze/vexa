import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/router.dart';
import '../../../core/theme/vexa_colors.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/widgets/company_app_bar.dart';
import '../../jobs/domain/job.dart';
import '../providers.dart';

/// Figma: delivery-details-view.
class CompanyJobDetailPage extends ConsumerWidget {
  const CompanyJobDetailPage({super.key, required this.jobId});

  final String jobId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final job = ref.watch(companyJobDetailProvider(jobId));
    final money = AppFormatters.money;
    final date = AppFormatters.dateTime;
    final loadedId = job.valueOrNull?.id;

    return Scaffold(
      appBar: companyAppBar(context, loadedId != null
          ? 'Envío VX-${loadedId.substring(0, 6).toUpperCase()}'
          : 'Envío'),
      body: job.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (_, __) => const Center(child: Text('No se pudo cargar el envío')),
        data: (job) {
          final breakdown = job.priceBreakdownRow(money);
          return ListView(
            padding: const EdgeInsets.all(24),
            children: [
              _Card(
                title: 'Línea de tiempo',
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _TimelineStep('Aceptado', job.acceptedAt, date, done: job.acceptedAt != null),
                    _TimelineStep('Recogido', job.pickedUpAt, date, done: job.pickedUpAt != null),
                    _TimelineStep('En camino',
                        job.status == JobStatus.inTransit || job.status.isFinished ? job.pickedUpAt : null,
                        date, done: job.status == JobStatus.inTransit || job.status.isFinished, current: true),
                    _TimelineStep('Entregado', job.completedAt, date, done: job.completedAt != null),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              _Card(
                title: 'Especificación del paquete',
                child: Row(
                  children: [
                    _SpecColumn('Categoría', job.packageTypeLabel ?? '—'),
                    _SpecColumn('Peso', job.weightKg != null ? '${job.weightKg} kg' : '—'),
                    _SpecColumn('Dimensiones', job.dimensions != null
                        ? '${job.dimensions!.l.toStringAsFixed(0)}x${job.dimensions!.w.toStringAsFixed(0)}x${job.dimensions!.h.toStringAsFixed(0)} cm'
                        : '—'),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              _Card(
                title: 'Ruta',
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(children: [
                      const Text('RECOGIDA', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: VexaColors.primary600)),
                      const SizedBox(width: 8),
                      Expanded(child: Text(job.pickup.short, style: const TextStyle(fontSize: 13), overflow: TextOverflow.ellipsis)),
                    ]),
                    const SizedBox(height: 6),
                    Row(children: [
                      const Text('DESTINO', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: VexaColors.secondary500)),
                      const SizedBox(width: 8),
                      Expanded(child: Text(job.dropoff.short, style: const TextStyle(fontSize: 13), overflow: TextOverflow.ellipsis)),
                    ]),
                  ],
                ),
              ),
              if (job.proofOfDeliveryUrl != null) ...[
                const SizedBox(height: 12),
                _Card(
                  title: 'Prueba de entrega',
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(VexaColors.radiusMd),
                    child: Image.network(job.proofOfDeliveryUrl!, height: 160, width: double.infinity, fit: BoxFit.cover),
                  ),
                ),
              ],
              const SizedBox(height: 12),
              _Card(
                title: 'Desglose de facturación',
                child: Column(children: [
                  ...breakdown,
                  const Divider(),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Precio total', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700)),
                      Text(money(job.price),
                          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: VexaColors.primary600)),
                    ],
                  ),
                ]),
              ),
              if (job.status == JobStatus.delivered && job.ratingScore == null && job.courierId != null) ...[
                const SizedBox(height: 20),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton.icon(
                    onPressed: () => context.push(AppRoutes.companyJobRate(job.id)),
                    icon: const Icon(Icons.star_outline),
                    label: const Text('Calificar repartidor'),
                  ),
                ),
              ],
              if (job.courierId != null) ...[
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton.icon(
                    onPressed: () => context.push(
                      '${AppRoutes.companyCourier(job.courierId!)}?jobId=${job.id}',
                    ),
                    icon: const Icon(Icons.person_outline),
                    label: const Text('Ver perfil del repartidor'),
                  ),
                ),
              ],
            ],
          );
        },
      ),
    );
  }
}

extension on Job {
  List<Widget> priceBreakdownRow(String Function(num) money) {
    final b = priceBreakdown;
    if (b == null) return const [];
    Widget row(String label, String key) => Padding(
          padding: const EdgeInsets.symmetric(vertical: 4),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(label, style: const TextStyle(fontSize: 13, color: VexaColors.gray600)),
              Text(money((b[key] as num?) ?? 0),
                  style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
            ],
          ),
        );
    return [
      row('Tarifa base', 'base'),
      row('Distancia', 'distance'),
      row('Recargo por peso', 'weight'),
    ];
  }
}

class _Card extends StatelessWidget {
  const _Card({required this.title, required this.child});

  final String title;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: VexaColors.gray50,
        border: Border.all(color: VexaColors.gray200),
        borderRadius: BorderRadius.circular(VexaColors.radiusLg),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title.toUpperCase(),
              style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: VexaColors.gray800)),
          const SizedBox(height: 12),
          child,
        ],
      ),
    );
  }
}

class _SpecColumn extends StatelessWidget {
  const _SpecColumn(this.label, this.value);

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(fontSize: 11, color: VexaColors.gray400)),
          Text(value, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}

class _TimelineStep extends StatelessWidget {
  const _TimelineStep(this.label, this.at, this.format, {required this.done, this.current = false});

  final String label;
  final DateTime? at;
  final String Function(DateTime) format;
  final bool done;
  final bool current;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Icon(done ? Icons.circle : Icons.circle_outlined,
              size: 10, color: done ? VexaColors.primary600 : VexaColors.gray300),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700)),
                if (at != null)
                  Text(format(at!), style: const TextStyle(fontSize: 11, color: VexaColors.gray400)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
