import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/router.dart';
import '../../../../core/theme/vexa_colors.dart';
import '../../../../core/widgets/company_app_bar.dart';
import '../../../../core/widgets/company_field.dart';
import 'job_draft_controller.dart';
import 'step_progress.dart';

const _priorities = [
  (id: 'standard', label: 'Estándar', sub: '2-3 días'),
  (id: 'express', label: 'Express', sub: 'Al día siguiente'),
  (id: 'same_day', label: 'Mismo día', sub: 'Inmediato'),
];

/// Figma: delivery-details-form (paso 2/4).
class DeliveryDetailsFormPage extends ConsumerStatefulWidget {
  const DeliveryDetailsFormPage({super.key});

  @override
  ConsumerState<DeliveryDetailsFormPage> createState() => _DeliveryDetailsFormPageState();
}

class _DeliveryDetailsFormPageState extends ConsumerState<DeliveryDetailsFormPage> {
  late final TextEditingController _description;
  late final TextEditingController _length;
  late final TextEditingController _width;
  late final TextEditingController _height;
  late final TextEditingController _notes;
  DateTime? _pickupAt;

  @override
  void initState() {
    super.initState();
    final draft = ref.read(jobDraftProvider);
    _description = TextEditingController(text: draft.description);
    _length = TextEditingController(text: draft.dimL?.toString() ?? '');
    _width = TextEditingController(text: draft.dimW?.toString() ?? '');
    _height = TextEditingController(text: draft.dimH?.toString() ?? '');
    _notes = TextEditingController(text: draft.additionalNotes);
    _pickupAt = draft.pickupAt;
  }

  @override
  void dispose() {
    _description.dispose();
    _length.dispose();
    _width.dispose();
    _height.dispose();
    _notes.dispose();
    super.dispose();
  }

  Future<void> _pickDateTime() async {
    final date = await showDatePicker(
      context: context,
      initialDate: _pickupAt ?? DateTime.now(),
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 60)),
    );
    if (date == null || !mounted) return;
    final time = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.fromDateTime(_pickupAt ?? DateTime.now()),
    );
    if (time == null) return;
    setState(() => _pickupAt = DateTime(date.year, date.month, date.day, time.hour, time.minute));
  }

  @override
  Widget build(BuildContext context) {
    final draft = ref.watch(jobDraftProvider);
    final notifier = ref.read(jobDraftProvider.notifier);

    return Scaffold(
      appBar: companyAppBar(context, 'Detalles del paquete'),
      body: Column(
        children: [
          const StepProgress(step: 2),
          Expanded(
            child: ListView(
              padding: const EdgeInsets.all(24),
              children: [
                const Text('Danos las especificaciones',
                    style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: VexaColors.gray800)),
                const SizedBox(height: 6),
                const Text('Dimensiones, prioridad y horario de recogida.',
                    style: TextStyle(fontSize: 14, color: VexaColors.gray600)),
                const SizedBox(height: 20),
                CompanyField(
                  label: 'Descripción del paquete',
                  hint: 'ej. Caja de repuestos mecánicos',
                  icon: Icons.description_outlined,
                  controller: _description,
                ),
                const SizedBox(height: 18),
                const Text('Dimensiones (L x A x H cm)',
                    style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: VexaColors.gray600)),
                const SizedBox(height: 6),
                Row(
                  children: [
                    Expanded(child: _DimField(controller: _length, hint: 'Largo')),
                    const SizedBox(width: 12),
                    Expanded(child: _DimField(controller: _width, hint: 'Ancho')),
                    const SizedBox(width: 12),
                    Expanded(child: _DimField(controller: _height, hint: 'Alto')),
                  ],
                ),
                const SizedBox(height: 18),
                const Text('Prioridad de entrega',
                    style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: VexaColors.gray600)),
                const SizedBox(height: 8),
                Row(
                  children: [
                    for (final p in _priorities)
                      Expanded(
                        child: Padding(
                          padding: EdgeInsets.only(right: p == _priorities.last ? 0 : 8),
                          child: _PriorityCard(
                            label: p.label,
                            sub: p.sub,
                            selected: draft.priority == p.id,
                            onTap: () => notifier.update((d) => d.copyWith(priority: p.id)),
                          ),
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 18),
                CompanyField(
                  label: 'Fecha y hora preferida de recogida',
                  hint: _pickupAt == null
                      ? 'Selecciona fecha y hora'
                      : '${_pickupAt!.day}/${_pickupAt!.month}/${_pickupAt!.year} · '
                          '${_pickupAt!.hour.toString().padLeft(2, '0')}:${_pickupAt!.minute.toString().padLeft(2, '0')}',
                  icon: Icons.calendar_today_outlined,
                  readOnly: true,
                  onTap: _pickDateTime,
                ),
                const SizedBox(height: 18),
                CompanyField(
                  label: 'Notas adicionales',
                  hint: 'Instrucciones especiales para el transportista',
                  icon: Icons.edit_outlined,
                  controller: _notes,
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
                    notifier.update((d) => d.copyWith(
                          description: _description.text,
                          dimL: double.tryParse(_length.text),
                          dimW: double.tryParse(_width.text),
                          dimH: double.tryParse(_height.text),
                          additionalNotes: _notes.text,
                          pickupAt: _pickupAt,
                        ));
                    context.push(AppRoutes.companyJobCreatePickup);
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

class _DimField extends StatelessWidget {
  const _DimField({required this.controller, required this.hint});

  final TextEditingController controller;
  final String hint;

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      controller: controller,
      keyboardType: const TextInputType.numberWithOptions(decimal: true),
      decoration: InputDecoration(
        hintText: hint,
        filled: true,
        fillColor: VexaColors.gray50,
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(VexaColors.radiusMd),
          borderSide: const BorderSide(color: VexaColors.gray200),
        ),
      ),
    );
  }
}

class _PriorityCard extends StatelessWidget {
  const _PriorityCard({
    required this.label,
    required this.sub,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final String sub;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: selected ? VexaColors.primary50 : VexaColors.gray50,
      borderRadius: BorderRadius.circular(VexaColors.radiusMd),
      child: InkWell(
        borderRadius: BorderRadius.circular(VexaColors.radiusMd),
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(VexaColors.radiusMd),
            border: Border.all(
              color: selected ? VexaColors.primary600 : VexaColors.gray200,
              width: selected ? 2 : 1,
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label,
                  style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: selected ? VexaColors.primary600 : VexaColors.gray800)),
              Text(sub, style: const TextStyle(fontSize: 11, color: VexaColors.gray600)),
            ],
          ),
        ),
      ),
    );
  }
}
