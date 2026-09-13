import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../core/models/paged_result.dart';
import '../../core/utils/json_parse.dart';
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
    this.month = 0,
    this.rating = 0,
  });

  final double total;
  final double tips;
  final double bonuses;
  final double available;
  final double pending;
  final double today;
  final double month;
  final int completed;
  final double rating;

  /// Ingresos por día (Lun–Dom), normalizados 0..1.
  final List<double> dailyBars;
  final List<(String, double, int)> breakdown;
}

final earningsSummaryProvider = FutureProvider<EarningsSummary>((ref) async {
  try {
    final data =
        await ref.watch(courierRepositoryProvider).fetchEarnings();
    final week = (data['week'] as num?)?.toDouble() ?? 0;
    final month = (data['month'] as num?)?.toDouble() ?? week;
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
      available: month,
      pending: 0,
      today: (data['today'] as num?)?.toDouble() ?? 0,
      month: month,
      completed: (data['completed'] as num?)?.toInt() ?? 0,
      rating: (data['rating'] as num?)?.toDouble() ?? 0,
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

String _formatDate(String? iso) {
  final date = iso == null ? null : DateTime.tryParse(iso);
  return date == null ? '' : DateFormat('d MMM, HH:mm', 'es').format(date);
}

const _payoutMethodLabels = {
  'bank_transfer': 'Transferencia bancaria',
  'paypal': 'PayPal',
  'nequi': 'Nequi / Billetera móvil',
};

const _payoutStatusLabels = {
  'PENDING': 'Pendiente',
  'PROCESSING': 'Procesando',
  'COMPLETED': 'Completado',
  'FAILED': 'Fallido',
};

const _bonusTypeLabels = {
  'LEVEL_MULTIPLIER': 'Bono de nivel',
  'WEEKLY_QUEST': 'Meta semanal',
};

/// Estado de filtro (rango de fecha + página) por pestaña de la billetera.
final walletFilterProvider = StateProvider.autoDispose.family<PageDateFilter, int>(
  (ref, tab) => const PageDateFilter(),
);

final walletTransactionsProvider =
    FutureProvider.autoDispose.family<PagedResult<WalletTransaction>, PageDateFilter>((ref, filter) async {
  try {
    final data = await ref.watch(courierRepositoryProvider).fetchTransactions(filter);
    return PagedResult.fromJson(
      data,
      (tx) => WalletTransaction(
        title: tx['title'] as String? ?? 'Movimiento',
        subtitle: _formatDate(tx['at'] as String?),
        amount: asDouble(tx['amount']),
        status: tx['status'] as String? ?? '',
      ),
    );
  } catch (_) {
    return PagedResult.empty();
  }
});

final bonusesProvider =
    FutureProvider.autoDispose.family<PagedResult<WalletTransaction>, PageDateFilter>((ref, filter) async {
  try {
    final data = await ref.watch(courierRepositoryProvider).fetchBonuses(filter);
    return PagedResult.fromJson(
      data,
      (b) => WalletTransaction(
        title: b['description'] as String? ?? 'Bono',
        subtitle: _formatDate(b['createdAt'] as String?),
        amount: asDouble(b['amount']),
        status: _bonusTypeLabels[b['type']] ?? 'Acreditado',
      ),
    );
  } catch (_) {
    return PagedResult.empty();
  }
});

final payoutsProvider =
    FutureProvider.autoDispose.family<PagedResult<WalletTransaction>, PageDateFilter>((ref, filter) async {
  try {
    final data = await ref.watch(courierRepositoryProvider).fetchPayouts(filter);
    return PagedResult.fromJson(
      data,
      (p) => WalletTransaction(
        title: _payoutMethodLabels[p['method']] ?? p['method'] as String? ?? 'Retiro',
        subtitle: _formatDate(p['createdAt'] as String?),
        amount: -asDouble(p['amount']),
        status: _payoutStatusLabels[p['status']] ?? p['status'] as String? ?? '',
      ),
    );
  } catch (_) {
    return PagedResult.empty();
  }
});

/// Última transacción para el resumen del dashboard (siempre la página 1,
/// sin filtro de fecha).
final lastTransactionProvider = Provider.autoDispose<WalletTransaction?>((ref) {
  final result = ref.watch(walletTransactionsProvider(const PageDateFilter(pageSize: 1))).valueOrNull;
  return result?.items.firstOrNull;
});
