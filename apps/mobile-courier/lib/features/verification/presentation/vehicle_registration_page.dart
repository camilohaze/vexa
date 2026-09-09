import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/storage/file_upload_repository.dart';
import '../../jobs/presentation/widgets/verification_widgets.dart';
import '../../profile/data/courier_repository.dart';

/// Figma: vehicle-registration — tipo de vehículo, datos del modelo,
/// placa, color y fotos de verificación.
class VehicleRegistrationPage extends ConsumerStatefulWidget {
  const VehicleRegistrationPage({super.key});

  @override
  ConsumerState<VehicleRegistrationPage> createState() =>
      _VehicleRegistrationPageState();
}

class _VehicleRegistrationPageState
    extends ConsumerState<VehicleRegistrationPage> {
  static const _types = [
    ('Bicicleta', Icons.pedal_bike, 'BICYCLE'),
    ('Moto', Icons.two_wheeler, 'MOTORCYCLE'),
    ('Carro', Icons.directions_car_outlined, 'CAR'),
    ('Van', Icons.airport_shuttle, 'VAN'),
    ('Camión', Icons.local_shipping_outlined, 'VAN'),
  ];

  String _type = 'Van';
  final _make = TextEditingController();
  final _year = TextEditingController();
  final _plate = TextEditingController();
  final _color = TextEditingController();
  final _urls = <String>[];
  bool _vehiclePhoto = false;
  bool _insuranceDoc = false;
  bool _saving = false;

  Future<void> _capture(void Function() markDone) async {
    final url = await ref
        .read(fileUploadRepositoryProvider)
        .captureAndUpload(folder: StorageFolder.documents);
    if (!mounted || url == null) return;
    _urls.add(url);
    setState(markDone);
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    try {
      final type = _types.firstWhere((t) => t.$1 == _type).$3;
      await ref.read(courierRepositoryProvider).updateVehicle({
        'vehicleType': type,
        'make': _make.text,
        'year': int.tryParse(_year.text),
        'plate': _plate.text,
        'color': _color.text,
      });
      if (_urls.isNotEmpty) {
        await ref
            .read(courierRepositoryProvider)
            .submitVerification('vehicle', _urls);
      }
      if (!mounted) return;
      Navigator.of(context).pop();
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('No se pudo guardar el vehículo')),
        );
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  void dispose() {
    _make.dispose();
    _year.dispose();
    _plate.dispose();
    _color.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(title: const Text('Agregar vehículo')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Text('Selecciona el tipo de vehículo',
              style: theme.textTheme.labelLarge),
          const SizedBox(height: 10),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              for (final (label, icon, _) in _types)
                ChoiceChip(
                  avatar: Icon(icon, size: 18),
                  label: Text(label),
                  selected: _type == label,
                  onSelected: (_) => setState(() => _type = label),
                ),
            ],
          ),
          const SizedBox(height: 24),
          _Field('Marca / Modelo', 'Ford Transit Cargo', _make),
          const SizedBox(height: 14),
          _Field('Año del modelo', '2022', _year,
              keyboard: TextInputType.number),
          const SizedBox(height: 14),
          _Field('Placa', 'BWYF-42', _plate),
          const SizedBox(height: 14),
          _Field('Color del vehículo', 'Blanco', _color),
          const SizedBox(height: 24),
          const VerificationSectionTitle('FOTOS DE VERIFICACIÓN'),
          Row(
            children: [
              Expanded(
                child: UploadTile(
                  icon: Icons.photo_camera_outlined,
                  label: _vehiclePhoto
                      ? 'Foto capturada'
                      : 'Foto del vehículo\n(frontal y lateral)',
                  done: _vehiclePhoto,
                  onTap: () => _capture(() => _vehiclePhoto = true),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: UploadTile(
                  icon: Icons.description_outlined,
                  label: _insuranceDoc
                      ? 'Documento listo'
                      : 'Documento de seguro\nPDF o foto nítida',
                  done: _insuranceDoc,
                  onTap: () => _capture(() => _insuranceDoc = true),
                ),
              ),
            ],
          ),
          const SizedBox(height: 28),
          FilledButton(
            onPressed: _saving ? null : _save,
            child: _saving
                ? const SizedBox(
                    width: 20, height: 20,
                    child: CircularProgressIndicator(
                        strokeWidth: 2, color: Colors.white))
                : const Text('Guardar vehículo'),
          ),
        ],
      ),
    );
  }
}

class _Field extends StatelessWidget {
  const _Field(this.label, this.hint, this.controller, {this.keyboard});

  final String label;
  final String hint;
  final TextEditingController controller;
  final TextInputType? keyboard;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label,
            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
        const SizedBox(height: 6),
        TextField(
          controller: controller,
          keyboardType: keyboard,
          decoration: InputDecoration(hintText: hint),
        ),
      ],
    );
  }
}
