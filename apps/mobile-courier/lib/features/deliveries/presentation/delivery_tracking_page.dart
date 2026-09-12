import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/router.dart';
import '../../../core/network/realtime_client.dart';
import '../../../core/theme/vexa_colors.dart';
import '../../../core/widgets/company_app_bar.dart';
import '../../jobs/domain/job.dart';
import '../providers.dart';

/// Figma: delivery-tracking ("Live Tracking").
class DeliveryTrackingPage extends ConsumerStatefulWidget {
  const DeliveryTrackingPage({super.key, required this.jobId});

  final String jobId;

  @override
  ConsumerState<DeliveryTrackingPage> createState() => _DeliveryTrackingPageState();
}

class _DeliveryTrackingPageState extends ConsumerState<DeliveryTrackingPage> {
  @override
  void initState() {
    super.initState();
    final realtime = ref.read(realtimeClientProvider);
    for (final stream in [realtime.jobAccepted, realtime.jobCancelled, realtime.jobCompleted, realtime.courierLocations]) {
      stream.listen((_) {
        if (mounted) ref.invalidate(companyJobDetailProvider(widget.jobId));
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final job = ref.watch(companyJobDetailProvider(widget.jobId));

    return Scaffold(
      appBar: companyAppBar(context, 'Seguimiento en vivo'),
      body: job.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (_, __) => const Center(child: Text('No se pudo cargar el seguimiento')),
        data: (job) {
          final etaMinutes = job.durationSeconds != null ? (job.durationSeconds! / 60).round() : null;
          return ListView(
            padding: EdgeInsets.zero,
            children: [
              Stack(
                children: [
                  Container(height: 300, color: VexaColors.gray100,
                      child: const Center(child: Icon(Icons.map_outlined, size: 40, color: VexaColors.gray400))),
                  Positioned(
                    left: 16, right: 16, top: 16,
                    child: Material(
                      elevation: 2,
                      borderRadius: BorderRadius.circular(VexaColors.radiusMd),
                      child: Padding(
                        padding: const EdgeInsets.all(12),
                        child: Row(children: [
                          Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(color: VexaColors.success100, borderRadius: BorderRadius.circular(8)),
                            child: const Icon(Icons.local_shipping, size: 20, color: VexaColors.success700),
                          ),
                          const SizedBox(width: 12),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('LLEGADA ESTIMADA',
                                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: VexaColors.gray600)),
                              Text(etaMinutes != null ? '$etaMinutes min' : 'Calculando…',
                                  style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w800)),
                            ],
                          ),
                        ]),
                      ),
                    ),
                  ),
                ],
              ),
              Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(children: [
                      CircleAvatar(
                        radius: 22,
                        backgroundColor: VexaColors.primary100,
                        backgroundImage: job.courierAvatarUrl != null ? NetworkImage(job.courierAvatarUrl!) : null,
                        child: job.courierAvatarUrl == null
                            ? const Icon(Icons.person, color: VexaColors.primary700) : null,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(job.courierName ?? 'Repartidor por asignar',
                                style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
                            if (job.courierId != null)
                              GestureDetector(
                                onTap: () => context.push('${AppRoutes.companyCourier(job.courierId!)}?jobId=${job.id}'),
                                child: const Text('Ver perfil',
                                    style: TextStyle(fontSize: 13, color: VexaColors.primary600, fontWeight: FontWeight.w600)),
                              ),
                          ],
                        ),
                      ),
                    ]),
                    const SizedBox(height: 20),
                    _TimelineDot('Aceptado', job.acceptedAt != null),
                    _TimelineDot('Recogido', job.pickedUpAt != null),
                    _TimelineDot('En camino', job.status == JobStatus.inTransit || job.status.isFinished, current: job.status == JobStatus.inTransit),
                    const SizedBox(height: 20),
                    Row(children: [
                      Expanded(
                        child: FilledButton.icon(
                          onPressed: job.courierId == null ? null : () => context.push(AppRoutes.companyJobChat(job.id)),
                          icon: const Icon(Icons.chat_bubble_outline, size: 18),
                          label: const Text('Contactar repartidor'),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: () => ScaffoldMessenger.of(context)
                              .showSnackBar(const SnackBar(content: Text('Reporte enviado a soporte'))),
                          icon: const Icon(Icons.flag_outlined, size: 18),
                          label: const Text('Reportar problema'),
                        ),
                      ),
                    ]),
                  ],
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

class _TimelineDot extends StatelessWidget {
  const _TimelineDot(this.label, this.done, {this.current = false});

  final String label;
  final bool done;
  final bool current;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(children: [
        Icon(Icons.circle, size: 8, color: done ? VexaColors.primary600 : VexaColors.gray300),
        const SizedBox(width: 12),
        Text(label,
            style: TextStyle(
                fontSize: 13,
                fontWeight: done ? FontWeight.w700 : FontWeight.w400,
                color: done ? VexaColors.gray800 : VexaColors.gray400)),
        if (current) ...[
          const SizedBox(width: 6),
          const Text('• Etapa actual', style: TextStyle(fontSize: 12, color: VexaColors.gray500)),
        ],
      ]),
    );
  }
}
