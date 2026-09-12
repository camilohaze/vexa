import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/router.dart';
import '../../../core/theme/vexa_colors.dart';
import '../../profile/data/courier_repository.dart';

/// Figma: verification-center — progreso global + checklist con estados
/// reales de GET /couriers/me/verification.
final _verificationProvider =
    FutureProvider<Map<String, dynamic>>((ref) async {
  try {
    return await ref.watch(courierRepositoryProvider).fetchVerification();
  } catch (_) {
    return const {};
  }
});

class VerificationPage extends ConsumerWidget {
  const VerificationPage({super.key});

  static const _labels = {
    'identity': (
      'Verificación de identidad',
      'Documento con foto oficial',
      AppRoutes.courierIdentityVerification
    ),
    'vehicle': (
      'Registro del vehículo',
      'Prueba de propiedad / contrato',
      AppRoutes.courierVehicleRegistration
    ),
    'insurance': ('Seguro comercial', 'Póliza vigente activa', null),
    'background': ('Antecedentes penales', 'Verificación de antecedentes', null),
  };

  static const _statusLabel = {
    'verified': 'Verificado',
    'pending': 'Pendiente',
    'rejected': 'Rechazado',
    'required': 'Requerido',
  };

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final data = ref.watch(_verificationProvider).valueOrNull ?? const {};
    final steps = (data['steps'] as List?)?.cast<Map>() ?? const [];
    final progress = (data['progress'] as num?)?.toDouble() ?? 0;
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(title: const Text('Centro de verificación')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Card(
            margin: EdgeInsets.zero,
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Progreso general',
                          style: theme.textTheme.titleSmall),
                      Text('${(progress * 100).round()}%',
                          style: const TextStyle(
                              fontWeight: FontWeight.w700,
                              color: VexaColors.primary700)),
                    ],
                  ),
                  const SizedBox(height: 8),
                  ClipRRect(
                    borderRadius: const BorderRadius.all(Radius.circular(4)),
                    child: LinearProgressIndicator(
                      value: progress,
                      minHeight: 8,
                      backgroundColor: VexaColors.gray100,
                    ),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Completa los pasos restantes para recibir ofertas de trabajo.',
                    style: TextStyle(fontSize: 12, color: VexaColors.gray500),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 20),
          Text('CHECKLIST REQUERIDO',
              style: theme.textTheme.labelSmall?.copyWith(
                  letterSpacing: 0.6, color: VexaColors.gray500)),
          const SizedBox(height: 8),
          for (final step in steps.isEmpty ? _fallbackSteps : steps)
            _StepCard(step: step, labels: _labels),
        ],
      ),
    );
  }

  static const _fallbackSteps = [
    {'type': 'identity', 'status': 'required', 'urls': []},
    {'type': 'vehicle', 'status': 'required', 'urls': []},
    {'type': 'insurance', 'status': 'required', 'urls': []},
    {'type': 'background', 'status': 'required', 'urls': []},
  ];
}

class _StepCard extends StatelessWidget {
  const _StepCard({required this.step, required this.labels});

  final Map step;
  final Map<String, (String, String, String?)> labels;

  @override
  Widget build(BuildContext context) {
    final type = step['type'] as String? ?? '';
    final status = step['status'] as String? ?? 'required';
    final meta = labels[type] ?? (type, '', null);
    final verified = status == 'verified';
    final pending = status == 'pending';
    final (bg, fg) = verified
        ? (VexaColors.success100, VexaColors.success700)
        : pending
            ? (VexaColors.warning100, VexaColors.warning700)
            : (VexaColors.error100, VexaColors.error700);

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
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(meta.$1,
                          style: const TextStyle(
                              fontSize: 14, fontWeight: FontWeight.w600)),
                      Text(meta.$2,
                          style: const TextStyle(
                              fontSize: 12, color: VexaColors.gray500)),
                    ],
                  ),
                ),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                  decoration: BoxDecoration(
                    color: bg,
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Text(VerificationPage._statusLabel[status] ?? status,
                      style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: fg)),
                ),
              ],
            ),
            if (meta.$3 != null && !verified) ...[
              const SizedBox(height: 10),
              OutlinedButton(
                onPressed: () => context.push(meta.$3!),
                style: OutlinedButton.styleFrom(
                    minimumSize: const Size.fromHeight(38)),
                child: const Text('Subir documento'),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
