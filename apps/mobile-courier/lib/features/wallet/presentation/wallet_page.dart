import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/router.dart';
import '../../../core/models/paged_result.dart';
import '../../../core/theme/vexa_colors.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/widgets/date_range_filter_bar.dart';
import '../../../core/widgets/pagination_bar.dart';
import '../../../core/widgets/vexa_bottom_nav.dart';
import '../domain/wallet_models.dart';
import '../providers.dart';

/// Figma: company-wallet — transacciones con filtro de rango de fecha y
/// paginador, ambos aplicados por el backend.
class WalletPage extends ConsumerWidget {
  const WalletPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final wallet = ref.watch(companyWalletProvider);
    final filter = ref.watch(companyTransactionsFilterProvider);
    final txs = ref.watch(companyTransactionsProvider(filter));
    final money = AppFormatters.money;

    void updateFilter(PageDateFilter next) =>
        ref.read(companyTransactionsFilterProvider.notifier).state = next;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Billetera Vexa'),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_none),
            onPressed: () => context.push(AppRoutes.companyNotifications),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(companyWalletProvider);
          ref.invalidate(companyTransactionsProvider);
        },
        child: ListView(
          padding: const EdgeInsets.all(24),
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [VexaColors.primary600, VexaColors.secondary500],
                  begin: Alignment.topLeft, end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(VexaColors.radiusLg),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('SALDO ACTUAL',
                      style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Colors.white70, letterSpacing: 0.5)),
                  const SizedBox(height: 6),
                  Text(money(wallet.valueOrNull?.balance ?? 0),
                      style: const TextStyle(fontSize: 34, fontWeight: FontWeight.w800, color: Colors.white)),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton(
                      style: OutlinedButton.styleFrom(
                        backgroundColor: Colors.white,
                        foregroundColor: VexaColors.primary600,
                        side: BorderSide.none,
                      ),
                      onPressed: () => ScaffoldMessenger.of(context)
                          .showSnackBar(const SnackBar(content: Text('Recarga de saldo próximamente'))),
                      child: const Text('+ Añadir fondos', style: TextStyle(fontWeight: FontWeight.w700)),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            Row(children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: () => ScaffoldMessenger.of(context)
                      .showSnackBar(const SnackBar(content: Text('Retiro próximamente'))),
                  child: const Text('Retirar'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: OutlinedButton(
                  onPressed: () => context.push(AppRoutes.companyPaymentMethods),
                  child: const Text('Métodos de pago'),
                ),
              ),
            ]),
            const SizedBox(height: 24),
            const Text('TRANSACCIONES',
                style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: VexaColors.gray800)),
            const SizedBox(height: 8),
            DateRangeFilterBar(
              filter: filter,
              onChanged: updateFilter,
              padding: const EdgeInsets.symmetric(vertical: 4),
            ),
            const SizedBox(height: 8),
            txs.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (_, __) => const Text('No se pudieron cargar los movimientos'),
              data: (page) => page.items.isEmpty
                  ? Text(
                      filter.hasDateRange ? 'Sin movimientos en este rango.' : 'Sin movimientos aún',
                      style: const TextStyle(color: VexaColors.gray500),
                    )
                  : Column(
                      children: [
                        for (final tx in page.items) _TxRow(tx: tx, money: money),
                        PaginationBar(result: page, onPageChanged: (p) => updateFilter(filter.copyWith(page: p))),
                      ],
                    ),
            ),
          ],
        ),
      ),
      bottomNavigationBar: const VexaBottomNav(current: 3, items: VexaBottomNav.companyItems),
    );
  }
}

class _TxRow extends StatelessWidget {
  const _TxRow({required this.tx, required this.money});

  final WalletTransaction tx;
  final String Function(num) money;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: VexaColors.gray50,
        border: Border.all(color: VexaColors.gray200),
        borderRadius: BorderRadius.circular(VexaColors.radiusLg),
      ),
      child: Row(children: [
        Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: tx.isCredit ? VexaColors.success100 : VexaColors.error100,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(tx.isCredit ? Icons.south_west : Icons.north_east,
              size: 18, color: tx.isCredit ? VexaColors.success700 : VexaColors.error700),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(tx.title, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
              Text('${AppFormatters.shortDate(tx.at)} • TX-${tx.id.substring(0, tx.id.length.clamp(0, 6)).toUpperCase()}',
                  style: const TextStyle(fontSize: 12, color: VexaColors.gray400)),
            ],
          ),
        ),
        Text('${tx.isCredit ? '+' : '-'}${money(tx.amount.abs())}',
            style: TextStyle(
                fontSize: 15, fontWeight: FontWeight.w700,
                color: tx.isCredit ? VexaColors.success700 : VexaColors.error500)),
      ]),
    );
  }
}
