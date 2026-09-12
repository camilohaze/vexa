import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../../app/router.dart';
import '../../../core/theme/vexa_colors.dart';
import '../providers.dart';

/// Figma: courier-wallet — tarjeta azul de saldo, tabs y transacciones.
class WalletPage extends ConsumerWidget {
  const WalletPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final summary = ref.watch(earningsSummaryProvider).valueOrNull ??
        const EarningsSummary(
          total: 0, tips: 0, bonuses: 0, available: 0, pending: 0,
          today: 0, completed: 0,
          dailyBars: [0, 0, 0, 0, 0, 0, 0], breakdown: [],
        );
    final txs = ref.watch(walletTransactionsProvider).valueOrNull ?? const <WalletTransaction>[];
    final theme = Theme.of(context);
    final money = NumberFormat.currency(
        locale: 'es_CO', symbol: r'$', decimalDigits: 2).format;

    return Scaffold(
      appBar: AppBar(title: const Text('Billetera')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [VexaColors.primary600, VexaColors.primary800],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(VexaColors.radiusLg),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('SALDO DE BILLETERA',
                        style: TextStyle(
                            fontSize: 10, letterSpacing: 0.8,
                            color: Colors.white70, fontWeight: FontWeight.w600)),
                    OutlinedButton(
                      onPressed: () => context.push(AppRoutes.courierWithdraw),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Colors.white,
                        side: const BorderSide(color: Colors.white54),
                        minimumSize: const Size(0, 32),
                        padding:
                            const EdgeInsets.symmetric(horizontal: 12),
                      ),
                      child: const Text('Retirar',
                          style: TextStyle(fontSize: 12)),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(money(summary.total),
                    style: theme.textTheme.displaySmall?.copyWith(
                        color: Colors.white, fontWeight: FontWeight.w700)),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: Text(
                          'Pendiente\n${money(summary.pending)}',
                          style: const TextStyle(
                              fontSize: 12, color: Colors.white70)),
                    ),
                    Expanded(
                      child: Text(
                          'Disponible\n${money(summary.available)}',
                          style: const TextStyle(
                              fontSize: 12, color: Colors.white)),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          SegmentedButton<int>(
            segments: const [
              ButtonSegment(value: 0, label: Text('Ganancias')),
              ButtonSegment(value: 1, label: Text('Retiros')),
              ButtonSegment(value: 2, label: Text('Bonos')),
            ],
            selected: const {0},
            onSelectionChanged: (_) {},
            showSelectedIcon: false,
          ),
          const SizedBox(height: 16),
          Text('Transacciones recientes',
              style: theme.textTheme.titleSmall
                  ?.copyWith(fontWeight: FontWeight.w700)),
          const SizedBox(height: 8),
          for (final tx in txs)
            Card(
              margin: const EdgeInsets.only(bottom: 8),
              child: ListTile(
                leading: CircleAvatar(
                  backgroundColor: tx.isCredit
                      ? VexaColors.success100
                      : VexaColors.error100,
                  child: Icon(
                    tx.isCredit ? Icons.south_west : Icons.north_east,
                    size: 16,
                    color: tx.isCredit
                        ? VexaColors.success700
                        : VexaColors.error700,
                  ),
                ),
                title: Text(tx.title,
                    style: const TextStyle(
                        fontSize: 13, fontWeight: FontWeight.w600)),
                subtitle: Text(tx.subtitle,
                    style: const TextStyle(
                        fontSize: 11, color: VexaColors.gray500)),
                trailing: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      '${tx.isCredit ? '+' : '-'}${money(tx.amount.abs())}',
                      style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                          color: tx.isCredit
                              ? VexaColors.success700
                              : VexaColors.gray900),
                    ),
                    Text(tx.status,
                        style: const TextStyle(
                            fontSize: 10, color: VexaColors.gray400)),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
}
