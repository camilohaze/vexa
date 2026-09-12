import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/router.dart';
import '../../../core/theme/vexa_colors.dart';
import '../../../core/widgets/company_field.dart';
import '../../../core/widgets/menu_item_tile.dart';
import '../../../core/widgets/vexa_bottom_nav.dart';
import '../../auth/providers.dart';
import '../data/company_settings_repository.dart';
import '../providers.dart';

/// Figma: company-settings (también sirve como pestaña "Perfil").
class CompanySettingsPage extends ConsumerStatefulWidget {
  const CompanySettingsPage({super.key});

  @override
  ConsumerState<CompanySettingsPage> createState() => _CompanySettingsPageState();
}

class _CompanySettingsPageState extends ConsumerState<CompanySettingsPage> {
  final _adminEmail = TextEditingController();
  final _address = TextEditingController();
  bool _twoFactor = false;
  bool _loaded = false;
  bool _saving = false;

  void _hydrate() {
    if (_loaded) return;
    final settings = ref.read(companySettingsProvider).valueOrNull;
    if (settings == null) return;
    _adminEmail.text = settings.adminEmail ?? '';
    _address.text = settings.address ?? '';
    _twoFactor = settings.twoFactor;
    _loaded = true;
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    try {
      await ref.read(companySettingsRepositoryProvider).updateSettings(
            adminEmail: _adminEmail.text.trim().isEmpty ? null : _adminEmail.text.trim(),
            address: _address.text.trim().isEmpty ? null : _address.text.trim(),
            twoFactor: _twoFactor,
          );
      ref.invalidate(companySettingsProvider);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Cambios guardados')));
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('No se pudo guardar')));
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  void dispose() {
    _adminEmail.dispose();
    _address.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final profile = ref.watch(companyProfileProvider);
    final settings = ref.watch(companySettingsProvider);
    ref.listen(companySettingsProvider, (_, __) => _hydrate());
    _hydrate();
    final user = ref.watch(currentUserProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Configuración')),
      body: profile.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (_, __) => const Center(child: Text('No se pudo cargar el perfil')),
        data: (company) => ListView(
          padding: const EdgeInsets.all(24),
          children: [
            const Text('PERFIL DE LA EMPRESA',
                style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: VexaColors.gray400)),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: VexaColors.gray50,
                border: Border.all(color: VexaColors.gray200),
                borderRadius: BorderRadius.circular(VexaColors.radiusLg),
              ),
              child: Row(children: [
                CircleAvatar(
                  radius: 32,
                  backgroundColor: VexaColors.primary100,
                  backgroundImage: user?.avatarUrl != null ? NetworkImage(user!.avatarUrl!) : null,
                  child: user?.avatarUrl == null
                      ? const Icon(Icons.business, size: 28, color: VexaColors.primary700) : null,
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(company.name, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                      Text('ID: ${company.taxId}', style: const TextStyle(fontSize: 13, color: VexaColors.gray600)),
                    ],
                  ),
                ),
              ]),
            ),
            const SizedBox(height: 20),
            settings.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (_, __) => const Text('No se pudo cargar la configuración'),
              data: (_) => Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('CUENTA Y SEGURIDAD',
                      style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: VexaColors.gray400)),
                  const SizedBox(height: 12),
                  CompanyField(
                    label: 'Correo del administrador',
                    hint: 'despacho@empresa.com',
                    controller: _adminEmail,
                    keyboardType: TextInputType.emailAddress,
                  ),
                  const SizedBox(height: 12),
                  CompanyField(
                    label: 'Dirección corporativa',
                    hint: 'Calle 45 # 8-30, Bogotá',
                    controller: _address,
                  ),
                  const SizedBox(height: 4),
                  SwitchListTile(
                    contentPadding: EdgeInsets.zero,
                    title: const Text('Autenticación en dos pasos', style: TextStyle(fontSize: 14)),
                    value: _twoFactor,
                    onChanged: (v) => setState(() => _twoFactor = v),
                  ),
                  const SizedBox(height: 8),
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton(
                      onPressed: _saving ? null : _save,
                      child: _saving
                          ? const SizedBox(
                              width: 18, height: 18,
                              child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                          : const Text('Guardar cambios'),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            const Text('PREFERENCIAS',
                style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: VexaColors.gray400)),
            const SizedBox(height: 12),
            _PreferenceRow(label: 'Idioma', value: settings.valueOrNull?.language == 'en' ? 'English' : 'Español'),
            _PreferenceRow(label: 'Moneda', value: settings.valueOrNull?.currency ?? 'COP'),
            const SizedBox(height: 12),
            MenuItemTile(Icons.history, 'Historial de envíos',
                () => context.push(AppRoutes.companyHistory)),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: FilledButton.tonal(
                style: FilledButton.styleFrom(
                  backgroundColor: VexaColors.error100,
                  foregroundColor: VexaColors.error700,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
                onPressed: () => ref.read(authStateProvider.notifier).logout(),
                child: const Text('Cerrar sesión'),
              ),
            ),
          ],
        ),
      ),
      bottomNavigationBar: const VexaBottomNav(current: 4, items: VexaBottomNav.companyItems),
    );
  }
}

class _PreferenceRow extends StatelessWidget {
  const _PreferenceRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        border: Border.all(color: VexaColors.gray200),
        borderRadius: BorderRadius.circular(VexaColors.radiusMd),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(fontSize: 14, color: VexaColors.gray800)),
          Text(value, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: VexaColors.primary600)),
        ],
      ),
    );
  }
}
