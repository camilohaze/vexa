import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/models/paged_result.dart';
import '../../../core/theme/vexa_colors.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/widgets/date_range_filter_bar.dart';
import '../../profile/data/courier_repository.dart';

final _reviewsFilterProvider = StateProvider.autoDispose<PageDateFilter>((ref) => const PageDateFilter());

final _myReviewsProvider = FutureProvider.autoDispose.family<Map<String, dynamic>, PageDateFilter>((ref, filter) async {
  try {
    return await ref.watch(courierRepositoryProvider).fetchMyReviews(filter);
  } catch (_) {
    return const {};
  }
});

/// Figma: courier-ratings — rating promedio y distribución (histórico
/// completo), comentarios filtrables por fecha y paginados por el backend.
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
    final filter = ref.watch(_reviewsFilterProvider);
    final reviews = ref.watch(_myReviewsProvider(filter)).valueOrNull ?? const {};
    final average = (reviews['average'] as num?)?.toDouble() ?? 0;
    final total = (reviews['total'] as num?)?.toInt() ?? 0;
    final distribution = (reviews['distribution'] as List?)?.cast<int>() ?? [0, 0, 0, 0, 0];
    final comments = (reviews['comments'] as List?)?.cast<Map>() ?? const [];
    final commentsTotal = (reviews['commentsTotal'] as num?)?.toInt() ?? comments.length;
    final page = (reviews['page'] as num?)?.toInt() ?? 1;
    final pageSize = (reviews['pageSize'] as num?)?.toInt() ?? 20;
    final commentsPage = PagedResult(items: comments, total: commentsTotal, page: page, pageSize: pageSize);

    void updateFilter(PageDateFilter next) => ref.read(_reviewsFilterProvider.notifier).state = next;

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
          const SizedBox(height: 20),
          DateRangeFilterBar(filter: filter, onChanged: updateFilter, padding: EdgeInsets.zero),
          const SizedBox(height: 12),
          Text('COMENTARIOS',
              style: theme.textTheme.labelSmall?.copyWith(
                  letterSpacing: 0.6, color: VexaColors.gray500)),
          const SizedBox(height: 8),
          if (comments.isEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 16),
              child: Text(
                filter.hasDateRange ? 'Sin comentarios en este rango.' : 'Aún no tienes comentarios.',
                style: const TextStyle(fontSize: 13, color: VexaColors.gray500),
              ),
            )
          else
            for (final c in comments)
              _CommentCard(
                name: c['author'] as String? ?? 'Empresa',
                date: _format(c['when'] as String?),
                text: c['text'] as String? ?? '',
                stars: (c['stars'] as num?)?.toInt() ?? 5,
              ),
          if (commentsTotal > pageSize)
            Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Mostrando ${comments.length} de $commentsTotal',
                      style: const TextStyle(fontSize: 12, color: VexaColors.gray500)),
                  Row(
                    children: [
                      IconButton(
                        onPressed: commentsPage.hasPreviousPage
                            ? () => updateFilter(filter.copyWith(page: page - 1))
                            : null,
                        icon: const Icon(Icons.chevron_left),
                        iconSize: 20,
                        visualDensity: VisualDensity.compact,
                      ),
                      IconButton(
                        onPressed: commentsPage.hasNextPage
                            ? () => updateFilter(filter.copyWith(page: page + 1))
                            : null,
                        icon: const Icon(Icons.chevron_right),
                        iconSize: 20,
                        visualDensity: VisualDensity.compact,
                      ),
                    ],
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }

  static String _format(String? iso) {
    if (iso == null) return '';
    final d = DateTime.tryParse(iso);
    if (d == null) return '';
    return AppFormatters.shortDate(d);
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
