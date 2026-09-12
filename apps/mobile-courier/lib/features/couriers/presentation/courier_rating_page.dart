import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/vexa_colors.dart';
import '../../../core/widgets/company_app_bar.dart';
import '../../deliveries/providers.dart';
import '../../jobs/data/jobs_repository.dart';

/// Figma: courier-rating. Las categorías (puntualidad/comunicación/cuidado)
/// son solo de UI — igual que en el portal web, el backend solo persiste
/// la puntuación general + comentario (`POST /jobs/:id/rate`).
class CourierRatingPage extends ConsumerStatefulWidget {
  const CourierRatingPage({super.key, required this.jobId});

  final String jobId;

  @override
  ConsumerState<CourierRatingPage> createState() => _CourierRatingPageState();
}

class _CourierRatingPageState extends ConsumerState<CourierRatingPage> {
  int _overall = 5;
  final _comment = TextEditingController();
  bool _submitting = false;

  @override
  void dispose() {
    _comment.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() => _submitting = true);
    try {
      await ref.read(jobsRepositoryProvider).rate(
            widget.jobId,
            score: _overall,
            comment: _comment.text.trim().isEmpty ? null : _comment.text.trim(),
          );
      ref.invalidate(companyJobDetailProvider(widget.jobId));
      if (mounted) context.pop();
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(const SnackBar(content: Text('No se pudo enviar la calificación')));
      }
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final job = ref.watch(companyJobDetailProvider(widget.jobId)).valueOrNull;

    return Scaffold(
      appBar: companyAppBar(context, 'Calificar repartidor'),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: VexaColors.gray50,
              border: Border.all(color: VexaColors.gray200),
              borderRadius: BorderRadius.circular(VexaColors.radiusLg),
            ),
            child: Row(children: [
              CircleAvatar(
                radius: 20,
                backgroundColor: VexaColors.primary100,
                backgroundImage: job?.courierAvatarUrl != null ? NetworkImage(job!.courierAvatarUrl!) : null,
                child: job?.courierAvatarUrl == null
                    ? const Icon(Icons.person, color: VexaColors.primary700) : null,
              ),
              const SizedBox(width: 12),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(job?.courierName ?? 'Repartidor', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700)),
                  Text('Envío #VX-${widget.jobId.substring(0, 6).toUpperCase()} • Entregado',
                      style: const TextStyle(fontSize: 12, color: VexaColors.gray400)),
                ],
              ),
            ]),
          ),
          const SizedBox(height: 24),
          const Center(
              child: Text('Calificación general',
                  style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: VexaColors.gray600))),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              for (var i = 1; i <= 5; i++)
                IconButton(
                  iconSize: 32,
                  onPressed: () => setState(() => _overall = i),
                  icon: Icon(i <= _overall ? Icons.star : Icons.star_border, color: VexaColors.warning500),
                ),
            ],
          ),
          const SizedBox(height: 20),
          const _CategoryRow(label: 'Puntualidad'),
          const _CategoryRow(label: 'Comunicación'),
          const _CategoryRow(label: 'Cuidado del paquete'),
          const SizedBox(height: 20),
          const Text('Comparte tu retroalimentación (opcional)',
              style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: VexaColors.gray600)),
          const SizedBox(height: 8),
          TextField(
            controller: _comment,
            maxLines: 4,
            decoration: InputDecoration(
              hintText: 'Describe la entrega, actitud del repartidor, puntualidad...',
              filled: true,
              fillColor: VexaColors.gray50,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(VexaColors.radiusMd),
                borderSide: const BorderSide(color: VexaColors.gray200),
              ),
            ),
          ),
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            height: 52,
            child: FilledButton(
              onPressed: _submitting ? null : _submit,
              child: _submitting
                  ? const SizedBox(
                      width: 20, height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : const Text('Enviar calificación'),
            ),
          ),
        ],
      ),
    );
  }
}

class _CategoryRow extends StatefulWidget {
  const _CategoryRow({required this.label});

  final String label;

  @override
  State<_CategoryRow> createState() => _CategoryRowState();
}

class _CategoryRowState extends State<_CategoryRow> {
  int _value = 5;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(widget.label, style: const TextStyle(fontSize: 14, color: VexaColors.gray600)),
          Row(
            children: [
              for (var i = 1; i <= 5; i++)
                GestureDetector(
                  onTap: () => setState(() => _value = i),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 2),
                    child: Icon(i <= _value ? Icons.star : Icons.star_border,
                        size: 18, color: VexaColors.warning500),
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }
}
