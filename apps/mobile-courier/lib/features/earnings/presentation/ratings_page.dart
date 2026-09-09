import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../../core/theme/vexa_colors.dart';
import '../../profile/data/courier_repository.dart';

final _myReviewsProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  try {
    return await ref.watch(courierRepositoryProvider).fetchMyReviews();
  } catch (_) {
    return const {};
  }
});

/// Figma: courier-ratings — rating promedio, distribución por estrellas
/// y comentarios recientes (GET /couriers/me/reviews).
class RatingsPage extends ConsumerWidget {
  const RatingsPage({super.key});

  static Widget _stars(int count, {double size = 16}) => Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          for (var i = 0; i < count; i++)
            Icon(Icons.star, size: size, color: VexaColors.warning500),
        ],
      );

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final reviews = ref.watch(_myReviewsProvider).valueOrNull ?? const {};
    final average = (reviews['average'] as num?)?.toDouble() ?? 0;
    final total = (reviews['total'] as num?)?.toInt() ?? 0;
    final distribution = (reviews['distribution'] as List?)?.cast<int>() ?? [0, 0, 0, 0, 0];
    final comments = (reviews['comments'] as List?)?.cast<Map>() ?? const [];

    return Scaffold(
      appBar: AppBar(title: const Text('Calificaciones')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Column(
                children: [
                  Text(average.toStringAsFixed(2),
                      style: theme.textTheme.displayMedium
                          ?.copyWith(fontWeight: FontWeight.w800)),
                  _stars(average.round()),
                  const SizedBox(height: 4),
                  Text('$total reseñas',
                      style: const TextStyle(
                          fontSize: 11, color: VexaColors.gray500)),
                ],
              ),
              const SizedBox(width: 28),
              Expanded(
                child: Column(
                  children: [
                    for (var i = 0; i < 5; i++)
                      Padding(
                        padding: const EdgeInsets.symmetric(vertical: 2),
                        child: Row(
                          children: [
                            Text('${5 - i}',
                                style: const TextStyle(
                                    fontSize: 11, color: VexaColors.gray500)),
                            const SizedBox(width: 6),
                            Expanded(
                              child: ClipRRect(
                                borderRadius: BorderRadius.circular(3),
                                child: LinearProgressIndicator(
                                  value: total > 0 ? distribution[i] / total : 0,
                                  minHeight: 5,
                                  backgroundColor: VexaColors.gray100,
                                  valueColor: const AlwaysStoppedAnimation(
                                      VexaColors.warning500),
                                ),
                              ),
                            ),
                            const SizedBox(width: 8),
                            SizedBox(
                              width: 24,
                              child: Text('${distribution[i]}',
                                  textAlign: TextAlign.end,
                                  style: const TextStyle(
                                      fontSize: 10,
                                      color: VexaColors.gray400)),
                            ),
                          ],
                        ),
                      ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 28),
          Text('COMENTARIOS RECIENTES',
              style: theme.textTheme.labelSmall?.copyWith(
                  letterSpacing: 0.6, color: VexaColors.gray500)),
          const SizedBox(height: 8),
          for (final c in comments)
            _CommentCard(
              name: c['author'] as String? ?? 'Empresa',
              date: _format(c['when'] as String?),
              text: c['text'] as String? ?? '',
              stars: (c['stars'] as num?)?.toInt() ?? 5,
            ),
        ],
      ),
    );
  }

  static String _format(String? iso) {
    if (iso == null) return '';
    final d = DateTime.tryParse(iso);
    if (d == null) return '';
    return DateFormat('d MMM', 'es_CO').format(d);
  }
}

class _CommentCard extends StatelessWidget {
  const _CommentCard({
    required this.name,
    required this.date,
    required this.text,
    required this.stars,
  });

  final String name;
  final String date;
  final String text;
  final int stars;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Text(name,
                    style: const TextStyle(
                        fontSize: 13, fontWeight: FontWeight.w600)),
                const SizedBox(width: 6),
                Text(date,
                    style: const TextStyle(
                        fontSize: 11, color: VexaColors.gray400)),
                const Spacer(),
                RatingsPage._stars(stars, size: 12),
              ],
            ),
            const SizedBox(height: 6),
            Text(text,
                style: const TextStyle(
                    fontSize: 13,
                    color: VexaColors.gray600,
                    height: 1.45)),
          ],
        ),
      ),
    );
  }
}
