import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/vexa_colors.dart';
import '../../../core/utils/formatters.dart';
import '../data/support_repository.dart';

final legalProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  try {
    return await ref.watch(supportRepositoryProvider).fetchLegal();
  } catch (_) {
    return const [];
  }
});

class LegalSection {
  const LegalSection(this.title, this.body);
  final String title;
  final String body;
}

/// Pantalla legal genérica (Términos / Privacidad). Replica el patrón
/// del Figma: encabezado con fecha, secciones numeradas y barra de acción.
class LegalPage extends ConsumerWidget {
  const LegalPage({
    super.key,
    required this.title,
    this.updatedAt,
    this.sections,
    this.showActions = false,
  });

  final String title;
  final String? updatedAt;
  final List<LegalSection>? sections;
  final bool showActions;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final legal = ref.watch(legalProvider);
    final data = sections ??
        legal.valueOrNull
            ?.map((r) => LegalSection(r['title'] as String? ?? '', r['body'] as String? ?? ''))
            .toList() ??
        const [];
    return Scaffold(
      appBar: AppBar(
        leading: const BackButton(),
        title: Text(title),
        actions: [IconButton(icon: const Icon(Icons.more_horiz), onPressed: () {})],
      ),
      body: Column(
        children: [
          Expanded(
            child: legal.when(
              data: (_) => ListView(
                padding: const EdgeInsets.all(20),
                children: [
                  Text(updatedAt ?? 'VIGENTE: ${AppFormatters.date(DateTime.now())}',
                      style: const TextStyle(
                          fontSize: 11, letterSpacing: 0.6,
                          color: VexaColors.gray400, fontWeight: FontWeight.w600)),
                  const SizedBox(height: 12),
                  for (var i = 0; i < data.length; i++) ...[
                    Text('${i + 1}. ${data[i].title}',
                        style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
                    const SizedBox(height: 6),
                    Text(data[i].body,
                        style: const TextStyle(fontSize: 13, height: 1.55, color: VexaColors.gray600)),
                    const SizedBox(height: 18),
                  ],
                ],
              ),
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (_, __) => const Center(child: Text('Error al cargar documentos legales.')),
            ),
          ),
          if (showActions)
            SafeArea(
              top: false,
              child: Container(
                padding: const EdgeInsets.fromLTRB(20, 12, 20, 16),
                decoration: const BoxDecoration(
                  color: Colors.white,
                  border: Border(top: BorderSide(color: VexaColors.gray200)),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: TextButton(
                        onPressed: () => context.pop(),
                        child: const Text('Rechazar',
                            style: TextStyle(color: VexaColors.gray600)),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      flex: 2,
                      child: FilledButton(
                        onPressed: () => context.pop(true),
                        child: const Text('Aceptar términos'),
                      ),
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

class TermsPage extends StatelessWidget {
  const TermsPage({super.key});

  @override
  Widget build(BuildContext context) => const LegalPage(
        title: 'Términos y condiciones',
        updatedAt: 'ÚLTIMA ACTUALIZACIÓN: HOY',
        showActions: true,
      );
}

class PrivacyPage extends StatelessWidget {
  const PrivacyPage({super.key});

  @override
  Widget build(BuildContext context) => const LegalPage(
        title: 'Política de privacidad',
        updatedAt: 'FECHA DE VIGENCIA: HOY',
      );
}
