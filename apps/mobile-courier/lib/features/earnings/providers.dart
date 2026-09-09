import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../profile/data/courier_repository.dart';

/// Datos financieros del repartidor (GET /couriers/me/earnings y
/// /couriers/me/transactions). Con fallback a ceros si el backend aún
/// no tiene datos.
class WalletTransaction {
  const WalletTransaction({
    required this.title,
    required this.subtitle,
    required this.amount,
    required this.status,
  });

  final String title;
  final String subtitle;
  final double amount;
  final String status;

  bool get isCredit => amount >= 0;
}

class EarningsSummary {
  const EarningsSummary({
    required this.total,
    required this.tips,
    required this.bonuses,
    required this.available,
    required this.pending,
    required this.dailyBars,
    required this.breakdown,
    required this.today,
    required this.completed,
  });

  final double total;
  final double tips;
  final double bonuses;
  final double available;
  final double pending;
  final double today;
  final int completed;

  /// Ingresos por día (Lun–Dom), normalizados 0..1.
  final List<double> dailyBars;
  final List<(String, double, int)> breakdown;
}

final earningsSummaryProvider = FutureProvider<EarningsSummary>((ref) async {
  try {
    final data =
        await ref.watch(courierRepositoryProvider).fetchEarnings();
    final week = (data['week'] as num?)?.toDouble() ?? 0;
    final rawBars = (data['dailyBars'] as List?)?.whereType<num>().toList();
    final dailyBars = rawBars?.map((n) => n.toDouble()).toList() ??
        const [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0];
    final rawBreakdown = (data['breakdown'] as List?)?.cast<List>() ?? [];
    final breakdown = rawBreakdown
        .whereType<List<dynamic>>()
        .map((b) => (b[0] as String? ?? '', (b[1] as num?)?.toDouble() ?? 0, (b[2] as num?)?.toInt() ?? 0))
        .toList();
    return EarningsSummary(
      total: week,
      tips: 0,
      bonuses: 0,
      available: (data['month'] as num?)?.toDouble() ?? week,
      pending: 0,
      today: (data['today'] as num?)?.toDouble() ?? 0,
      completed: (data['completed'] as num?)?.toInt() ?? 0,
      dailyBars: dailyBars,
      breakdown: breakdown,
    );
  } catch (_) {
    return const EarningsSummary(
      total: 0,
      tips: 0,
      bonuses: 0,
      available: 0,
      pending: 0,
      today: 0,
      completed: 0,
      dailyBars: [0, 0, 0, 0, 0, 0, 0],
      breakdown: [],
    );
  }
});

final walletTransactionsProvider =
    FutureProvider<List<WalletTransaction>>((ref) async {
  try {
    final items =
        await ref.watch(courierRepositoryProvider).fetchTransactions();
    return items
        .map(
          (tx) => WalletTransaction(
            title: tx['title'] as String? ?? 'Movimiento',
            subtitle: tx['at'] as String? ?? '',
            amount: (tx['amount'] as num?)?.toDouble() ?? 0,
            status: tx['status'] as String? ?? '',
          ),
        )
        .toList();
  } catch (_) {
    return const [];
  }
});
