import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../../app/router.dart';
import '../../auth/providers.dart';
import '../domain/job.dart';
import '../providers.dart';

class JobsPage extends ConsumerWidget {
  const JobsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    ref.listen<AsyncValue<Job>>(newJobStreamProvider, (previous, next) {
      next.whenData((job) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Nueva oferta: ${job.pickup.short}'),
            action: SnackBarAction(
              label: 'Ver',
              onPressed: () => context.go(AppRoutes.job(job.id)),
            ),
          ),
        );
      });
    });

    final jobs = ref.watch(offeredJobsProvider);
    final user = ref.watch(currentUserProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Ofertas disponibles'),
        actions: [
          IconButton(
            icon: const Icon(Icons.person_outline),
            onPressed: () => context.go(AppRoutes.profile),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => ref.read(offeredJobsProvider.notifier).refresh(),
        child: switch (jobs) {
          AsyncError(:final error) => _ErrorView(error: error),
          AsyncData(value: final items) when items.isEmpty => const _EmptyView(),
          AsyncData(value: final items) => ListView.builder(
              padding: const EdgeInsets.only(top: 8, bottom: 24),
              itemCount: items.length,
              itemBuilder: (context, index) => _JobOfferCard(job: items[index]),
            ),
          _ => const Center(child: CircularProgressIndicator()),
        },
      ),
      floatingActionButton: user == null
          ? null
          : FloatingActionButton.extended(
              onPressed: () =>
                  ref.read(offeredJobsProvider.notifier).refresh(),
              icon: const Icon(Icons.refresh),
              label: const Text('Actualizar'),
            ),
    );
  }
}

class _JobOfferCard extends ConsumerWidget {
  const _JobOfferCard({required this.job});

  final Job job;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final price = NumberFormat.currency(
      locale: 'es_CO',
      symbol: r'$',
      decimalDigits: 0,
    ).format(job.price);

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    'Recoger en ${job.pickup.short}',
                    style: theme.textTheme.titleMedium,
                  ),
                ),
                Text(price, style: theme.textTheme.titleMedium),
              ],
            ),
            const SizedBox(height: 8),
            _AddressRow(icon: Icons.trip_origin, label: job.pickup.short),
            const SizedBox(height: 4),
            _AddressRow(
              icon: Icons.location_on_outlined,
              label: job.dropoff.short,
            ),
            if (job.distanceKm != null) ...[
              const SizedBox(height: 4),
              _AddressRow(
                icon: Icons.route,
                label: '${job.distanceKm!.toStringAsFixed(1)} km',
              ),
            ],
            if (job.notes != null && job.notes!.isNotEmpty) ...[
              const SizedBox(height: 8),
              Text(job.notes!, style: theme.textTheme.bodySmall),
            ],
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => context.go(AppRoutes.job(job.id)),
                    child: const Text('Detalles'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: FilledButton.icon(
                    onPressed: () => _accept(context, ref),
                    icon: const Icon(Icons.check),
                    label: const Text('Aceptar'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _accept(BuildContext context, WidgetRef ref) async {
    final messenger = ScaffoldMessenger.of(context);
    try {
      await ref.read(offeredJobsProvider.notifier).accept(job.id);
      if (context.mounted) context.go(AppRoutes.job(job.id));
    } catch (error) {
      messenger.showSnackBar(
        const SnackBar(content: Text('La oferta ya no está disponible')),
      );
    }
  }
}

class _AddressRow extends StatelessWidget {
  const _AddressRow({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 16, color: Theme.of(context).colorScheme.outline),
        const SizedBox(width: 6),
        Expanded(
          child: Text(label, style: Theme.of(context).textTheme.bodyMedium),
        ),
      ],
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
          child: Text(
            '$error',
            style: Theme.of(context).textTheme.bodySmall,
            textAlign: TextAlign.center,
          ),
        ),
      ],
    );
  }
}
