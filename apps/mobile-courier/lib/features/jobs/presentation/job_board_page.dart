import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/widgets/vexa_bottom_nav.dart';
import '../domain/job.dart';
import '../providers.dart';
import 'widgets/job_offer_card.dart';

/// Figma: available-deliveries — "Job Board" con filtros y lista de ofertas.
class JobBoardPage extends ConsumerWidget {
  const JobBoardPage({super.key});

  static const _filters = ['Distancia: < 10 km', 'Precio: > \$20', 'Carga pesada'];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final jobs = ref.watch(offeredJobsProvider);
    final selected = ref.watch(offeredFiltersProvider);

    List<Job> filtered() {
      final items = jobs.valueOrNull ?? const <Job>[];
      if (selected.isEmpty) return items;
      return items.where((j) {
        if (selected.contains(0) && (j.distanceMeters ?? double.infinity) > 10000) return false;
        if (selected.contains(1) && j.price <= 20) return false;
        if (selected.contains(2)) {
          final notes = j.notes?.toLowerCase() ?? '';
          if (!notes.contains('pesado') && !notes.contains('heavy')) return false;
        }
        return true;
      }).toList();
    }

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
              itemBuilder: (context, i) => ChoiceChip(
                label: Text(_filters[i],
                    style: const TextStyle(fontSize: 12)),
                selected: selected.contains(i),
                onSelected: (value) {
                  ref.read(offeredFiltersProvider.notifier).update((state) {
                    return value ? {...state, i} : (state..remove(i));
                  });
                },
                selectedColor: const Color(0xFFEDE9FE),
                backgroundColor: Colors.white,
                side: const BorderSide(color: Color(0xFFE5E7EB)),
              ),
            ),
          ),
          Expanded(
            child: RefreshIndicator(
              onRefresh: () =>
                  ref.read(offeredJobsProvider.notifier).refresh(),
              child: _buildList(jobs, filtered()),
            ),
          ),
        ],
      ),
      bottomNavigationBar: const VexaBottomNav(current: 1, items: VexaBottomNav.courierItems),
    );
  }

  Widget _buildList(AsyncValue<List<Job>> jobs, List<Job> filtered) {
    if (jobs is AsyncError) return _ErrorView(error: jobs.error ?? Exception('Error desconocido'));
    if (jobs is! AsyncData<List<Job>>) return const Center(child: CircularProgressIndicator());
    if (filtered.isEmpty) return const _EmptyView();
    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
      itemCount: filtered.length,
      itemBuilder: (context, index) => JobOfferCard(job: filtered[index]),
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
