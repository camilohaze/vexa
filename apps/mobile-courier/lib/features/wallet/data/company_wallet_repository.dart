import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/models/paged_result.dart';
import '../../../core/network/api_client.dart';
import '../domain/wallet_models.dart';

class CompanyWalletRepository {
  CompanyWalletRepository({required ApiClient api}) : _api = api;

  final ApiClient _api;

  Future<CompanyWallet> wallet() async {
    final response = await _api.dio.get<Map<String, dynamic>>('/companies/me/wallet');
    return CompanyWallet.fromJson(response.data ?? const {});
  }

  Future<PagedResult<WalletTransaction>> transactions(PageDateFilter filter) async {
    final response = await _api.dio.get<Map<String, dynamic>>(
      '/companies/me/transactions',
      queryParameters: filter.toQueryParams(),
    );
    return PagedResult.fromJson(response.data ?? const {}, WalletTransaction.fromJson);
  }

  Future<PagedResult<Invoice>> invoices(PageDateFilter filter) async {
    final response = await _api.dio.get<Map<String, dynamic>>(
      '/companies/me/invoices',
      queryParameters: filter.toQueryParams(),
    );
    return PagedResult.fromJson(response.data ?? const {}, Invoice.fromJson);
  }

  Future<List<PaymentMethod>> paymentMethods() async {
    final response = await _api.dio.get<dynamic>('/companies/me/payment-methods');
    return _list(response.data).map(PaymentMethod.fromJson).toList();
  }

  Future<PaymentMethod> addPaymentMethod({
    required String methodType,
    required String label,
    String? sub,
    String? last4,
    String? brand,
    bool isDefault = false,
  }) async {
    final response = await _api.dio.post<Map<String, dynamic>>(
      '/companies/me/payment-methods',
      data: {
        'methodType': methodType,
        'label': label,
        if (sub != null) 'sub': sub,
        if (last4 != null) 'last4': last4,
        if (brand != null) 'brand': brand,
        'isDefault': isDefault,
      },
    );
    return PaymentMethod.fromJson(response.data ?? const {});
  }

  Future<void> setDefaultPaymentMethod(String id) =>
      _api.dio.patch<void>('/companies/me/payment-methods/$id/default');

  Future<void> removePaymentMethod(String id) =>
      _api.dio.delete<void>('/companies/me/payment-methods/$id');

  static List<Map<String, dynamic>> _list(dynamic data) {
    if (data is List) return data.whereType<Map>().map(Map<String, dynamic>.from).toList();
    return const [];
  }
}

final companyWalletRepositoryProvider = Provider<CompanyWalletRepository>(
  (ref) => CompanyWalletRepository(api: ref.watch(apiClientProvider)),
);
