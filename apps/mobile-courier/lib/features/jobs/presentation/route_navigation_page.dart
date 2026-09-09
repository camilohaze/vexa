import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:mapbox_maps_flutter/mapbox_maps_flutter.dart';

import '../../../app/router.dart';
import '../../../core/config/env.dart';
import '../../../core/theme/vexa_colors.dart';
import '../domain/job.dart';
import '../providers.dart';

/// Figma: route-navigation — mapa a pantalla completa, banner de giro
/// y tarjeta ETA con "I Have Arrived".
class RouteNavigationPage extends ConsumerWidget {
  const RouteNavigationPage({super.key, required this.jobId});

  final String jobId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final job = ref.watch(jobDetailProvider(jobId)).valueOrNull;
    final route = ref.watch(routeProvider(jobId));
    final info = route.valueOrNull;

    final step = info?.steps.firstOrNull;
    final distanceMeters = info?.distanceMeters ?? 0.0;
    final durationSeconds = info?.durationSeconds ?? 0.0;
    final distanceKm = distanceMeters / 1000;
    final durationMin = (durationSeconds / 60).ceil();
    final eta = DateTime.now().add(Duration(seconds: durationSeconds.ceil()));

    return Scaffold(
      body: Stack(
        children: [
          Positioned.fill(
            child: Env.hasMapbox && job != null
                ? _NavMap(job: job)
                : Container(color: VexaColors.gray200),
          ),
          // Banner de instrucción de giro
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: BoxDecoration(
                  color: VexaColors.primary700,
                  borderRadius: BorderRadius.circular(VexaColors.radiusMd),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.turn_right, color: Colors.white),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            step == null
                                ? 'Calculando ruta...'
                                : 'En ${step.distanceMeters.round()} m',
                            style: const TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.w700,
                                fontSize: 15),
                          ),
                          Text(
                            step?.instruction ?? 'Dirígete al destino',
                            style: const TextStyle(
                                color: Colors.white70, fontSize: 12),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          // Tarjeta ETA inferior
          Align(
            alignment: Alignment.bottomCenter,
            child: SafeArea(
              child: Container(
                margin: const EdgeInsets.all(16),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(VexaColors.radiusLg),
                  boxShadow: const [
                    BoxShadow(color: Colors.black26, blurRadius: 16),
                  ],
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          route.isLoading
                              ? '— min'
                              : '$durationMin min',
                          style: const TextStyle(
                              fontSize: 20, fontWeight: FontWeight.w700),
                        ),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Text(
                              route.isLoading
                                  ? '— km restantes'
                                  : '${distanceKm.toStringAsFixed(1)} km restantes',
                              style: const TextStyle(
                                  fontSize: 12, color: VexaColors.gray500),
                            ),
                            Text(
                              route.isLoading
                                  ? 'ETA —'
                                  : 'ETA ${DateFormat.Hm().format(eta)}',
                              style: const TextStyle(
                                  fontSize: 12, color: VexaColors.gray500),
                            ),
                          ],
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    FilledButton(
                      onPressed: () =>
                          context.push(AppRoutes.jobPickup(jobId)),
                      child: const Text('He llegado'),
                    ),
                  ],
                ),
              ),
            ),
          ),
          Positioned(
            top: MediaQuery.paddingOf(context).top + 76,
            left: 16,
            child: CircleAvatar(
              backgroundColor: Colors.white,
              child: IconButton(
                icon: const Icon(Icons.close),
                onPressed: () => context.pop(),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _NavMap extends StatelessWidget {
  const _NavMap({required this.job});
  final Job job;

  @override
  Widget build(BuildContext context) {
    final target = job.status == JobStatus.accepted ? job.pickup : job.dropoff;
    return MapWidget(
      viewport: CameraViewportState(
        center: Point(
          coordinates: Position.named(lng: target.lng, lat: target.lat),
        ),
        zoom: 14,
      ),
      onMapCreated: (controller) {
        controller.location
            .updateSettings(LocationComponentSettings(enabled: true));
      },
    );
  }
}
