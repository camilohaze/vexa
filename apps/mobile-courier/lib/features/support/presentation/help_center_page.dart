import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/router.dart';
import '../../../core/theme/vexa_colors.dart';
import '../data/support_repository.dart';

final helpCenterProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  try {
    return await ref.watch(supportRepositoryProvider).fetchHelp();
  } catch (_) {
    return const {'categories': [], 'articles': []};
  }
});

class HelpCenterPage extends ConsumerWidget {
  const HelpCenterPage({super.key});

  static const _iconFor = {
    'Entregas': Icons.local_shipping_outlined,
    'Pagos': Icons.credit_card,
    'Cuenta': Icons.person_outline,
    'Zonas': Icons.map_outlined,
  };

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final help = ref.watch(helpCenterProvider);
    final data = help.valueOrNull ?? const {'categories': [], 'articles': []};
    final categories = (data['categories'] as List? ?? []).cast<String>();
    final articles = (data['articles'] as List? ?? []).cast<Map<String, dynamic>>();
    return Scaffold(
      appBar: AppBar(
        leading: const BackButton(),
        title: const Text('Centro de ayuda'),
        actions: [IconButton(icon: const Icon(Icons.more_horiz), onPressed: () {})],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text('¿Cómo podemos ayudarte hoy?', style: theme.textTheme.titleLarge),
          const SizedBox(height: 12),
          TextField(
            decoration: InputDecoration(
              hintText: 'Busca temas, dudas, preguntas…',
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
          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            mainAxisSpacing: 12,
            crossAxisSpacing: 12,
            childAspectRatio: 2.1,
            children: [
              for (final c in categories)
                Card(
                  margin: EdgeInsets.zero,
                  child: Padding(
                    padding: const EdgeInsets.all(12),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Icon(_iconFor[c] ?? Icons.help_outline,
                            color: VexaColors.primary600, size: 22),
                        const SizedBox(height: 6),
                        Text(c,
                            style: const TextStyle(
                                fontWeight: FontWeight.w600, fontSize: 14)),
                        const Text('Artículos y guías',
                            style: TextStyle(
                                fontSize: 11, color: VexaColors.gray500, height: 1.3)),
                      ],
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 24),
          Text('ARTÍCULOS POPULARES', style: theme.textTheme.labelSmall?.copyWith(
            letterSpacing: 0.8, color: VexaColors.gray500, fontWeight: FontWeight.w600)),
          const SizedBox(height: 8),
          help.when(
            data: (_) => Column(
              children: [
                for (final a in articles)
                  ListTile(
                    contentPadding: EdgeInsets.zero,
                    title: Text(a['title'] as String? ?? '',
                        style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
                    trailing: const Icon(Icons.chevron_right, color: VexaColors.gray400),
                    onTap: () {},
                  ),
              ],
            ),
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (_, __) => const Center(child: Text('Error al cargar el centro de ayuda.')),
          ),
          const SizedBox(height: 8),
          FilledButton.icon(
            onPressed: () => context.push(AppRoutes.supportChat),
            icon: const Icon(Icons.chat_bubble_outline, size: 18),
            label: const Text('Contactar soporte en vivo'),
          ),
        ],
      ),
    );
  }
}
