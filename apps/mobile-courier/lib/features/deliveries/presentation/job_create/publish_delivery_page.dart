import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/router.dart';
import '../../../../core/theme/vexa_colors.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/company_app_bar.dart';
import '../../../jobs/data/jobs_repository.dart';
import '../../providers.dart';
import 'job_draft_controller.dart';

/// Figma: publish-delivery (paso 6/6 — resumen y publicación).
class PublishDeliveryPage extends ConsumerStatefulWidget {
  const PublishDeliveryPage({super.key});

  @override
  ConsumerState<PublishDeliveryPage> createState() => _PublishDeliveryPageState();
}

class _PublishDeliveryPageState extends ConsumerState<PublishDeliveryPage> {
  bool _publishing = false;

  Future<void> _publish() async {
    final draft = ref.read(jobDraftProvider);
    setState(() => _publishing = true);
    try {
      final job = await ref.read(jobsRepositoryProvider).create(
            pickup: {
              'line1': draft.pickupLine1,
              'city': draft.pickupCity,
              'line2': draft.pickupState,
              'lat': draft.pickupLat,
              'lng': draft.pickupLng,
            },
            dropoff: {
              'line1': draft.dropoffLine1,
              'city': draft.dropoffCity,
              'line2': draft.dropoffState,
              'lat': draft.dropoffLat,
              'lng': draft.dropoffLng,
            },
            price: draft.offeredPrice ?? 0,
            notes: draft.additionalNotes.isEmpty ? draft.deliveryInstructions : draft.additionalNotes,
            packageType: draft.packageType,
            weightKg: draft.weightKg,
            dimensions: draft.dimL == null || draft.dimW == null || draft.dimH == null
                ? null
                : {'l': draft.dimL, 'w': draft.dimW, 'h': draft.dimH},
            fragile: draft.fragile,
            refrigerated: draft.refrigerated,
            priority: draft.priority,
            priceBreakdown: draft.estimate?['breakdown'] as Map<String, dynamic>?,
            durationSeconds: (draft.estimate?['durationSeconds'] as num?)?.toDouble(),
          );
      ref.read(jobDraftProvider.notifier).reset();
      ref.invalidate(companyJobsProvider);
      if (!mounted) return;
      context.go(AppRoutes.companyJob(job.id));
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('No se pudo publicar el envío')),
        );
      }
    } finally {
      if (mounted) setState(() => _publishing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final draft = ref.watch(jobDraftProvider);
    final money = AppFormatters.money;

    return Scaffold(
      appBar: companyAppBar(context, 'Resumen'),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          const Text('¿Listo para despachar?',
              style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: VexaColors.gray800)),
          const SizedBox(height: 6),
          const Text('Revisa los detalles antes de publicar.',
              style: TextStyle(fontSize: 14, color: VexaColors.gray600)),
          const SizedBox(height: 20),
          _SummaryCard(
            title: 'Paquete y peso',
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('${draft.packageLabel}${draft.weightKg != null ? ' (${draft.weightKg} kg)' : ''}',
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                if (draft.description.isNotEmpty)
                  Text('${draft.description} • ${draft.priorityLabel}',
                      style: const TextStyle(fontSize: 14, color: VexaColors.gray600)),
              ],
            ),
          ),
          const SizedBox(height: 12),
          _SummaryCard(
            title: 'Logística de la ruta',
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _RouteLine(
                  color: VexaColors.primary600,
                  address: draft.pickupLine1,
                  sub: 'Remitente: ${draft.pickupContactName} (${draft.pickupContactPhone})',
                ),
                const SizedBox(height: 10),
                _RouteLine(
                  color: VexaColors.secondary500,
                  address: draft.dropoffLine1,
                  sub: 'Destinatario: ${draft.dropoffContactName} (${draft.dropoffContactPhone})',
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: VexaColors.gray50,
              border: Border.all(color: VexaColors.gray200),
              borderRadius: BorderRadius.circular(VexaColors.radiusLg),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('TU PRECIO OFRECIDO',
                        style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: VexaColors.gray400)),
                    Text(money(draft.offeredPrice ?? 0),
                        style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: VexaColors.primary600)),
                  ],
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: VexaColors.success100,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Text('Garantizado',
                      style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: VexaColors.success700)),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Checkbox(
                value: draft.acceptTerms,
                onChanged: (v) => ref
                    .read(jobDraftProvider.notifier)
                    .update((d) => d.copyWith(acceptTerms: v ?? false)),
              ),
              const Expanded(
                child: Padding(
                  padding: EdgeInsets.only(top: 12),
                  child: Text(
                    'Acepto los términos de servicio de Vexa y garantizo los límites de peso declarados.',
                    style: TextStyle(fontSize: 13, color: VexaColors.gray600),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            children: [
              SizedBox(
                width: double.infinity,
                height: 52,
                child: FilledButton(
                  onPressed: !draft.acceptTerms || _publishing ? null : _publish,
                  child: _publishing
                      ? const SizedBox(
                          width: 20, height: 20,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                      : const Text('Publicar solicitud de envío'),
                ),
              ),
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                height: 52,
                child: OutlinedButton(
                  onPressed: _publishing
                      ? null
                      : () => ScaffoldMessenger.of(context)
                          .showSnackBar(const SnackBar(content: Text('Borrador guardado'))),
                  child: const Text('Guardar como borrador'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _SummaryCard extends StatelessWidget {
  const _SummaryCard({required this.title, required this.child});

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
              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: VexaColors.gray400)),
          const SizedBox(height: 8),
          child,
        ],
      ),
    );
  }
}

class _RouteLine extends StatelessWidget {
  const _RouteLine({required this.color, required this.address, required this.sub});

  final Color color;
  final String address;
  final String sub;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(top: 4),
          child: Container(width: 8, height: 8, decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(address, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
              Text(sub, style: const TextStyle(fontSize: 12, color: VexaColors.gray600)),
            ],
          ),
        ),
      ],
    );
  }
}
