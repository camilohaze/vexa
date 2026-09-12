import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../../app/router.dart';
import '../../../core/navigation/external_navigation.dart';
import '../../../core/theme/vexa_colors.dart';
import '../domain/job.dart';
import '../../tracking/providers.dart';
import '../providers.dart';

class JobDetailPage extends ConsumerWidget {
  const JobDetailPage({super.key, required this.jobId});

  final String jobId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final jobAsync = ref.watch(jobDetailProvider(jobId));
    return Scaffold(
      body: switch (jobAsync) {
        AsyncError(:final error) =>
          Scaffold(appBar: AppBar(), body: Center(child: Text('Error: $error'))),
        AsyncData(value: final job) => _JobDetail(job: job),
        _ => const Scaffold(body: Center(child: CircularProgressIndicator())),
      },
    );
  }
}

class _JobDetail extends ConsumerWidget {
  const _JobDetail({required this.job});

  final Job job;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final price = NumberFormat.currency(
      locale: 'es_CO',
      symbol: r'$',
      decimalDigits: 0,
    ).format(job.price);
    final refCode = 'VX-${job.id.substring(0, job.id.length.clamp(0, 6)).toUpperCase()}';
    final label = job.status == JobStatus.offered ? 'Oferta' : 'Pedido';

    return Scaffold(
      appBar: AppBar(
        leading: BackButton(onPressed: () => context.pop()),
        title: Text(
          job.durationMinutes != null && job.distanceKm != null
              ? '~${job.durationMinutes} min • ${job.distanceKm!.toStringAsFixed(1)} km'
              : 'Detalle del pedido',
        ),
      ),
      body: SafeArea(
        top: false,
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('$label #$refCode',
                        style: theme.textTheme.titleSmall
                            ?.copyWith(color: VexaColors.gray500)),
                    Text(price,
                        style: theme.textTheme.headlineSmall?.copyWith(
                            fontWeight: FontWeight.w800,
                            color: VexaColors.primary700)),
                  ],
                ),
                const SizedBox(height: 16),
                _RouteCard(job: job),
                const SizedBox(height: 16),
                Text('INFORMACIÓN DEL PAQUETE',
                    style: theme.textTheme.labelSmall?.copyWith(
                        letterSpacing: 0.6, color: VexaColors.gray500)),
                const SizedBox(height: 8),
                Card(
                  margin: EdgeInsets.zero,
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Row(
                      children: [
                        _InfoCell(label: 'PESO', value: '12.5 kg'),
                        _InfoCell(
                            label: 'TIPO',
                            value: job.notes?.isNotEmpty == true
                                ? job.notes!
                                : 'General'),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                Card(
                  margin: EdgeInsets.zero,
                  child: ListTile(
                    leading: const CircleAvatar(
                      backgroundColor: VexaColors.primary100,
                      child: Icon(Icons.business, color: VexaColors.primary700),
                    ),
                    title: Text('Empresa #${job.companyId.substring(0, job.companyId.length.clamp(0, 6))}',
                        style: const TextStyle(
                            fontSize: 14, fontWeight: FontWeight.w600)),
                    subtitle: const Text('Socio verificado',
                        style: TextStyle(fontSize: 12)),
                    trailing: const Icon(Icons.verified,
                        color: VexaColors.primary600, size: 18),
                  ),
                ),
                const SizedBox(height: 24),
                ..._actions(context, ref),
                const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }

  List<Widget> _actions(BuildContext context, WidgetRef ref) {
    final notifier = ref.read(jobDetailProvider(job.id).notifier);
    final tracking = ref.watch(trackingControllerProvider);
    final trackingNotifier = ref.read(trackingControllerProvider.notifier);
    final messenger = ScaffoldMessenger.of(context);

    Future<void> run(Future<Job> Function() action,
        {String? goTo, bool track = false}) async {
      try {
        await action();
        if (track) await trackingNotifier.start(jobId: job.id);
        if (goTo != null && context.mounted) await context.push(goTo);
      } catch (_) {
        messenger.showSnackBar(
          const SnackBar(content: Text('No se pudo actualizar el pedido')),
        );
      }
    }

    return switch (job.status) {
      JobStatus.offered => [
          FilledButton(
            onPressed: () => run(notifier.accept,
                track: true, goTo: AppRoutes.courierJobAccepted(job.id)),
            child: const Text('Aceptar entrega'),
          ),
          const SizedBox(height: 12),
          OutlinedButton(
            onPressed: () => context.pop(),
            child: const Text('Rechazar oferta'),
          ),
        ],
      JobStatus.accepted => [
          FilledButton.icon(
            onPressed: () => openExternalNavigation(job.pickup),
            icon: const Icon(Icons.map_outlined, size: 18),
            label: const Text('Navegar en Google Maps'),
          ),
          const SizedBox(height: 12),
          OutlinedButton.icon(
            onPressed: () => context.push(AppRoutes.courierJobChat(job.id)),
            icon: const Icon(Icons.chat_bubble_outline, size: 18),
            label: const Text('Contactar empresa'),
          ),
        ],
      JobStatus.pickedUp || JobStatus.inTransit => [
          FilledButton(
            onPressed: () => context.push(AppRoutes.courierJobDelivery(job.id)),
            child: const Text('Confirmar entrega'),
          ),
          const SizedBox(height: 12),
          if (tracking is TrackingActive)
            OutlinedButton.icon(
              onPressed: trackingNotifier.stop,
              icon: const Icon(Icons.location_off),
              label: const Text('Detener seguimiento'),
            ),
        ],
      JobStatus.delivered => [
          FilledButton.tonalIcon(
            onPressed: () => context.push(AppRoutes.courierJobProof(job.id)),
            icon: const Icon(Icons.receipt_long),
            label: const Text('Ver comprobante'),
          ),
        ],
      _ => const [],
    };
  }
}

class _RouteCard extends StatelessWidget {
  const _RouteCard({required this.job});
  final Job job;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: EdgeInsets.zero,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            _RouteRow(
                label: 'RECOGER EN',
                address: job.pickup,
                color: VexaColors.success500,
                icon: Icons.trip_origin),
            const Padding(
              padding: EdgeInsets.only(left: 7),
              child: Align(
                alignment: Alignment.centerLeft,
                child: Icon(Icons.more_vert,
                    size: 14, color: VexaColors.gray300),
              ),
            ),
            _RouteRow(
                label: 'ENTREGAR EN',
                address: job.dropoff,
                color: VexaColors.error500,
                icon: Icons.location_on),
          ],
        ),
      ),
    );
  }
}

class _RouteRow extends StatelessWidget {
  const _RouteRow({
    required this.label,
    required this.address,
    required this.color,
    required this.icon,
  });

  final String label;
  final Address address;
  final Color color;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 16, color: color),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label,
                  style: const TextStyle(
                      fontSize: 10, letterSpacing: 0.5,
                      color: VexaColors.gray400, fontWeight: FontWeight.w600)),
              Text(address.short,
                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
            ],
          ),
        ),
      ],
    );
  }
}

class _InfoCell extends StatelessWidget {
  const _InfoCell({required this.label, required this.value});
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label,
              style: const TextStyle(
                  fontSize: 10, letterSpacing: 0.5,
                  color: VexaColors.gray400, fontWeight: FontWeight.w600)),
          const SizedBox(height: 2),
          Text(value,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}
