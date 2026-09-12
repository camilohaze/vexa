import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/router.dart';
import '../../../core/theme/vexa_colors.dart';
import '../../../core/widgets/vexa_bottom_nav.dart';
import '../providers.dart';

/// Pestaña "Rastrear" del bottom nav: redirige al seguimiento en vivo del
/// envío activo más relevante (mismo criterio que tracking-overview en el
/// portal web), o muestra un estado vacío si no hay ninguno.
class CompanyTrackPage extends ConsumerWidget {
  const CompanyTrackPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final jobs = ref.watch(companyJobsProvider);
    final job = ref.watch(mostRelevantActiveJobProvider);

    if (job != null) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (context.mounted) context.go(AppRoutes.companyTrackJob(job.id));
      });
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Rastrear')),
      body: jobs.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (_, __) => const Center(child: Text('No se pudo cargar la información')),
        data: (_) => job != null
            ? const Center(child: CircularProgressIndicator())
            : Center(
                child: Padding(
                  padding: const EdgeInsets.all(32),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.near_me_outlined, size: 40, color: VexaColors.gray400),
                      const SizedBox(height: 16),
                      const Text('Sin envíos activos',
                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                      const SizedBox(height: 6),
                      const Text('Cuando tengas un envío en camino, podrás seguirlo aquí en vivo.',
                          textAlign: TextAlign.center,
                          style: TextStyle(fontSize: 13, color: VexaColors.gray500)),
                      const SizedBox(height: 20),
                      FilledButton(
                        onPressed: () => context.push(AppRoutes.companyJobCreate),
                        child: const Text('Crear un envío'),
                      ),
                    ],
                  ),
                ),
              ),
      ),
      bottomNavigationBar: const VexaBottomNav(current: 2, items: VexaBottomNav.companyItems),
    );
  }
}
