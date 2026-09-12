import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/router.dart';
import '../../../../core/theme/vexa_colors.dart';
import '../../../../core/widgets/company_app_bar.dart';
import '../../../../core/widgets/company_field.dart';
import 'job_draft_controller.dart';
import 'step_progress.dart';

const _packageTypes = [
  (id: 'document', icon: Icons.description_outlined, label: 'Documento', sub: 'Sobres, archivos'),
  (id: 'small', icon: Icons.inventory_2_outlined, label: 'Paquete pequeño', sub: 'Hasta 5 kg'),
  (id: 'large', icon: Icons.inventory_2, label: 'Paquete grande', sub: 'Hasta 30 kg'),
  (id: 'pallet', icon: Icons.grid_view_outlined, label: 'Pallet', sub: 'Carga voluminosa'),
];

/// Figma: create-delivery-request (paso 1/4 del flujo "Nuevo envío").
class CreateDeliveryRequestPage extends ConsumerStatefulWidget {
  const CreateDeliveryRequestPage({super.key});

  @override
  ConsumerState<CreateDeliveryRequestPage> createState() => _CreateDeliveryRequestPageState();
}

class _CreateDeliveryRequestPageState extends ConsumerState<CreateDeliveryRequestPage> {
  late final TextEditingController _weight;

  @override
  void initState() {
    super.initState();
    final draft = ref.read(jobDraftProvider);
    _weight = TextEditingController(text: draft.weightKg?.toString() ?? '');
  }

  @override
  void dispose() {
    _weight.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final draft = ref.watch(jobDraftProvider);
    final notifier = ref.read(jobDraftProvider.notifier);

    return Scaffold(
      appBar: companyAppBar(context, 'Nuevo envío'),
      body: Column(
        children: [
          const StepProgress(step: 1),
          Expanded(
            child: ListView(
              padding: const EdgeInsets.all(24),
              children: [
                const Text('¿Qué vas a enviar?',
                    style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: VexaColors.gray800)),
                const SizedBox(height: 6),
                const Text('Selecciona el tamaño y categoría del paquete.',
                    style: TextStyle(fontSize: 14, color: VexaColors.gray600)),
                const SizedBox(height: 20),
                for (final type in _packageTypes)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: _TypeCard(
                      icon: type.icon,
                      label: type.label,
                      sub: type.sub,
                      selected: draft.packageType == type.id,
                      onTap: () => notifier.update((d) => d.copyWith(packageType: type.id)),
                    ),
                  ),
                const SizedBox(height: 8),
                CompanyField(
                  label: 'Peso estimado (kg)',
                  hint: 'ej. 4.5',
                  icon: Icons.tag,
                  controller: _weight,
                  keyboardType: const TextInputType.numberWithOptions(decimal: true),
                ),
                const SizedBox(height: 20),
                const Text('MANEJO ESPECIAL',
                    style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: VexaColors.gray800)),
                const SizedBox(height: 4),
                SwitchListTile(
                  contentPadding: EdgeInsets.zero,
                  title: const Text('Artículo frágil', style: TextStyle(fontSize: 15)),
                  value: draft.fragile,
                  onChanged: (v) => notifier.update((d) => d.copyWith(fragile: v)),
                ),
                SwitchListTile(
                  contentPadding: EdgeInsets.zero,
                  title: const Text('Temperatura controlada', style: TextStyle(fontSize: 15)),
                  value: draft.refrigerated,
                  onChanged: (v) => notifier.update((d) => d.copyWith(refrigerated: v)),
                ),
              ],
            ),
          ),
          SafeArea(
            top: false,
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: SizedBox(
                width: double.infinity,
                height: 52,
                child: FilledButton(
                  onPressed: () {
                    notifier.update(
                      (d) => d.copyWith(weightKg: double.tryParse(_weight.text)),
                    );
                    context.push(AppRoutes.companyJobCreateDetails);
                  },
                  child: const Text('Siguiente'),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _TypeCard extends StatelessWidget {
  const _TypeCard({
    required this.icon,
    required this.label,
    required this.sub,
    required this.selected,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final String sub;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: selected ? VexaColors.primary50 : VexaColors.gray50,
      borderRadius: BorderRadius.circular(VexaColors.radiusLg),
      child: InkWell(
        borderRadius: BorderRadius.circular(VexaColors.radiusLg),
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(VexaColors.radiusLg),
            border: Border.all(
              color: selected ? VexaColors.primary600 : VexaColors.gray200,
              width: selected ? 2 : 1,
            ),
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: selected ? VexaColors.primary600 : VexaColors.gray100,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, size: 20, color: selected ? Colors.white : VexaColors.gray600),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(label, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                    Text(sub, style: const TextStyle(fontSize: 13, color: VexaColors.gray600)),
                  ],
                ),
              ),
              if (selected)
                const Icon(Icons.check_circle, size: 20, color: VexaColors.primary600),
            ],
          ),
        ),
      ),
    );
  }
}
