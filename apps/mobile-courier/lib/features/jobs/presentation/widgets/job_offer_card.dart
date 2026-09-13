import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/router.dart';
import '../../../../core/theme/vexa_colors.dart';
import '../../../../core/utils/formatters.dart';
import '../../domain/job.dart';

/// Tarjeta de oferta del Job Board / dashboard (Figma: job-card-*).
/// Badge de tipo + precio, ruta pickup/drop, distancia y tiempo publicado,
/// CTA "Ver detalles".
class JobOfferCard extends StatelessWidget {
  const JobOfferCard({super.key, required this.job, this.badge});

  final Job job;

  /// Etiqueta tipo "Express"/"Fresh" — opcional hasta que el backend la exponga.
  final String? badge;

  @override
  Widget build(BuildContext context) {
    final price = AppFormatters.money(job.price);
    final theme = Theme.of(context);
    final posted = _relative(job.createdAt);

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                if (badge != null) ...[
                  _Badge(label: badge!),
                  const SizedBox(width: 8),
                ],
                const Icon(Icons.inventory_2_outlined,
                    size: 16, color: VexaColors.gray500),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    job.notes?.isNotEmpty == true ? job.notes! : 'Paquete',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontSize: 13, color: VexaColors.gray600),
                  ),
                ),
                Text(price,
                    style: theme.textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.w700,
                        color: VexaColors.primary700)),
              ],
            ),
            const SizedBox(height: 12),
            _RouteRow(icon: Icons.trip_origin, color: VexaColors.success500, label: 'Recoger: ${job.pickup.short}'),
            const SizedBox(height: 4),
            _RouteRow(icon: Icons.location_on, color: VexaColors.error500, label: 'Entregar: ${job.dropoff.short}'),
            const SizedBox(height: 10),
            Row(
              children: [
                if (job.distanceKm != null) ...[
                  const Icon(Icons.route, size: 14, color: VexaColors.gray400),
                  const SizedBox(width: 4),
                  Text('${job.distanceKm!.toStringAsFixed(1)} km',
                      style: const TextStyle(fontSize: 12, color: VexaColors.gray500)),
                  const SizedBox(width: 12),
                ],
                const Icon(Icons.schedule, size: 14, color: VexaColors.gray400),
                const SizedBox(width: 4),
                Text(posted,
                    style: const TextStyle(fontSize: 12, color: VexaColors.gray500)),
              ],
            ),
            const SizedBox(height: 12),
            FilledButton(
              onPressed: () => context.push(AppRoutes.courierJob(job.id)),
              child: const Text('Ver detalles'),
            ),
          ],
        ),
      ),
    );
  }

  static String _relative(DateTime date) {
    final diff = DateTime.now().difference(date);
    if (diff.inMinutes < 60) return 'hace ${diff.inMinutes.clamp(1, 59)} min';
    if (diff.inHours < 24) return 'hace ${diff.inHours} h';
    return 'hace ${diff.inDays} d';
  }
}

class _Badge extends StatelessWidget {
  const _Badge({required this.label});
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: VexaColors.secondary100,
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(label,
          style: const TextStyle(
              fontSize: 10, fontWeight: FontWeight.w700,
              color: VexaColors.secondary700)),
    );
  }
}

class _RouteRow extends StatelessWidget {
  const _RouteRow({required this.icon, required this.color, required this.label});

  final IconData icon;
  final Color color;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 14, color: color),
        const SizedBox(width: 8),
        Expanded(
          child: Text(label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(fontSize: 13, color: VexaColors.gray700)),
        ),
      ],
    );
  }
}
