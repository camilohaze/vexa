import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/widgets/vexa_bottom_nav.dart';
import '../providers.dart';
import 'widgets/job_offer_card.dart';

/// Figma: available-deliveries — "Job Board" con filtros y lista de ofertas.
class JobBoardPage extends ConsumerWidget {
  const JobBoardPage({super.key});

  static const _filters = ['Distancia: < 10 km', 'Precio: > \$20', 'Carga pesada'];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final jobs = ref.watch(offeredJobsProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Pedidos disponibles')),
      body: Column(
        children: [
          SizedBox(
            height: 48,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 24),
              itemCount: _filters.length,
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (context, i) => Chip(
                label: Text(_filters[i],
                    style: const TextStyle(fontSize: 12)),
                backgroundColor: Colors.white,
                side: const BorderSide(color: Color(0xFFE5E7EB)),
              ),
            ),
          ),
          Expanded(
            child: RefreshIndicator(
              onRefresh: () =>
                  ref.read(offeredJobsProvider.notifier).refresh(),
              child: switch (jobs) {
                AsyncError(:final error) => _ErrorView(error: error),
                AsyncData(value: final items) when items.isEmpty =>
                  const _EmptyView(),
                AsyncData(value: final items) => ListView.builder(
                    padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
                    itemCount: items.length,
                    itemBuilder: (context, index) =>
                        JobOfferCard(job: items[index]),
                  ),
                _ => const Center(child: CircularProgressIndicator()),
              },
            ),
          ),
        ],
      ),
      bottomNavigationBar: const VexaBottomNav(current: 1),
    );
  }
}

class _EmptyView extends StatelessWidget {
  const _EmptyView();

  @override
  Widget build(BuildContext context) {
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      children: const [
        SizedBox(height: 160),
        Icon(Icons.inbox_outlined, size: 64),
        SizedBox(height: 16),
        Center(child: Text('No hay ofertas por ahora')),
        SizedBox(height: 4),
        Center(child: Text('Desliza para actualizar')),
      ],
    );
  }
}

class _ErrorView extends StatelessWidget {
  const _ErrorView({required this.error});

  final Object error;

  @override
  Widget build(BuildContext context) {
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      children: [
        const SizedBox(height: 160),
        const Icon(Icons.cloud_off, size: 64),
        const SizedBox(height: 16),
        const Center(child: Text('No se pudieron cargar las ofertas')),
        Center(
          child: Text('$error',
              style: Theme.of(context).textTheme.bodySmall,
              textAlign: TextAlign.center),
        ),
      ],
    );
  }
}
