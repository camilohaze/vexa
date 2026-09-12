import 'package:flutter/material.dart';

import '../../../../core/theme/vexa_colors.dart';

/// Barra de progreso del flujo "Nuevo envío" (Figma solo la muestra en los
/// primeros 2 de los 6 pasos; el resto no la incluye).
class StepProgress extends StatelessWidget {
  const StepProgress({super.key, required this.step, this.totalSteps = 4});

  final int step;
  final int totalSteps;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
      child: Row(
        children: [
          for (var i = 0; i < totalSteps; i++)
            Expanded(
              child: Container(
                margin: EdgeInsets.only(right: i == totalSteps - 1 ? 0 : 8),
                height: 4,
                decoration: BoxDecoration(
                  color: i < step ? VexaColors.primary600 : VexaColors.gray100,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
