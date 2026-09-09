import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/vexa_colors.dart';
import '../data/support_repository.dart';

final faqProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  try {
    return await ref.watch(supportRepositoryProvider).fetchFaq();
  } catch (_) {
    return const [];
  }
});

class FaqPage extends ConsumerWidget {
  const FaqPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final faq = ref.watch(faqProvider);
    return Scaffold(
      appBar: AppBar(
        leading: const BackButton(),
        title: const Text('Preguntas frecuentes'),
        actions: [IconButton(icon: const Icon(Icons.more_horiz), onPressed: () {})],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          TextField(
            decoration: InputDecoration(
              hintText: 'Buscar en ayuda…',
              prefixIcon: const Icon(Icons.search, color: VexaColors.gray400),
              fillColor: VexaColors.gray100,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(VexaColors.radiusLg),
                borderSide: BorderSide.none,
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(VexaColors.radiusLg),
                borderSide: BorderSide.none,
              ),
            ),
          ),
          const SizedBox(height: 20),
          faq.when(
            data: (groups) {
              if (groups.isEmpty) {
                return const Center(child: Text('No hay preguntas disponibles.'));
              }
              return Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  for (final group in groups) ...[
                    Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: Text(group['group'] as String? ?? '',
                          style: const TextStyle(
                              fontSize: 14, fontWeight: FontWeight.w600,
                              color: VexaColors.primary700)),
                    ),
                    Card(
                      margin: const EdgeInsets.only(bottom: 16),
                      clipBehavior: Clip.antiAlias,
                      child: Column(
                        children: [
                          for (final item in (group['items'] as List? ?? []).cast<Map<String, dynamic>>())
                            ExpansionTile(
                              title: Text(item['question'] as String? ?? '',
                                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
                              childrenPadding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                              children: [
                                Text(item['answer'] as String? ?? '',
                                    style: const TextStyle(fontSize: 13, color: VexaColors.gray600, height: 1.45)),
                              ],
                            ),
                        ],
                      ),
                    ),
                  ],
                ],
              );
            },
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (_, __) => const Center(child: Text('Error al cargar FAQ.')),
          ),
        ],
      ),
    );
  }
}
