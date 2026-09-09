import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/vexa_colors.dart';
import '../../profile/data/courier_repository.dart';

final rewardsProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  try {
    return await ref.watch(courierRepositoryProvider).fetchRewards();
  } catch (_) {
    return const {};
  }
});

class RewardsPage extends ConsumerWidget {
  const RewardsPage({super.key});

  static const _benefits = [
    ('Multiplicador de pago +5%', 'Tarifas base mayores en todas las entregas'),
    ('Asignación prioritaria', 'Acceso a ofertas antes que los niveles estándar'),
    ('Soporte dedicado', 'Ayuda directa de un agente de logística Vexa'),
  ];

  static const _earnPoints = [
    ('Entrega a tiempo', '+50 pts'),
    ('Ruta en hora pico completada', '+120 pts'),
    ('POD cargado en menos de 5 min', '+20 pts'),
  ];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final rewards = ref.watch(rewardsProvider);
    return Scaffold(
      appBar: AppBar(
        leading: const BackButton(),
        title: const Text('Recompensas Vexa'),
        actions: [IconButton(icon: const Icon(Icons.more_horiz), onPressed: () {})],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          rewards.when(
            data: (data) {
              final tier = data['tier'] as String? ?? 'BRONCE';
              final points = (data['points'] as num?)?.toInt() ?? 0;
              final next = data['nextTierAt'] as num?;
              final delivered = (data['delivered'] as num?)?.toInt() ?? 0;
              final threshold = next != null ? next.toInt() : (points + 100);
              final progress = threshold > 0 ? (points / threshold).clamp(0.0, 1.0) : 0.0;
              final nextName = tier == 'ORO' ? 'Máximo' : tier == 'PLATA' ? 'Oro' : 'Plata';
              return _LevelCard(
                tier: 'Socio $tier',
                points: points,
                threshold: threshold,
                progress: progress,
                next: nextName,
                delivered: delivered,
              );
            },
            loading: () => const _LevelCard(tier: '...', points: 0, threshold: 100, progress: 0, next: '-', delivered: 0),
            error: (_, __) => const _LevelCard(tier: 'Socio BRONCE', points: 0, threshold: 100, progress: 0, next: 'Plata', delivered: 0),
          ),
          const SizedBox(height: 24),
          Text('TUS BENEFICIOS', style: theme.textTheme.labelSmall?.copyWith(
            letterSpacing: 0.8, color: VexaColors.gray500, fontWeight: FontWeight.w600)),
          const SizedBox(height: 8),
          for (final (title, sub) in _benefits)
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: const Icon(Icons.check_circle, color: VexaColors.success500, size: 20),
              title: Text(title, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
              subtitle: Text(sub, style: const TextStyle(fontSize: 12, color: VexaColors.gray500)),
            ),
          const SizedBox(height: 12),
          Text('GANAR PUNTOS', style: theme.textTheme.labelSmall?.copyWith(
              letterSpacing: 0.8, color: VexaColors.gray500, fontWeight: FontWeight.w600)),
          const SizedBox(height: 8),
          Card(
            margin: EdgeInsets.zero,
            child: Column(
              children: [
                for (final (action, pts) in _earnPoints)
                  ListTile(
                    title: Text(action, style: const TextStyle(fontSize: 14)),
                    trailing: Text(pts,
                        style: const TextStyle(
                            fontSize: 13, fontWeight: FontWeight.w600,
                            color: VexaColors.primary600)),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _LevelCard extends StatelessWidget {
  const _LevelCard({
    required this.tier,
    required this.points,
    required this.threshold,
    required this.progress,
    required this.next,
    required this.delivered,
  });

  final String tier;
  final int points;
  final int threshold;
  final double progress;
  final String next;
  final int delivered;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [VexaColors.primary600, VexaColors.primary800],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(VexaColors.radiusLg),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('NIVEL ACTIVO',
                  style: theme.textTheme.labelSmall?.copyWith(
                      color: Colors.white70, letterSpacing: 0.8)),
              const Icon(Icons.emoji_events_outlined, color: Colors.white, size: 22),
            ],
          ),
          const SizedBox(height: 4),
          Text(tier,
              style: theme.textTheme.headlineSmall?.copyWith(
                  color: Colors.white, fontWeight: FontWeight.w700)),
          const SizedBox(height: 14),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('$points / $threshold puntos',
                  style: theme.textTheme.bodySmall?.copyWith(color: Colors.white70)),
              Text('Entregas: $delivered · Siguiente: $next',
                  style: theme.textTheme.bodySmall?.copyWith(color: Colors.white70)),
            ],
          ),
          const SizedBox(height: 6),
          ClipRRect(
            borderRadius: BorderRadius.circular(999),
            child: LinearProgressIndicator(
              value: progress,
              minHeight: 6,
              backgroundColor: Colors.white24,
              valueColor: const AlwaysStoppedAnimation(Colors.white),
            ),
          ),
        ],
      ),
    );
  }
}
