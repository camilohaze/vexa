import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/router.dart';
import '../../../../core/config/env.dart';
import '../../../../core/theme/vexa_colors.dart';
import '../../../../core/widgets/address_search_unavailable_notice.dart';
import '../../../../core/widgets/company_app_bar.dart';
import '../../../../core/widgets/company_field.dart';
import '../../data/geocoding_repository.dart';
import 'job_draft_controller.dart';

/// Figma: pickup-location (paso 3/6, sin barra de progreso).
class PickupLocationPage extends ConsumerStatefulWidget {
  const PickupLocationPage({super.key});

  @override
  ConsumerState<PickupLocationPage> createState() => _PickupLocationPageState();
}

class _PickupLocationPageState extends ConsumerState<PickupLocationPage> {
  late final TextEditingController _address;
  late final TextEditingController _city;
  late final TextEditingController _state;
  late final TextEditingController _contactName;
  late final TextEditingController _contactPhone;
  List<GeocodeResult> _suggestions = const [];
  double? _lat;
  double? _lng;

  @override
  void initState() {
    super.initState();
    final draft = ref.read(jobDraftProvider);
    _address = TextEditingController(text: draft.pickupLine1);
    _city = TextEditingController(text: draft.pickupCity);
    _state = TextEditingController(text: draft.pickupState);
    _contactName = TextEditingController(text: draft.pickupContactName);
    _contactPhone = TextEditingController(text: draft.pickupContactPhone);
    _lat = draft.pickupLat;
    _lng = draft.pickupLng;
  }

  @override
  void dispose() {
    _address.dispose();
    _city.dispose();
    _state.dispose();
    _contactName.dispose();
    _contactPhone.dispose();
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: companyAppBar(context, 'Punto de recogida'),
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
                        hintText: 'Buscar dirección de recogida...',
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
                const Text('Detalles de la dirección',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                const SizedBox(height: 16),
                CompanyField(
                  label: 'Dirección',
                  hint: 'Calle 100 # 15-20',
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
                const Text('Persona de contacto',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                const SizedBox(height: 16),
                CompanyField(
                  label: 'Nombre de contacto',
                  hint: 'Juan Pérez',
                  icon: Icons.person_outline,
                  controller: _contactName,
                ),
                const SizedBox(height: 16),
                CompanyField(
                  label: 'Teléfono',
                  hint: '+57 300 000 0000',
                  icon: Icons.phone_outlined,
                  controller: _contactPhone,
                  keyboardType: TextInputType.phone,
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
              onPressed: _lat == null || _lng == null || _address.text.isEmpty
                  ? null
                  : () {
                      ref.read(jobDraftProvider.notifier).update((d) => d.copyWith(
                            pickupLine1: _address.text,
                            pickupCity: _city.text,
                            pickupState: _state.text,
                            pickupLat: _lat,
                            pickupLng: _lng,
                            pickupContactName: _contactName.text,
                            pickupContactPhone: _contactPhone.text,
                          ));
                      context.push(AppRoutes.companyJobCreateDestination);
                    },
              child: const Text('Confirmar punto de recogida'),
            ),
          ),
        ),
      ),
    );
  }
}
