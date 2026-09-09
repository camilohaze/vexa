import 'package:flutter/material.dart';

import '../../../core/theme/vexa_colors.dart';
import 'widgets/vexa_logo.dart';

/// Pantalla de arranque: logo centrado + tagline, como en el Figma.
class SplashPage extends StatelessWidget {
  const SplashPage({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              VexaLogo(size: 48),
              SizedBox(height: 16),
              Text(
                'Logística, simplificada',
                style: TextStyle(fontSize: 14, color: VexaColors.gray500),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
