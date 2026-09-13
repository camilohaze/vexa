import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/models/paged_result.dart';
import 'data/company_wallet_repository.dart';
import 'domain/wallet_models.dart';

final companyWalletProvider = FutureProvider<CompanyWallet>(
  (ref) => ref.watch(companyWalletRepositoryProvider).wallet(),
);

final companyTransactionsFilterProvider =
    StateProvider.autoDispose<PageDateFilter>((ref) => const PageDateFilter());

final companyTransactionsProvider =
    FutureProvider.autoDispose.family<PagedResult<WalletTransaction>, PageDateFilter>(
  (ref, filter) => ref.watch(companyWalletRepositoryProvider).transactions(filter),
);

final companyInvoicesFilterProvider =
    StateProvider.autoDispose<PageDateFilter>((ref) => const PageDateFilter());

final companyInvoicesProvider = FutureProvider.autoDispose.family<PagedResult<Invoice>, PageDateFilter>(
  (ref, filter) => ref.watch(companyWalletRepositoryProvider).invoices(filter),
);

final companyPaymentMethodsProvider = FutureProvider.autoDispose<List<PaymentMethod>>(
  (ref) => ref.watch(companyWalletRepositoryProvider).paymentMethods(),
);
