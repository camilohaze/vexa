import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/router.dart';
import '../../../core/theme/vexa_colors.dart';
import '../../../core/widgets/menu_item_tile.dart';
import '../../../core/widgets/vexa_bottom_nav.dart';
import '../../auth/providers.dart';
import '../../tracking/providers.dart';

/// Figma: courier-profile — avatar, contacto, vehículo activo,
/// estado de documentos y accesos del menú.
class ProfilePage extends ConsumerWidget {
  const ProfilePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(currentUserProvider);
    final tracking = ref.watch(trackingControllerProvider);
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(title: const Text('Perfil')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Column(
            children: [
              CircleAvatar(
                radius: 36,
                backgroundColor: VexaColors.primary100,
                backgroundImage: user?.avatarUrl != null
                    ? NetworkImage(user!.avatarUrl!)
                    : null,
                child: user?.avatarUrl == null
                    ? const Icon(Icons.person,
                        size: 36, color: VexaColors.primary700)
                    : null,
              ),
              const SizedBox(height: 10),
              Text(user?.fullName ?? 'Repartidor',
                  style: theme.textTheme.titleLarge
                      ?.copyWith(fontWeight: FontWeight.w700)),
              Text('Vexa Express Partner · ID #${user?.trackingId.substring(0, 6).toUpperCase() ?? '—'}',
                  style: const TextStyle(
                      fontSize: 12, color: VexaColors.gray500)),
            ],
          ),
          const SizedBox(height: 20),

          _Section('Información de contacto'),
          Card(
            margin: EdgeInsets.zero,
            child: Column(
              children: [
                _InfoRow(Icons.phone_outlined, 'Teléfono', '+57 300 555 0192'),
                _InfoRow(Icons.mail_outline, 'Correo', user?.email ?? '—'),
                _InfoRow(Icons.translate, 'Idiomas', 'Español, Inglés'),
              ],
            ),
          ),
          const SizedBox(height: 20),

          _Section('Vehículo activo'),
          Card(
            margin: EdgeInsets.zero,
            child: ListTile(
              leading: const CircleAvatar(
                backgroundColor: VexaColors.primary100,
                child: Icon(Icons.local_shipping_outlined,
                    color: VexaColors.primary700),
              ),
              title: const Text('Ford Transit Van (2022)',
                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
              subtitle: const Text('Placa BWYF-42 · Blanco',
                  style: TextStyle(fontSize: 12)),
              trailing: TextButton(
                onPressed: () =>
                    context.push(AppRoutes.courierVehicleRegistration),
                child: const Text('Gestionar'),
              ),
            ),
          ),
          const SizedBox(height: 20),

          _Section('Estado de documentos'),
          Card(
            margin: EdgeInsets.zero,
            child: const Column(
              children: [
                _DocRow('Licencia de conducir', 'Verificado', 'Vence Oct 2028', true),
                _DocRow('Seguro comercial', 'Verificado', 'Vence Mar 2026', true),
                _DocRow('Permiso del vehículo', 'Pendiente', 'Sube el documento', false),
              ],
            ),
          ),
          const SizedBox(height: 12),
          OutlinedButton.icon(
            onPressed: () => context.push(AppRoutes.courierVerification),
            icon: const Icon(Icons.verified_user_outlined),
            label: const Text('Centro de verificación'),
          ),
          const SizedBox(height: 20),

          _Section('Ajustes'),
          SwitchListTile(
            contentPadding: EdgeInsets.zero,
            secondary: const Icon(Icons.my_location),
            title: const Text('Compartir ubicación'),
            subtitle: switch (tracking) {
              TrackingActive() => const Text('Seguimiento activo'),
              TrackingBlocked(:final message) => Text(message),
              _ => const Text('Inactivo'),
            },
            value: tracking is TrackingActive,
            onChanged: (value) async {
              final notifier = ref.read(trackingControllerProvider.notifier);
              if (value) {
                await notifier.start();
              } else {
                await notifier.stop();
              }
            },
          ),
          MenuItemTile(Icons.history, 'Historial de entregas',
              () => context.push(AppRoutes.courierHistory)),
          MenuItemTile(Icons.notifications_outlined, 'Notificaciones',
              () => context.push(AppRoutes.courierNotificationSettings)),
          MenuItemTile(Icons.emoji_events_outlined, 'Recompensas',
              () => context.push(AppRoutes.courierRewards)),
          MenuItemTile(Icons.card_giftcard, 'Invita y gana',
              () => context.push(AppRoutes.courierRefer)),
          MenuItemTile(Icons.help_outline, 'Centro de ayuda',
              () => context.push(AppRoutes.courierHelp)),
          MenuItemTile(Icons.quiz_outlined, 'Preguntas frecuentes',
              () => context.push(AppRoutes.courierFaq)),
          MenuItemTile(Icons.gavel_outlined, 'Términos y condiciones',
              () => context.push(AppRoutes.terms)),
          MenuItemTile(Icons.privacy_tip_outlined, 'Política de privacidad',
              () => context.push(AppRoutes.privacy)),
          const Divider(height: 32),
          OutlinedButton.icon(
            onPressed: () => ref.read(authStateProvider.notifier).logout(),
            icon: const Icon(Icons.logout),
            label: const Text('Cerrar sesión'),
          ),
          const SizedBox(height: 16),
        ],
      ),
      bottomNavigationBar: const VexaBottomNav(current: 3, items: VexaBottomNav.courierItems),
    );
  }
}

class _Section extends StatelessWidget {
  const _Section(this.text);
  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Text(text.toUpperCase(),
          style: const TextStyle(
              fontSize: 10, letterSpacing: 0.6,
              color: VexaColors.gray500, fontWeight: FontWeight.w600)),
    );
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow(this.icon, this.label, this.value);

  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      dense: true,
      leading: Icon(icon, size: 20, color: VexaColors.gray500),
      title: Text(label,
          style: const TextStyle(fontSize: 12, color: VexaColors.gray500)),
      subtitle: Text(value,
          style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
    );
  }
}

class _DocRow extends StatelessWidget {
  const _DocRow(this.title, this.status, this.sub, this.verified);

  final String title;
  final String status;
  final String sub;
  final bool verified;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      dense: true,
      title: Text(title,
          style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
      subtitle: Text(sub,
          style: const TextStyle(fontSize: 11, color: VexaColors.gray500)),
      trailing: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
        decoration: BoxDecoration(
          color: verified ? VexaColors.success100 : VexaColors.warning100,
          borderRadius: BorderRadius.circular(999),
        ),
        child: Text(status,
            style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: verified
                    ? VexaColors.success700
                    : VexaColors.warning700)),
      ),
    );
  }
}
