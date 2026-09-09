import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../app/router.dart';
import '../../../core/theme/vexa_colors.dart';

/// Pantalla de bienvenida (Figma: welcome-screen).
class WelcomePage extends StatelessWidget {
  const WelcomePage({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Column(
            children: [
              const Spacer(flex: 2),
              // Ilustración: círculo azul con camión + trazo de ruta
              Container(
                width: 220,
                height: 220,
                decoration: const BoxDecoration(
                  color: VexaColors.primary50,
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.local_shipping_outlined,
                  size: 88,
                  color: VexaColors.primary600,
                ),
              ),
              const SizedBox(height: 16),
              const _RouteTrace(),
              const Spacer(),
              Text(
                'Conecta. Envía.\nEntrega.',
                textAlign: TextAlign.center,
                style: theme.textTheme.displaySmall?.copyWith(
                  fontWeight: FontWeight.w700,
                  color: VexaColors.gray900,
                  height: 1.15,
                ),
              ),
              const SizedBox(height: 16),
              Text(
                'Únete a Vexa para despachar envíos al instante o acepta rutas y gana como repartidor independiente.',
                textAlign: TextAlign.center,
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: VexaColors.gray500,
                  height: 1.5,
                ),
              ),
              const Spacer(flex: 2),
              FilledButton(
                onPressed: () => context.push(AppRoutes.roleSelect),
                child: const Text('Comenzar'),
              ),
              const SizedBox(height: 12),
              TextButton(
                onPressed: () => context.push(AppRoutes.login),
                child: const Text('Ya tengo una cuenta'),
              ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }
}

/// Trazo de ruta: segmento — punto — segmento — check.
class _RouteTrace extends StatelessWidget {
  const _RouteTrace();

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 144,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          _segment(32),
          const SizedBox(width: 8),
          const Icon(Icons.circle, size: 12, color: VexaColors.primary600),
          const SizedBox(width: 8),
          _segment(48),
          const SizedBox(width: 8),
          const Icon(Icons.check_circle, size: 16, color: VexaColors.success500),
        ],
      ),
    );
  }

  Widget _segment(double width) => Container(
        width: width,
        height: 4,
        decoration: BoxDecoration(
          color: VexaColors.primary200,
          borderRadius: BorderRadius.circular(2),
        ),
      );
}
