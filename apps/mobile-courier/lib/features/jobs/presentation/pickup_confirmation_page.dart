import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/router.dart';
import '../../../core/theme/vexa_colors.dart';
import '../providers.dart';
import 'widgets/verification_widgets.dart';

/// Figma: pickup-confirmation — checklist de verificación, foto del paquete,
/// firma del remitente y notas antes de confirmar la recogida.
class PickupConfirmationPage extends ConsumerStatefulWidget {
  const PickupConfirmationPage({super.key, required this.jobId});

  final String jobId;

  @override
  ConsumerState<PickupConfirmationPage> createState() =>
      _PickupConfirmationPageState();
}

class _PickupConfirmationPageState
    extends ConsumerState<PickupConfirmationPage> {
  final _notes = TextEditingController();
  final _checks = [true, true, false];
  bool _photo = false;
  bool _signature = false;
  bool _loading = false;

  @override
  void dispose() {
    _notes.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final job = ref.watch(jobDetailProvider(widget.jobId)).valueOrNull;
    final refCode = job != null
        ? 'VX-${job.id.substring(0, job.id.length.clamp(0, 6)).toUpperCase()}'
        : widget.jobId;

    return Scaffold(
      appBar: AppBar(title: const Text('Confirmar recogida')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('PEDIDO',
                      style: TextStyle(
                          fontSize: 10, letterSpacing: 0.6,
                          color: VexaColors.gray500,
                          fontWeight: FontWeight.w600)),
                  Text('#$refCode',
                      style: const TextStyle(
                          fontSize: 16, fontWeight: FontWeight.w700)),
                ],
              ),
              const StatusPillInfo(label: 'RECOGIDA'),
            ],
          ),
          const SizedBox(height: 20),
          const VerificationSectionTitle('CHECKLIST DE VERIFICACIÓN'),
          Card(
            margin: EdgeInsets.zero,
            child: Column(
              children: [
                VerificationCheckTile(
                    label: 'Confirmar ID del paquete #$refCode',
                    value: _checks[0],
                    onChanged: (v) => setState(() => _checks[0] = v)),
                VerificationCheckTile(
                    label: 'Verificar peso físico (~12.5 kg)',
                    value: _checks[1],
                    onChanged: (v) => setState(() => _checks[1] = v)),
                VerificationCheckTile(
                    label: 'Etiqueta de frágil presente',
                    value: _checks[2],
                    onChanged: (v) => setState(() => _checks[2] = v)),
              ],
            ),
          ),
          const SizedBox(height: 16),
          const VerificationSectionTitle('FOTO DEL PAQUETE'),
          UploadTile(
            icon: Icons.photo_camera_outlined,
            label: _photo ? 'Foto capturada' : 'Tomar foto del paquete',
            done: _photo,
            onTap: () => setState(() => _photo = true),
          ),
          const SizedBox(height: 16),
          const VerificationSectionTitle('FIRMA DEL REMITENTE'),
          UploadTile(
            icon: Icons.draw_outlined,
            label: _signature ? 'Firma capturada' : 'Firmar en pantalla',
            done: _signature,
            onTap: () => setState(() => _signature = true),
          ),
          const SizedBox(height: 16),
          const VerificationSectionTitle('NOTAS ADICIONALES'),
          TextField(
            controller: _notes,
            maxLines: 2,
            decoration: const InputDecoration(
              hintText: 'Daños o diferencias de peso…',
            ),
          ),
          const SizedBox(height: 24),
          FilledButton(
            onPressed: _loading ? null : _confirm,
            child: _loading
                ? const SizedBox(
                    width: 20, height: 20,
                    child: CircularProgressIndicator(
                        strokeWidth: 2, color: Colors.white))
                : const Text('Confirmar recogida'),
          ),
        ],
      ),
    );
  }

  Future<void> _confirm() async {
    setState(() => _loading = true);
    try {
      await ref.read(jobDetailProvider(widget.jobId).notifier).pickUp();
      if (!mounted) return;
      await context.push(AppRoutes.courierJobDelivery(widget.jobId));
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('No se pudo confirmar la recogida')),
        );
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }
}
