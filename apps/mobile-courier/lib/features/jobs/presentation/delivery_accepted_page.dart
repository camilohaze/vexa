import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/router.dart';
import '../../../core/navigation/external_navigation.dart';
import '../../../core/theme/vexa_colors.dart';
import '../providers.dart';

/// Figma: accept-delivery — "Delivery Accepted!" + countdown hacia recogida.
class DeliveryAcceptedPage extends ConsumerStatefulWidget {
  const DeliveryAcceptedPage({super.key, required this.jobId});

  final String jobId;

  @override
  ConsumerState<DeliveryAcceptedPage> createState() =>
      _DeliveryAcceptedPageState();
}

class _DeliveryAcceptedPageState extends ConsumerState<DeliveryAcceptedPage> {
  Timer? _timer;
  Duration _remaining = const Duration(minutes: 15);

  @override
  void initState() {
    super.initState();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (_remaining.inSeconds <= 0) {
        _timer?.cancel();
      } else {
        setState(() => _remaining -= const Duration(seconds: 1));
      }
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final job = ref.watch(jobDetailProvider(widget.jobId)).valueOrNull;
    final mm = (_remaining.inMinutes).toString().padLeft(2, '0');
    final ss = (_remaining.inSeconds % 60).toString().padLeft(2, '0');

    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            children: [
              const Spacer(),
              const CircleAvatar(
                radius: 44,
                backgroundColor: VexaColors.success100,
                child: Icon(Icons.check, size: 44, color: VexaColors.success500),
              ),
              const SizedBox(height: 20),
              Text('¡Entrega aceptada!',
                  style: theme.textTheme.headlineSmall
                      ?.copyWith(fontWeight: FontWeight.w700)),
              const SizedBox(height: 8),
              const Text('Estás asignado al despacho. Dirígete al punto de recogida.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: VexaColors.gray500)),
              const SizedBox(height: 28),
              Card(
                margin: EdgeInsets.zero,
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    children: [
                      const Text('PROCEDER A RECOGIDA',
                          style: TextStyle(
                              fontSize: 10, letterSpacing: 0.6,
                              color: VexaColors.gray500,
                              fontWeight: FontWeight.w600)),
                      const SizedBox(height: 6),
                      Text('$mm:$ss',
                          style: theme.textTheme.displaySmall?.copyWith(
                              fontWeight: FontWeight.w700,
                              color: VexaColors.primary700)),
                      const Text('Tiempo restante para llegar al punto',
                          style: TextStyle(
                              fontSize: 11, color: VexaColors.gray500)),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),
              if (job != null)
                Card(
                  margin: EdgeInsets.zero,
                  child: ListTile(
                    leading: const Icon(Icons.inventory_2_outlined,
                        color: VexaColors.primary600),
                    title: Text('Paquete #VX-${job.id.substring(0, 6).toUpperCase()}',
                        style: const TextStyle(
                            fontSize: 14, fontWeight: FontWeight.w600)),
                    subtitle: Text(job.pickup.short,
                        style: const TextStyle(fontSize: 12)),
                  ),
                ),
              const Spacer(),
              FilledButton.icon(
                onPressed: job == null ? null : () => openExternalNavigation(job.pickup),
                icon: const Icon(Icons.map_outlined, size: 18),
                label: const Text('Navegar en Google Maps'),
              ),
              const SizedBox(height: 12),
              OutlinedButton(
                onPressed: () =>
                    context.push(AppRoutes.courierJobChat(widget.jobId)),
                child: const Text('Contactar despacho'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
