import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/vexa_colors.dart';
import '../../../core/widgets/company_app_bar.dart';
import '../../../core/widgets/company_field.dart';
import '../data/company_wallet_repository.dart';
import '../domain/wallet_models.dart';
import '../providers.dart';

/// Figma: payment-methods.
class PaymentMethodsPage extends ConsumerWidget {
  const PaymentMethodsPage({super.key});

  Future<void> _addMethod(BuildContext context, WidgetRef ref, String type) async {
    final label = TextEditingController();
    final last4 = TextEditingController();
    final saved = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      builder: (sheetContext) => Padding(
        padding: EdgeInsets.only(
          left: 24, right: 24, top: 24,
          bottom: 24 + MediaQuery.of(sheetContext).viewInsets.bottom,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(type == 'card' ? 'Añadir tarjeta' : 'Añadir cuenta bancaria',
                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
            const SizedBox(height: 16),
            CompanyField(label: type == 'card' ? 'Banco / marca' : 'Nombre de la cuenta', controller: label),
            if (type == 'card') ...[
              const SizedBox(height: 12),
              CompanyField(label: 'Últimos 4 dígitos', controller: last4, keyboardType: TextInputType.number),
            ],
            const SizedBox(height: 20),
            FilledButton(
              onPressed: () async {
                if (label.text.trim().isEmpty) return;
                await ref.read(companyWalletRepositoryProvider).addPaymentMethod(
                      methodType: type,
                      label: label.text.trim(),
                      last4: last4.text.trim().isEmpty ? null : last4.text.trim(),
                    );
                if (sheetContext.mounted) Navigator.of(sheetContext).pop(true);
              },
              child: const Text('Guardar'),
            ),
          ],
        ),
      ),
    );
    if (saved == true) ref.invalidate(companyPaymentMethodsProvider);
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final methods = ref.watch(companyPaymentMethodsProvider);

    return Scaffold(
      appBar: companyAppBar(context, 'Métodos de pago'),
      body: methods.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (_, __) => const Center(child: Text('No se pudieron cargar los métodos')),
        data: (list) => ListView(
          padding: const EdgeInsets.all(24),
          children: [
            const Text('MÉTODOS GUARDADOS',
                style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: VexaColors.gray800)),
            const SizedBox(height: 16),
            for (final m in list)
              Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: _MethodRow(
                  method: m,
                  onDelete: () async {
                    await ref.read(companyWalletRepositoryProvider).removePaymentMethod(m.id);
                    ref.invalidate(companyPaymentMethodsProvider);
                  },
                ),
              ),
            const SizedBox(height: 8),
            OutlinedButton(
              onPressed: () => _addMethod(context, ref, 'card'),
              style: OutlinedButton.styleFrom(minimumSize: const Size.fromHeight(48)),
              child: const Text('+ Añadir tarjeta de crédito/débito'),
            ),
            const SizedBox(height: 12),
            OutlinedButton(
              onPressed: () => _addMethod(context, ref, 'bank'),
              style: OutlinedButton.styleFrom(minimumSize: const Size.fromHeight(48)),
              child: const Text('+ Añadir cuenta bancaria'),
            ),
          ],
        ),
      ),
    );
  }
}

class _MethodRow extends StatelessWidget {
  const _MethodRow({required this.method, required this.onDelete});

  final PaymentMethod method;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) {
    final title = method.last4 != null ? '${method.label} •••• ${method.last4}' : method.label;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: VexaColors.gray50,
        border: Border.all(color: VexaColors.gray200),
        borderRadius: BorderRadius.circular(VexaColors.radiusLg),
      ),
      child: Row(children: [
        Icon(method.methodType == 'card' ? Icons.credit_card : Icons.account_balance,
            size: 24, color: VexaColors.gray600),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700)),
              if (method.sub != null)
                Text(method.sub!, style: const TextStyle(fontSize: 12, color: VexaColors.gray400)),
            ],
          ),
        ),
        if (method.isDefault)
          Container(
            margin: const EdgeInsets.only(right: 8),
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(color: VexaColors.success100, borderRadius: BorderRadius.circular(6)),
            child: const Text('PREDETERMINADA',
                style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: VexaColors.success700)),
          ),
        TextButton(
          onPressed: onDelete,
          style: TextButton.styleFrom(foregroundColor: VexaColors.error500),
          child: const Text('Eliminar'),
        ),
      ]),
    );
  }
}
