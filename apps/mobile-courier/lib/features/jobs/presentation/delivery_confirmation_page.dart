import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/router.dart';
import '../../../core/storage/file_upload_repository.dart';
import '../../../core/theme/vexa_colors.dart';
import '../providers.dart';
import 'widgets/verification_widgets.dart';

/// Figma: delivery-confirmation — contacto destinatario, verificación de ID,
/// foto de prueba, firma y "Complete Delivery".
class DeliveryConfirmationPage extends ConsumerStatefulWidget {
  const DeliveryConfirmationPage({super.key, required this.jobId});

  final String jobId;

  @override
  ConsumerState<DeliveryConfirmationPage> createState() =>
      _DeliveryConfirmationPageState();
}

class _DeliveryConfirmationPageState
    extends ConsumerState<DeliveryConfirmationPage> {
  final _recipient = TextEditingController();
  bool _photo = false;
  bool _signature = false;
  bool _uploading = false;
  bool _loading = false;
  String? _proofUrl;

  @override
  void dispose() {
    _recipient.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Confirmar entrega'),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 16),
            child: Center(
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: VexaColors.success100,
                  borderRadius: BorderRadius.circular(999),
                ),
                child: const Text('ENTREGA',
                    style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: VexaColors.success700)),
              ),
            ),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          const VerificationSectionTitle('CONTACTO DEL DESTINATARIO'),
          Card(
            margin: EdgeInsets.zero,
            child: ListTile(
              leading: const CircleAvatar(
                backgroundColor: VexaColors.primary100,
                child: Icon(Icons.person, color: VexaColors.primary700),
              ),
              title: Text(_recipient.text.isEmpty
                  ? 'Destinatario'
                  : _recipient.text),
              subtitle: const Text('Contacto registrado por la empresa'),
            ),
          ),
          const SizedBox(height: 16),
          const VerificationSectionTitle('VERIFICACIÓN DEL DESTINATARIO'),
          TextField(
            controller: _recipient,
            decoration: const InputDecoration(
              labelText: 'Nombre del destinatario',
              hintText: 'Nombre completo',
            ),
            onChanged: (_) => setState(() {}),
          ),
          const SizedBox(height: 12),
          const Row(
            children: [
              Icon(Icons.badge_outlined, size: 18, color: VexaColors.primary600),
              SizedBox(width: 8),
              Text('Verificación de identidad requerida',
                  style: TextStyle(fontSize: 13)),
              Spacer(),
              StatusPillInfo(label: 'VERIFICADO'),
            ],
          ),
          const SizedBox(height: 16),
          const VerificationSectionTitle('FOTO DE PRUEBA DE ENTREGA'),
          UploadTile(
            icon: Icons.photo_camera_outlined,
            label: _uploading
                ? 'Subiendo foto…'
                : _photo
                    ? 'Foto capturada'
                    : 'Tomar foto de entrega',
            done: _photo,
            onTap: _captureProof,
          ),
          const SizedBox(height: 16),
          const VerificationSectionTitle('FIRMA DIGITAL DEL DESTINATARIO'),
          UploadTile(
            icon: Icons.draw_outlined,
            label: _signature
                ? 'Firma capturada'
                : 'El destinatario firma en pantalla',
            done: _signature,
            onTap: () => setState(() => _signature = true),
          ),
          const SizedBox(height: 24),
          FilledButton(
            onPressed: _loading ? null : _complete,
            style: FilledButton.styleFrom(
              backgroundColor: VexaColors.success500,
            ),
            child: _loading
                ? const SizedBox(
                    width: 20, height: 20,
                    child: CircularProgressIndicator(
                        strokeWidth: 2, color: Colors.white))
                : const Text('Completar entrega'),
          ),
        ],
      ),
    );
  }

  /// Captura la foto POD y la sube a R2 vía presigned URL.
  Future<void> _captureProof() async {
    setState(() => _uploading = true);
    try {
      final url = await ref
          .read(fileUploadRepositoryProvider)
          .captureAndUpload(folder: StorageFolder.proofs);
      if (!mounted) return;
      if (url != null) {
        setState(() {
          _photo = true;
          _proofUrl = url;
        });
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('No se pudo subir la foto')),
        );
      }
    } finally {
      if (mounted) setState(() => _uploading = false);
    }
  }

  Future<void> _complete() async {
    setState(() => _loading = true);
    try {
      await ref
          .read(jobDetailProvider(widget.jobId).notifier)
          .complete(proofOfDeliveryUrl: _proofUrl);
      if (!mounted) return;
      await context.push(AppRoutes.courierJobProof(widget.jobId));
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('No se pudo completar la entrega')),
        );
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }
}
