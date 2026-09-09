import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../app/router.dart';
import '../theme/vexa_colors.dart';

/// Tab bar del módulo repartidor (Figma: Home / Jobs / Earnings / Profile).
class VexaBottomNav extends StatelessWidget {
  const VexaBottomNav({super.key, required this.current});

  final int current;

  static const _items = [
    (icon: Icons.home_outlined, active: Icons.home, label: 'Inicio', route: AppRoutes.home),
    (icon: Icons.work_outline, active: Icons.work, label: 'Pedidos', route: AppRoutes.jobBoard),
    (icon: Icons.account_balance_wallet_outlined, active: Icons.account_balance_wallet, label: 'Ganancias', route: AppRoutes.earnings),
    (icon: Icons.person_outline, active: Icons.person, label: 'Perfil', route: AppRoutes.profile),
  ];

  @override
  Widget build(BuildContext context) {
    return NavigationBar(
      selectedIndex: current,
      onDestinationSelected: (i) {
        if (i != current) context.go(_items[i].route);
      },
      destinations: [
        for (final item in _items)
          NavigationDestination(
            icon: Icon(item.icon),
            selectedIcon: Icon(item.active, color: VexaColors.primary600),
            label: item.label,
          ),
      ],
    );
  }
}
