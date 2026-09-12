import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'data/company_wallet_repository.dart';
import 'domain/wallet_models.dart';

final companyWalletProvider = FutureProvider<CompanyWallet>(
  (ref) => ref.watch(companyWalletRepositoryProvider).wallet(),
);

final companyTransactionsProvider = FutureProvider<List<WalletTransaction>>(
  (ref) => ref.watch(companyWalletRepositoryProvider).transactions(),
);

final companyInvoicesProvider = FutureProvider<List<Invoice>>(
  (ref) => ref.watch(companyWalletRepositoryProvider).invoices(),
);

final companyPaymentMethodsProvider = FutureProvider.autoDispose<List<PaymentMethod>>(
  (ref) => ref.watch(companyWalletRepositoryProvider).paymentMethods(),
);
