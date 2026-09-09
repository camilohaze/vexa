import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';

import '../../../core/storage/file_upload_repository.dart';
import '../../../core/theme/vexa_colors.dart';
import '../../jobs/presentation/widgets/verification_widgets.dart';
import '../../profile/data/courier_repository.dart';

/// Figma: identity-verification — tipo de documento, escaneos
/// frontal/trasero, selfie y progreso de carga. Sube a R2 y envía a revisión.
class IdentityVerificationPage extends ConsumerStatefulWidget {
  const IdentityVerificationPage({super.key});

  @override
  ConsumerState<IdentityVerificationPage> createState() =>
      _IdentityVerificationPageState();
}

class _IdentityVerificationPageState
    extends ConsumerState<IdentityVerificationPage> {
  static const _docs = [
    ('Cédula / ID nacional', Icons.badge_outlined, 'national_id'),
    ('Pasaporte', Icons.book_outlined, 'passport'),
    ('Licencia de conducir', Icons.credit_card, 'driver_license'),
  ];

  int _doc = 0;
  final _urls = <String>[];
  bool _front = false;
  bool _back = false;
  bool _selfie = false;
  bool _busy = false;
  bool _submitting = false;

  double get _progress =>
      ([_front, _back, _selfie].where((b) => b).length) / 3;

  Future<void> _capture(void Function() markDone,
      {ImageSource source = ImageSource.camera}) async {
    if (_busy) return;
    setState(() => _busy = true);
    try {
      final url = await ref
          .read(fileUploadRepositoryProvider)
          .captureAndUpload(source: source, folder: StorageFolder.documents);
      if (!mounted || url == null) return;
      _urls.add(url);
      setState(markDone);
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('No se pudo subir el documento')),
        );
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _submit() async {
    setState(() => _submitting = true);
    try {
      await ref.read(courierRepositoryProvider).submitVerification(
        'identity',
        _urls,
        meta: {'documentType': _docs[_doc].$3},
      );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Documentos enviados a revisión')),
      );
      Navigator.of(context).pop();
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Error al enviar los documentos')),
        );
      }
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final done = _front && _back && _selfie;

    return Scaffold(
      appBar: AppBar(title: const Text('Verificar identidad')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          const Text(
            'Necesitamos verificar tus documentos oficiales para activar los pagos de repartidor.',
            style: TextStyle(fontSize: 13, color: VexaColors.gray600),
          ),
          const SizedBox(height: 20),
          const VerificationSectionTitle('TIPO DE DOCUMENTO'),
          Card(
            margin: EdgeInsets.zero,
            child: RadioGroup<int>(
              groupValue: _doc,
              onChanged: (v) => setState(() => _doc = v ?? 0),
              child: Column(
                children: [
                  for (var i = 0; i < _docs.length; i++)
                    RadioListTile<int>(
                      secondary: Icon(_docs[i].$2, size: 20),
                      title: Text(_docs[i].$1,
                          style: const TextStyle(fontSize: 14)),
                      value: i,
                    ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 20),
          const VerificationSectionTitle('SUBIR ESCANEOS'),
          Row(
            children: [
              Expanded(
                child: UploadTile(
                  icon: Icons.photo_camera_outlined,
                  label: _front ? 'Listo' : 'Frente del documento',
                  done: _front,
                  onTap: () => _capture(() => _front = true),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: UploadTile(
                  icon: Icons.photo_camera_outlined,
                  label: _back ? 'Listo' : 'Reverso del documento',
                  done: _back,
                  onTap: () => _capture(() => _back = true),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          UploadTile(
            icon: Icons.face_retouching_natural,
            label: _selfie
                ? 'Selfie capturada'
                : 'Tomar selfie\nAlinea tu rostro dentro del óvalo',
            done: _selfie,
            onTap: () =>
                _capture(() => _selfie = true, source: ImageSource.camera),
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              Text(
                done ? 'Listo para enviar' : 'Subiendo…',
                style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: done ? VexaColors.success700 : VexaColors.gray600),
              ),
              const Spacer(),
              Text('${(_progress * 100).round()}% completado',
                  style: const TextStyle(
                      fontSize: 12, color: VexaColors.gray500)),
            ],
          ),
          const SizedBox(height: 6),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: _progress,
              minHeight: 8,
              backgroundColor: VexaColors.gray100,
              valueColor: AlwaysStoppedAnimation(
                  done ? VexaColors.success500 : VexaColors.primary600),
            ),
          ),
          const SizedBox(height: 24),
          FilledButton(
            onPressed: done && !_submitting ? _submit : null,
            child: _submitting
                ? const SizedBox(
                    width: 20, height: 20,
                    child: CircularProgressIndicator(
                        strokeWidth: 2, color: Colors.white))
                : const Text('Enviar a revisión'),
          ),
        ],
      ),
    );
  }
}
