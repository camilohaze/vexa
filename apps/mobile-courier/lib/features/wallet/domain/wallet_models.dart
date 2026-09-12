import '../../../core/utils/json_parse.dart';

class CompanyWallet {
  const CompanyWallet({
    required this.spent,
    required this.pending,
    required this.refunded,
    required this.balance,
  });

  factory CompanyWallet.fromJson(Map<String, dynamic> json) => CompanyWallet(
        spent: asDouble(json['spent']),
        pending: asDouble(json['pending']),
        refunded: asDouble(json['refunded']),
        balance: asDouble(json['balance']),
      );

  final double spent;
  final double pending;
  final double refunded;
  final double balance;
}

class WalletTransaction {
  const WalletTransaction({
    required this.id,
    required this.title,
    required this.at,
    required this.amount,
    required this.status,
  });

  factory WalletTransaction.fromJson(Map<String, dynamic> json) => WalletTransaction(
        id: json['id'] as String? ?? '',
        title: json['title'] as String? ?? '',
        at: DateTime.tryParse(json['at'] as String? ?? '') ?? DateTime.now(),
        amount: asDouble(json['amount']),
        status: json['status'] as String? ?? '',
      );

  final String id;
  final String title;
  final DateTime at;
  final double amount;
  final String status;

  bool get isCredit => amount >= 0;
}

class Invoice {
  const Invoice({required this.period, required this.count, required this.total});

  factory Invoice.fromJson(Map<String, dynamic> json) => Invoice(
        period: json['period'] as String? ?? '',
        count: asInt(json['count']),
        total: asDouble(json['total']),
      );

  final String period;
  final int count;
  final double total;
}

class PaymentMethod {
  const PaymentMethod({
    required this.id,
    required this.methodType,
    required this.label,
    required this.isDefault,
    this.sub,
    this.last4,
    this.brand,
  });

  factory PaymentMethod.fromJson(Map<String, dynamic> json) => PaymentMethod(
        id: json['id'] as String? ?? '',
        methodType: json['methodType'] as String? ?? 'card',
        label: json['label'] as String? ?? '',
        isDefault: json['isDefault'] as bool? ?? false,
        sub: json['sub'] as String?,
        last4: json['last4'] as String?,
        brand: json['brand'] as String?,
      );

  final String id;
  final String methodType;
  final String label;
  final bool isDefault;
  final String? sub;
  final String? last4;
  final String? brand;
}
