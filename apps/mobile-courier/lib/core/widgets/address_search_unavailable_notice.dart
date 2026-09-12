import 'package:flutter/material.dart';

import '../theme/vexa_colors.dart';

/// Aviso mostrado en los pasos de recogida/destino cuando la búsqueda de
/// direcciones no está disponible (falta configurar el proveedor de mapas
/// en este ambiente). Redactado para el usuario final, sin jerga técnica.
class AddressSearchUnavailableNotice extends StatelessWidget {
  const AddressSearchUnavailableNotice({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 12, 16, 0),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: VexaColors.warning50,
        border: Border.all(color: VexaColors.warning300),
        borderRadius: BorderRadius.circular(VexaColors.radiusMd),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.info_outline, size: 18, color: VexaColors.warning700),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              'La búsqueda de direcciones no está disponible en este momento. '
              'Intenta de nuevo en unos minutos o contacta a soporte si necesitas '
              'publicar tu envío ahora.',
              style: TextStyle(fontSize: 12, color: VexaColors.warning900, height: 1.3),
            ),
          ),
        ],
      ),
    );
  }
}
