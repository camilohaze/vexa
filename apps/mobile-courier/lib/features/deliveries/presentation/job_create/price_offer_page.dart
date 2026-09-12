import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../../../app/router.dart';
import '../../../../core/theme/vexa_colors.dart';
import '../../../../core/widgets/company_app_bar.dart';
import '../../../../core/widgets/company_field.dart';
import 'job_draft_controller.dart';

/// Figma: price-offer-screen (paso 5/6, sin barra de progreso).
class PriceOfferPage extends ConsumerStatefulWidget {
  const PriceOfferPage({super.key});

  @override
  ConsumerState<PriceOfferPage> createState() => _PriceOfferPageState();
}

class _PriceOfferPageState extends ConsumerState<PriceOfferPage> {
  late final TextEditingController _price;

  @override
  void initState() {
    super.initState();
    final draft = ref.read(jobDraftProvider);
    _price = TextEditingController(
      text: draft.offeredPrice != null ? draft.offeredPrice!.toStringAsFixed(0) : '',
    );
  }

  @override
  void dispose() {
    _price.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final draft = ref.watch(jobDraftProvider);
    final estimate = draft.estimate;
    final money = NumberFormat.currency(locale: 'es_CO', symbol: r'$', decimalDigits: 0).format;
    final breakdown = estimate?['breakdown'] as Map<String, dynamic>?;
    final distanceKm = ((estimate?['distanceMeters'] as num?) ?? 0) / 1000;
    final durationMin = ((estimate?['durationSeconds'] as num?) ?? 0) / 60;
    final suggested = draft.offeredPrice;

    final priorityFee = breakdown != null && draft.priority != 'standard'
        ? ((breakdown['subtotal'] as num? ?? 0) *
            (((breakdown['priorityMultiplier'] as num?) ?? 1) - 1))
        : null;

    return Scaffold(
      appBar: companyAppBar(context, 'Propuesta de precio'),
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
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(children: [
                  Container(width: 12, height: 12,
                      decoration: const BoxDecoration(color: VexaColors.primary600, shape: BoxShape.circle)),
                  const SizedBox(width: 12),
                  Expanded(child: Text(draft.pickupLine1,
                      style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600))),
                ]),
                const Padding(
                  padding: EdgeInsets.only(left: 5),
                  child: SizedBox(height: 16, child: VerticalDivider(width: 2)),
                ),
                Row(children: [
                  Container(width: 12, height: 12,
                      decoration: const BoxDecoration(color: VexaColors.secondary500, shape: BoxShape.circle)),
                  const SizedBox(width: 12),
                  Expanded(child: Text(draft.dropoffLine1,
                      style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600))),
                ]),
                const SizedBox(height: 12),
                Text(
                  'Distancia: ${distanceKm.toStringAsFixed(1)} km • Tiempo estimado: ${durationMin.round()} min',
                  style: const TextStyle(fontSize: 13, color: VexaColors.gray600),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          if (suggested != null)
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: VexaColors.primary50,
                border: Border.all(color: VexaColors.primary600),
                borderRadius: BorderRadius.circular(VexaColors.radiusLg),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('PRECIO SUGERIDO DE MERCADO',
                      style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: VexaColors.primary600)),
                  const SizedBox(height: 8),
                  Text('${money(suggested * 0.92)} - ${money(suggested * 1.08)}',
                      style: const TextStyle(
                          fontSize: 30, fontWeight: FontWeight.w800, color: VexaColors.primary600)),
                  const SizedBox(height: 8),
                  Text(
                    'Según la demanda actual de transportistas y la prioridad ${draft.priorityLabel.toLowerCase()}.',
                    style: const TextStyle(fontSize: 12, color: VexaColors.gray600),
                  ),
                ],
              ),
            ),
          const SizedBox(height: 20),
          CompanyField(
            label: 'Tu oferta de precio (COP)',
            hint: 'ej. 22000',
            icon: Icons.payments_outlined,
            controller: _price,
            keyboardType: const TextInputType.numberWithOptions(decimal: false),
          ),
          if (breakdown != null) ...[
            const SizedBox(height: 20),
            const Text('DESGLOSE DE COSTOS',
                style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: VexaColors.gray800)),
            const SizedBox(height: 8),
            _BreakdownRow('Tarifa base', money((breakdown['base'] as num?) ?? 0)),
            _BreakdownRow('Distancia (${distanceKm.toStringAsFixed(1)} km)', money((breakdown['distance'] as num?) ?? 0)),
            _BreakdownRow('Recargo por peso', money((breakdown['weight'] as num?) ?? 0)),
            if (priorityFee != null)
              _BreakdownRow('Recargo por prioridad ${draft.priorityLabel}', money(priorityFee)),
          ],
        ],
      ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: SizedBox(
            width: double.infinity,
            height: 52,
            child: FilledButton(
              onPressed: _price.text.trim().isEmpty
                  ? null
                  : () {
                      ref.read(jobDraftProvider.notifier).update(
                            (d) => d.copyWith(offeredPrice: double.tryParse(_price.text)),
                          );
                      context.push(AppRoutes.companyJobCreateReview);
                    },
              child: const Text('Fijar precio y continuar'),
            ),
          ),
        ),
      ),
    );
  }
}

class _BreakdownRow extends StatelessWidget {
  const _BreakdownRow(this.label, this.value);

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(fontSize: 13, color: VexaColors.gray600)),
          Text(value, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: VexaColors.gray800)),
        ],
      ),
    );
  }
}
