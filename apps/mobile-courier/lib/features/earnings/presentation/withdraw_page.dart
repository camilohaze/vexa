import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../../core/theme/vexa_colors.dart';
import '../../profile/data/courier_repository.dart';
import '../providers.dart';

final payoutMethodsProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  try {
    return await ref.watch(courierRepositoryProvider).fetchPayoutMethods();
  } catch (_) {
    return const [];
  }
});

/// Figma: withdraw-funds — balance disponible, monto con MAX,
/// métodos de retiro y confirmación.
class WithdrawPage extends ConsumerStatefulWidget {
  const WithdrawPage({super.key});

  @override
  ConsumerState<WithdrawPage> createState() => _WithdrawPageState();
}

class _WithdrawPageState extends ConsumerState<WithdrawPage> {
  final _amount = TextEditingController();
  int _method = 0;
  bool _submitting = false;

  Future<void> _confirm(List<Map<String, dynamic>> methods) async {
    final amount = double.tryParse(_amount.text) ?? 0;
    if (amount <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Ingresa un monto válido')),
      );
      return;
    }
    setState(() => _submitting = true);
    try {
      final key = methods[_method]['key'] as String? ?? '';
      await ref
          .read(courierRepositoryProvider)
          .requestPayout(amount, key);
      ref.invalidate(earningsSummaryProvider);
      ref.invalidate(payoutsProvider);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Retiro en proceso')),
      );
      context.pop();
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Saldo insuficiente o error de red')),
        );
      }
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  void dispose() {
    _amount.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final summary = ref.watch(earningsSummaryProvider).valueOrNull ??
        const EarningsSummary(
          total: 0, tips: 0, bonuses: 0, available: 0, pending: 0,
          today: 0, completed: 0,
          dailyBars: [0, 0, 0, 0, 0, 0, 0], breakdown: [],
        );
    final methodsAsync = ref.watch(payoutMethodsProvider);
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(title: const Text('Retirar fondos')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Center(
            child: Column(
              children: [
                Text('SALDO DISPONIBLE',
                    style: theme.textTheme.labelSmall?.copyWith(
                        letterSpacing: 0.6, color: VexaColors.gray500)),
                const SizedBox(height: 6),
                Text(
                  NumberFormat.currency(
                          locale: 'es_CO', symbol: r'$', decimalDigits: 2)
                      .format(summary.available),
                  style: theme.textTheme.displaySmall?.copyWith(
                      fontWeight: FontWeight.w700,
                      color: VexaColors.primary700),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          Text('Ingresa el monto', style: theme.textTheme.labelLarge),
          const SizedBox(height: 8),
          TextField(
            controller: _amount,
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            decoration: InputDecoration(
              prefixText: r'$ ',
              hintText: '0.00',
              suffixIcon: TextButton(
                onPressed: () =>
                    _amount.text = summary.available.toStringAsFixed(2),
                child: const Text('MAX'),
              ),
            ),
          ),
          const SizedBox(height: 24),
          Text('Método de retiro', style: theme.textTheme.labelLarge),
          const SizedBox(height: 8),
          methodsAsync.when(
            data: (methods) {
              if (methods.isEmpty) {
                return const Text('No hay métodos de retiro configurados.');
              }
              return Column(
                children: [
                  for (var i = 0; i < methods.length; i++) ...[
                    _MethodCard(
                      data: methods[i],
                      selected: _method == i,
                      onTap: () => setState(() => _method = i),
                    ),
                    const SizedBox(height: 8),
                  ],
                  const SizedBox(height: 16),
                  FilledButton(
                    onPressed: _submitting ? null : () => _confirm(methods),
                    child: _submitting
                        ? const SizedBox(
                            width: 20, height: 20,
                            child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                        : const Text('Confirmar retiro'),
                  ),
                ],
              );
            },
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (_, __) => const Text('Error al cargar métodos de retiro.'),
          ),
        ],
      ),
    );
  }
}

class _MethodCard extends StatelessWidget {
  const _MethodCard({
    required this.data,
    required this.selected,
    required this.onTap,
  });

  final Map<String, dynamic> data;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(VexaColors.radiusLg),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: selected ? VexaColors.primary50 : Colors.white,
          borderRadius: BorderRadius.circular(VexaColors.radiusLg),
          border: Border.all(
            color: selected ? VexaColors.primary600 : VexaColors.gray200,
            width: selected ? 2 : 1,
          ),
        ),
        child: Row(
          children: [
            Icon(
              selected ? Icons.radio_button_checked : Icons.radio_button_off,
              color: selected ? VexaColors.primary600 : VexaColors.gray300,
              size: 20,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(data['label'] as String? ?? '',
                      style: const TextStyle(
                          fontSize: 14, fontWeight: FontWeight.w600)),
                  Text('${data['detail'] as String? ?? ''} · ${data['time'] as String? ?? ''}',
                      style: const TextStyle(
                          fontSize: 11, color: VexaColors.gray500)),
                ],
              ),
            ),
            Text(data['fee'] as String? ?? '',
                style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: VexaColors.success700)),
          ],
        ),
      ),
    );
  }
}
