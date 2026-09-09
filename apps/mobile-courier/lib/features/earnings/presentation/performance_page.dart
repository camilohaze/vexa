import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/vexa_colors.dart';
import '../../profile/data/courier_repository.dart';

/// Figma: courier-performance — score circular, barras de métricas y tips.
/// Datos reales de GET /couriers/me/performance.
final _performanceProvider =
    FutureProvider<Map<String, dynamic>>((ref) async {
  try {
    return await ref.watch(courierRepositoryProvider).fetchPerformance();
  } catch (_) {
    return const {};
  }
});

class PerformancePage extends ConsumerWidget {
  const PerformancePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final perf = ref.watch(_performanceProvider).valueOrNull ?? const {};
    final theme = Theme.of(context);

    double pct(Object? v) => (v as num?)?.toDouble() ?? 0;
    final onTime = pct(perf['onTimeRate']);
    final acceptance = pct(perf['acceptanceRate']);
    final completion = pct(perf['completionRate']);
    final rating = pct(perf['rating']);
    final score = (onTime + acceptance + completion + rating / 5) / 4;

    final metrics = [
      ('Puntualidad', '${(onTime * 100).toStringAsFixed(1)}%', onTime, ''),
      ('Tasa de aceptación', '${(acceptance * 100).toStringAsFixed(1)}%', acceptance, ''),
      ('Tasa de completado', '${(completion * 100).toStringAsFixed(1)}%', completion, ''),
      ('Calificación de clientes', '${rating.toStringAsFixed(2)} / 5', rating / 5, ''),
    ];

    return Scaffold(
      appBar: AppBar(title: const Text('Desempeño')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Center(
            child: Column(
              children: [
                SizedBox(
                  width: 140,
                  height: 140,
                  child: Stack(
                    alignment: Alignment.center,
                    children: [
                      SizedBox(
                        width: 140,
                        height: 140,
                        child: CircularProgressIndicator(
                          value: score,
                          strokeWidth: 10,
                          backgroundColor: VexaColors.gray100,
                          valueColor: const AlwaysStoppedAnimation(
                              VexaColors.primary600),
                        ),
                      ),
                      Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text('${(score * 100).round()}%',
                              style: theme.textTheme.displaySmall?.copyWith(
                                  fontWeight: FontWeight.w800)),
                          Text(
                            score >= 0.9
                                ? 'Excelente'
                                : score >= 0.7
                                    ? 'Bueno'
                                    : 'Por mejorar',
                            style: const TextStyle(
                                fontSize: 12, color: VexaColors.gray500)),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  'Pedidos completados: ${perf['totalJobs'] ?? 0}',
                  style: const TextStyle(fontSize: 12, color: VexaColors.gray500),
                ),
              ],
            ),
          ),
          const SizedBox(height: 28),
          for (final (label, value, ratio, delta) in metrics)
            Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(label,
                          style: const TextStyle(
                              fontSize: 14, fontWeight: FontWeight.w600)),
                      Text(value,
                          style: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w700,
                              color: VexaColors.primary700)),
                    ],
                  ),
                  const SizedBox(height: 6),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(4),
                    child: LinearProgressIndicator(
                      value: ratio.clamp(0.0, 1.0),
                      minHeight: 6,
                      backgroundColor: VexaColors.gray100,
                    ),
                  ),
                  if (delta.isNotEmpty) ...[
                    const SizedBox(height: 4),
                    Text(delta,
                        style: const TextStyle(
                            fontSize: 11, color: VexaColors.gray400)),
                  ],
                ],
              ),
            ),
          const SizedBox(height: 8),
          Card(
            color: VexaColors.primary50,
            margin: EdgeInsets.zero,
            child: const ListTile(
              leading: Icon(Icons.lightbulb_outline,
                  color: VexaColors.primary600),
              title: Text('Consejo para ganar más',
                  style: TextStyle(
                      fontSize: 13, fontWeight: FontWeight.w600)),
              subtitle: Text(
                'Alta demanda prevista en el centro entre 4–7 PM. Bonos activos.',
                style: TextStyle(fontSize: 12, height: 1.4),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
