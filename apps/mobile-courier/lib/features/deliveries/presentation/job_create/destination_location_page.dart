import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/router.dart';
import '../../../../core/config/env.dart';
import '../../../../core/theme/vexa_colors.dart';
import '../../../../core/widgets/address_search_unavailable_notice.dart';
import '../../../../core/widgets/company_app_bar.dart';
import '../../../../core/widgets/company_field.dart';
import '../../../jobs/data/jobs_repository.dart';
import '../../data/geocoding_repository.dart';
import 'job_draft_controller.dart';

/// Figma: destination-location (paso 4/6, sin barra de progreso).
class DestinationLocationPage extends ConsumerStatefulWidget {
  const DestinationLocationPage({super.key});

  @override
  ConsumerState<DestinationLocationPage> createState() => _DestinationLocationPageState();
}

class _DestinationLocationPageState extends ConsumerState<DestinationLocationPage> {
  late final TextEditingController _address;
  late final TextEditingController _city;
  late final TextEditingController _state;
  late final TextEditingController _recipientName;
  late final TextEditingController _recipientPhone;
  late final TextEditingController _instructions;
  List<GeocodeResult> _suggestions = const [];
  double? _lat;
  double? _lng;
  bool _loadingEstimate = false;

  @override
  void initState() {
    super.initState();
    final draft = ref.read(jobDraftProvider);
    _address = TextEditingController(text: draft.dropoffLine1);
    _city = TextEditingController(text: draft.dropoffCity);
    _state = TextEditingController(text: draft.dropoffState);
    _recipientName = TextEditingController(text: draft.dropoffContactName);
    _recipientPhone = TextEditingController(text: draft.dropoffContactPhone);
    _instructions = TextEditingController(text: draft.deliveryInstructions);
    _lat = draft.dropoffLat;
    _lng = draft.dropoffLng;
  }

  @override
  void dispose() {
    _address.dispose();
    _city.dispose();
    _state.dispose();
    _recipientName.dispose();
    _recipientPhone.dispose();
    _instructions.dispose();
    super.dispose();
  }

  Future<void> _search(String query) async {
    if (query.trim().length < 3) {
      setState(() => _suggestions = const []);
      return;
    }
    final results = await ref.read(geocodingRepositoryProvider).search(query);
    if (mounted) setState(() => _suggestions = results);
  }

  void _select(GeocodeResult result) {
    setState(() {
      _address.text = result.line1;
      _city.text = result.city;
      _lat = result.lat;
      _lng = result.lng;
      _suggestions = const [];
    });
  }

  Future<void> _confirmAndContinue() async {
    final draft = ref.read(jobDraftProvider);
    ref.read(jobDraftProvider.notifier).update((d) => d.copyWith(
          dropoffLine1: _address.text,
          dropoffCity: _city.text,
          dropoffState: _state.text,
          dropoffLat: _lat,
          dropoffLng: _lng,
          dropoffContactName: _recipientName.text,
          dropoffContactPhone: _recipientPhone.text,
          deliveryInstructions: _instructions.text,
        ));

    setState(() => _loadingEstimate = true);
    try {
      final estimate = await ref.read(jobsRepositoryProvider).priceEstimate(
            pickupLat: draft.pickupLat!,
            pickupLng: draft.pickupLng!,
            dropoffLat: _lat!,
            dropoffLng: _lng!,
            weightKg: draft.weightKg,
            priority: draft.priority,
          );
      ref.read(jobDraftProvider.notifier).update((d) => d.copyWith(
            offeredPrice: (estimate['price'] as num?)?.toDouble(),
            estimate: estimate,
          ));
    } catch (_) {
      // Sin estimado disponible (p.ej. sin token de Mapbox en el backend) —
      // el usuario aún puede fijar su propio precio en la siguiente pantalla.
    } finally {
      if (mounted) setState(() => _loadingEstimate = false);
    }
    if (mounted) await context.push(AppRoutes.companyJobCreatePrice);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: companyAppBar(context, 'Destino de entrega'),
      body: ListView(
        padding: EdgeInsets.zero,
        children: [
          Container(
            height: 200,
            color: VexaColors.gray100,
            child: Stack(
              children: [
                const Center(child: Icon(Icons.map_outlined, size: 40, color: VexaColors.gray400)),
                Positioned(
                  left: 16,
                  right: 16,
                  top: 16,
                  child: Material(
                    borderRadius: BorderRadius.circular(VexaColors.radiusMd),
                    elevation: 1,
                    child: TextField(
                      onChanged: _search,
                      decoration: const InputDecoration(
                        hintText: 'Buscar dirección de destino...',
                        prefixIcon: Icon(Icons.search, size: 18),
                        border: InputBorder.none,
                        contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      ),
                    ),
                  ),
                ),
                if (_suggestions.isNotEmpty)
                  Positioned(
                    left: 16,
                    right: 16,
                    top: 64,
                    child: Material(
                      borderRadius: BorderRadius.circular(VexaColors.radiusMd),
                      elevation: 2,
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          for (final s in _suggestions)
                            ListTile(
                              dense: true,
                              title: Text(s.line1, style: const TextStyle(fontSize: 13)),
                              onTap: () => _select(s),
                            ),
                        ],
                      ),
                    ),
                  ),
              ],
            ),
          ),
          if (!Env.hasMapbox) const AddressSearchUnavailableNotice(),
          Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Dirección de destino',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                const SizedBox(height: 16),
                CompanyField(
                  label: 'Dirección',
                  hint: 'Calle 45 # 8-30',
                  icon: Icons.location_on_outlined,
                  controller: _address,
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: CompanyField(label: 'Ciudad', hint: 'Bogotá', controller: _city),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: CompanyField(label: 'Estado/Depto', hint: 'CO', controller: _state),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                const Text('Datos del destinatario',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                const SizedBox(height: 16),
                CompanyField(
                  label: 'Nombre del destinatario',
                  hint: 'Sara Jiménez',
                  icon: Icons.person_outline,
                  controller: _recipientName,
                ),
                const SizedBox(height: 16),
                CompanyField(
                  label: 'Teléfono del destinatario',
                  hint: '+57 300 000 0000',
                  icon: Icons.phone_outlined,
                  controller: _recipientPhone,
                  keyboardType: TextInputType.phone,
                ),
                const SizedBox(height: 16),
                CompanyField(
                  label: 'Instrucciones de entrega',
                  hint: 'Dejar en recepción, timbrar',
                  icon: Icons.edit_outlined,
                  controller: _instructions,
                ),
              ],
            ),
          ),
        ],
      ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: SizedBox(
            width: double.infinity,
            height: 52,
            child: FilledButton(
              onPressed: _lat == null || _lng == null || _address.text.isEmpty || _loadingEstimate
                  ? null
                  : _confirmAndContinue,
              child: _loadingEstimate
                  ? const SizedBox(
                      width: 20, height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : const Text('Confirmar destino'),
            ),
          ),
        ),
      ),
    );
  }
}
