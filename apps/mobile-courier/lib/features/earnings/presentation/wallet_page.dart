import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/router.dart';
import '../../../core/models/paged_result.dart';
import '../../../core/theme/vexa_colors.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/widgets/date_range_filter_bar.dart';
import '../../../core/widgets/pagination_bar.dart';
import '../providers.dart';

/// Figma: courier-wallet — tarjeta azul de saldo, tabs y transacciones,
/// cada una con su propio filtro de fecha y paginador.
class WalletPage extends ConsumerStatefulWidget {
  const WalletPage({super.key});

  @override
  ConsumerState<WalletPage> createState() => _WalletPageState();
}

class _WalletPageState extends ConsumerState<WalletPage> {
  int _tab = 0;

  @override
  Widget build(BuildContext context) {
    final summary = ref.watch(earningsSummaryProvider).valueOrNull ??
        const EarningsSummary(
          total: 0, tips: 0, bonuses: 0, available: 0, pending: 0,
          today: 0, completed: 0,
          dailyBars: [0, 0, 0, 0, 0, 0, 0], breakdown: [],
        );
    final filter = ref.watch(walletFilterProvider(_tab));
    final result = switch (_tab) {
      1 => ref.watch(payoutsProvider(filter)),
      2 => ref.watch(bonusesProvider(filter)),
      _ => ref.watch(walletTransactionsProvider(filter)),
    };
    final page = result.valueOrNull ?? PagedResult<WalletTransaction>.empty();
    final theme = Theme.of(context);
    final money = AppFormatters.money;

    void updateFilter(PageDateFilter next) =>
        ref.read(walletFilterProvider(_tab).notifier).state = next;

    return Scaffold(
      appBar: AppBar(title: const Text('Billetera')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
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
            selected: {_tab},
            onSelectionChanged: (s) => setState(() => _tab = s.first),
            showSelectedIcon: false,
          ),
          const SizedBox(height: 12),
          DateRangeFilterBar(filter: filter, onChanged: updateFilter),
          const SizedBox(height: 4),
          Text('Transacciones',
              style: theme.textTheme.titleSmall
                  ?.copyWith(fontWeight: FontWeight.w700)),
          const SizedBox(height: 8),
          if (page.items.isEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 24),
              child: Center(
                child: Text(
                  _tab == 2 && !filter.hasDateRange
                      ? 'Aún no tienes bonos. Vexa los mostrará aquí cuando se activen.'
                      : 'Sin movimientos en este rango.',
                  textAlign: TextAlign.center,
                  style: const TextStyle(fontSize: 13, color: VexaColors.gray500),
                ),
              ),
            ),
          for (final tx in page.items)
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
          PaginationBar(result: page, onPageChanged: (p) => updateFilter(filter.copyWith(page: p))),
        ],
      ),
    );
  }
}
