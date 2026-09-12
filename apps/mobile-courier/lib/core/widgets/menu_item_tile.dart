import 'package:flutter/material.dart';

import '../theme/vexa_colors.dart';

/// Fila de menú genérica (icono + label + chevron), usada en las pantallas
/// de "Perfil"/"Configuración" de ambos roles.
class MenuItemTile extends StatelessWidget {
  const MenuItemTile(this.icon, this.label, this.onTap, {super.key});

  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      contentPadding: EdgeInsets.zero,
      leading: Icon(icon),
      title: Text(label),
      trailing: const Icon(Icons.chevron_right, color: VexaColors.gray400),
      onTap: onTap,
    );
  }
}
