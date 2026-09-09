import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/vexa_colors.dart';
import 'rewards_page.dart';

class ReferEarnPage extends ConsumerWidget {
  const ReferEarnPage({super.key});

  static const _steps = [
    ('Comparte tu código', 'Envía tu enlace o código a otros repartidores'),
    ('Primera entrega completada', 'Tu invitado se registra, verifica y entrega con éxito'),
    ('Recibe tu recompensa', '\$50 se acreditan al instante en ambas billeteras'),
  ];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final rewards = ref.watch(rewardsProvider);
    final code = rewards.valueOrNull?['referralCode'] as String? ?? 'CARGANDO...';
    return Scaffold(
      appBar: AppBar(
        leading: const BackButton(),
        title: const Text('Invita y gana'),
        actions: [IconButton(icon: const Icon(Icons.more_horiz), onPressed: () {})],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: VexaColors.primary50,
              borderRadius: BorderRadius.circular(VexaColors.radiusLg),
            ),
            child: Column(
              children: [
                const Icon(Icons.card_giftcard, size: 40, color: VexaColors.primary600),
                const SizedBox(height: 12),
                Text('Gana \$50 por referido',
                    style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700)),
                const SizedBox(height: 6),
                const Text(
                  'Presenta un nuevo repartidor o empresa a Vexa. Cuando completen su primera entrega, ambos ganan \$50 directamente.',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 13, color: VexaColors.gray600, height: 1.45),
                ),
                const SizedBox(height: 20),
                const Text('TU CÓDIGO DE INVITACIÓN',
                    style: TextStyle(
                        fontSize: 10, letterSpacing: 0.8,
                        color: VexaColors.gray500, fontWeight: FontWeight.w600)),
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(VexaColors.radiusMd),
                    border: Border.all(color: VexaColors.gray200),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(code,
                          style: const TextStyle(
                              fontSize: 16, fontWeight: FontWeight.w700,
                              letterSpacing: 1.2, color: VexaColors.primary700)),
                      const SizedBox(width: 12),
                      TextButton(
                        onPressed: code.length > 5
                            ? () {
                                Clipboard.setData(ClipboardData(text: code));
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(content: Text('Código copiado')),
                                );
                              }
                            : null,
                        child: const Text('COPIAR'),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          Text('CÓMO FUNCIONA', style: theme.textTheme.labelSmall?.copyWith(
            letterSpacing: 0.8, color: VexaColors.gray500, fontWeight: FontWeight.w600)),
          const SizedBox(height: 8),
          Card(
            margin: EdgeInsets.zero,
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 8),
              child: Column(
                children: [
                  for (var i = 0; i < _steps.length; i++)
                    ListTile(
                      leading: CircleAvatar(
                        radius: 14,
                        backgroundColor: VexaColors.primary100,
                        child: Text('${i + 1}',
                            style: const TextStyle(
                                fontSize: 13, fontWeight: FontWeight.w700,
                                color: VexaColors.primary700)),
                      ),
                      title: Text(_steps[i].$1,
                          style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
                      subtitle: Text(_steps[i].$2,
                          style: const TextStyle(fontSize: 12, color: VexaColors.gray500)),
                    ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
