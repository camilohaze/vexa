import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../app/router.dart';
import '../../../core/theme/vexa_colors.dart';

/// Figma: select-role. En la app de repartidores, COURIER está
/// preseleccionado; COMPANY informa que debe usar el portal web.
class RoleSelectPage extends StatefulWidget {
  const RoleSelectPage({super.key});

  @override
  State<RoleSelectPage> createState() => _RoleSelectPageState();
}

class _RoleSelectPageState extends State<RoleSelectPage> {
  String _role = 'COURIER';

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Spacer(flex: 2),
              Text('Elige tu rol',
                  style: theme.textTheme.headlineSmall
                      ?.copyWith(fontWeight: FontWeight.w700)),
              const SizedBox(height: 6),
              Text('¿Cómo planeas usar Vexa?',
                  style: theme.textTheme.bodyMedium
                      ?.copyWith(color: VexaColors.gray500)),
              const SizedBox(height: 32),
              _RoleCard(
                icon: Icons.business,
                title: 'Soy una empresa',
                subtitle: 'Publica pedidos de entrega y haz seguimiento',
                selected: _role == 'COMPANY',
                onTap: () => setState(() => _role = 'COMPANY'),
              ),
              const SizedBox(height: 12),
              _RoleCard(
                icon: Icons.local_shipping_outlined,
                title: 'Soy repartidor',
                subtitle: 'Acepta entregas y gana dinero',
                selected: _role == 'COURIER',
                onTap: () => setState(() => _role = 'COURIER'),
              ),
              const Spacer(flex: 3),
              FilledButton(
                onPressed: () =>
                    context.push(AppRoutes.register, extra: _role),
                child: const Text('Continuar'),
              ),
              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }
}

class _RoleCard extends StatelessWidget {
  const _RoleCard({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.selected,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: selected ? VexaColors.primary50 : Colors.white,
      borderRadius: BorderRadius.circular(VexaColors.radiusLg),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(VexaColors.radiusLg),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 150),
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
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: VexaColors.primary100,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, color: VexaColors.primary700),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title,
                        style: const TextStyle(
                            fontSize: 15, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 2),
                    Text(subtitle,
                        style: const TextStyle(
                            fontSize: 12, color: VexaColors.gray500)),
                  ],
                ),
              ),
              Icon(
                selected ? Icons.radio_button_checked : Icons.radio_button_off,
                color: selected ? VexaColors.primary600 : VexaColors.gray300,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
