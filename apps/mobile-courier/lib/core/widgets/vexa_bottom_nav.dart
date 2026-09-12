import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../app/router.dart';
import '../theme/vexa_colors.dart';

typedef NavItem = ({IconData icon, IconData active, String label, String route});

/// Tab bar reutilizable entre roles: cada uno pasa su propia lista de items.
class VexaBottomNav extends StatelessWidget {
  const VexaBottomNav({super.key, required this.current, required this.items});

  final int current;
  final List<NavItem> items;

  static const courierItems = <NavItem>[
    (icon: Icons.home_outlined, active: Icons.home, label: 'Inicio', route: AppRoutes.courierHome),
    (icon: Icons.work_outline, active: Icons.work, label: 'Pedidos', route: AppRoutes.courierJobBoard),
    (icon: Icons.account_balance_wallet_outlined, active: Icons.account_balance_wallet, label: 'Ganancias', route: AppRoutes.courierEarnings),
    (icon: Icons.person_outline, active: Icons.person, label: 'Perfil', route: AppRoutes.courierProfile),
  ];

  static const companyItems = <NavItem>[
    (icon: Icons.home_outlined, active: Icons.home, label: 'Inicio', route: AppRoutes.companyHome),
    (icon: Icons.inventory_2_outlined, active: Icons.inventory_2, label: 'Envíos', route: AppRoutes.companyJobs),
    (icon: Icons.near_me_outlined, active: Icons.near_me, label: 'Rastrear', route: AppRoutes.companyTrack),
    (icon: Icons.account_balance_wallet_outlined, active: Icons.account_balance_wallet, label: 'Billetera', route: AppRoutes.companyWallet),
    (icon: Icons.person_outline, active: Icons.person, label: 'Perfil', route: AppRoutes.companySettings),
  ];

  @override
  Widget build(BuildContext context) {
    return NavigationBar(
      selectedIndex: current,
      onDestinationSelected: (i) {
        if (i != current) context.go(items[i].route);
      },
      destinations: [
        for (final item in items)
          NavigationDestination(
            icon: Icon(item.icon),
            selectedIcon: Icon(item.active, color: VexaColors.primary600),
            label: item.label,
          ),
      ],
    );
  }
}
