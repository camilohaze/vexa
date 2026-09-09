import 'package:flutter/material.dart';

import '../../../../core/theme/vexa_colors.dart';

/// Logo de marca: camión dentro de cuadrado azul redondeado + wordmark.
class VexaLogo extends StatelessWidget {
  const VexaLogo({super.key, this.size = 48, this.showWordmark = true});

  final double size;
  final bool showWordmark;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: size,
          height: size,
          decoration: BoxDecoration(
            color: VexaColors.primary600,
            borderRadius: BorderRadius.circular(size * 0.28),
          ),
          child: Icon(
            Icons.local_shipping_outlined,
            color: Colors.white,
            size: size * 0.55,
          ),
        ),
        if (showWordmark) ...[
          const SizedBox(width: 10),
          Text(
            'Vexa',
            style: TextStyle(
              fontSize: size * 0.72,
              fontWeight: FontWeight.w800,
              color: VexaColors.gray900,
              letterSpacing: -0.5,
              height: 1,
            ),
          ),
        ],
      ],
    );
  }
}
