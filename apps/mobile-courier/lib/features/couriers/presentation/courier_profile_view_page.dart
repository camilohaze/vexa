import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../../app/router.dart';
import '../../../core/theme/vexa_colors.dart';
import '../../../core/widgets/company_app_bar.dart';
import '../providers.dart';

/// Figma: courier-profile-view.
class CourierProfileViewPage extends ConsumerWidget {
  const CourierProfileViewPage({super.key, required this.courierId, this.jobId});

  final String courierId;
  final String? jobId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profile = ref.watch(courierProfileProvider(courierId));
    final reviews = ref.watch(courierReviewsProvider(courierId));
    final percent = NumberFormat.percentPattern('es_CO');

    return Scaffold(
      appBar: companyAppBar(context, 'Perfil del repartidor'),
      body: profile.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (_, __) => const Center(child: Text('No se pudo cargar el perfil')),
        data: (p) => ListView(
          padding: const EdgeInsets.all(24),
          children: [
            Column(
              children: [
                CircleAvatar(
                  radius: 44,
                  backgroundColor: VexaColors.primary100,
                  backgroundImage: p.avatarUrl != null ? NetworkImage(p.avatarUrl!) : null,
                  child: p.avatarUrl == null
                      ? const Icon(Icons.person, size: 40, color: VexaColors.primary700) : null,
                ),
                const SizedBox(height: 12),
                Text(p.name, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800)),
                if (p.vehicle.isNotEmpty)
                  Text('${p.vehicle}${p.vehicleDetails != null ? ' • ${p.vehicleDetails}' : ''}',
                      style: const TextStyle(fontSize: 13, color: VexaColors.gray400)),
                const SizedBox(height: 8),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.star, size: 16, color: VexaColors.warning500),
                    const SizedBox(width: 4),
                    Text(p.rating.toStringAsFixed(1),
                        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                    const SizedBox(width: 6),
                    Text('(${p.totalJobs} entregas)',
                        style: const TextStyle(fontSize: 14, color: VexaColors.gray400)),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 20),
            Row(children: [
              _Stat(label: 'Entregas', value: '${p.totalJobs}', color: VexaColors.primary600),
              _Stat(label: 'A tiempo', value: percent.format(p.onTimeRate), color: VexaColors.success500),
              _Stat(label: 'Aceptación', value: percent.format(p.acceptanceRate), color: VexaColors.gray800),
            ]),
            const SizedBox(height: 20),
            const Text('RESEÑAS RECIENTES',
                style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: VexaColors.gray800)),
            const SizedBox(height: 12),
            reviews.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (_, __) => const Text('No se pudieron cargar las reseñas'),
              data: (list) => list.isEmpty
                  ? const Text('Aún no tiene reseñas', style: TextStyle(color: VexaColors.gray500))
                  : Column(
                      children: [
                        for (final r in list)
                          Container(
                            width: double.infinity,
                            margin: const EdgeInsets.only(bottom: 12),
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: VexaColors.gray50,
                              border: Border.all(color: VexaColors.gray200),
                              borderRadius: BorderRadius.circular(VexaColors.radiusLg),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text(r.author, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700)),
                                    Text(DateFormat('d MMM', 'es').format(r.when),
                                        style: const TextStyle(fontSize: 12, color: VexaColors.gray400)),
                                  ],
                                ),
                                const SizedBox(height: 6),
                                Row(children: [
                                  for (var i = 0; i < 5; i++)
                                    Icon(i < r.stars ? Icons.star : Icons.star_border,
                                        size: 14, color: VexaColors.warning500),
                                ]),
                                const SizedBox(height: 6),
                                Text(r.text, style: const TextStyle(fontSize: 13, color: VexaColors.gray600)),
                              ],
                            ),
                          ),
                      ],
                    ),
            ),
          ],
        ),
      ),
      bottomNavigationBar: jobId == null
          ? null
          : SafeArea(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: SizedBox(
                  width: double.infinity, height: 52,
                  child: FilledButton.icon(
                    onPressed: () => context.push(AppRoutes.companyJobChat(jobId!)),
                    icon: const Icon(Icons.chat_bubble_outline),
                    label: const Text('Enviar mensaje'),
                  ),
                ),
              ),
            ),
    );
  }
}

class _Stat extends StatelessWidget {
  const _Stat({required this.label, required this.value, required this.color});

  final String label;
  final String value;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 4),
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: VexaColors.gray50,
          border: Border.all(color: VexaColors.gray200),
          borderRadius: BorderRadius.circular(VexaColors.radiusMd),
        ),
        child: Column(
          children: [
            Text(label.toUpperCase(),
                style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: VexaColors.gray400)),
            const SizedBox(height: 4),
            Text(value, style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800, color: color)),
          ],
        ),
      ),
    );
  }
}
