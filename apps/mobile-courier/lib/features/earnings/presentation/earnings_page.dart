import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../../app/router.dart';
import '../../../core/theme/vexa_colors.dart';
import '../../../core/widgets/vexa_bottom_nav.dart';
import '../providers.dart';

/// Figma: earnings-dashboard — tabs de período, hero, gráfico de barras,
/// desglose por tipo.
class EarningsPage extends ConsumerStatefulWidget {
  const EarningsPage({super.key});

  @override
  ConsumerState<EarningsPage> createState() => _EarningsPageState();
}

class _EarningsPageState extends ConsumerState<EarningsPage> {
  int _period = 1; // Semana por defecto
  static const _periods = ['Hoy', 'Semana', 'Mes', 'Año'];

  final _money = NumberFormat.currency(
          locale: 'es_CO', symbol: r'$', decimalDigits: 2)
      .format;

  @override
  Widget build(BuildContext context) {
    final summary = ref.watch(earningsSummaryProvider).valueOrNull ??
        const EarningsSummary(
          total: 0, tips: 0, bonuses: 0, available: 0, pending: 0,
          today: 0, completed: 0,
          dailyBars: [0, 0, 0, 0, 0, 0, 0], breakdown: [],
        );
    final theme = Theme.of(context);
    // "Año" reutiliza el total mensual: el backend aún no expone un
    // agregado anual separado.
    final periodTotal = switch (_period) {
      0 => summary.today,
      1 => summary.total,
      _ => summary.month,
    };

    return Scaffold(
      appBar: AppBar(title: const Text('Ganancias')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          SegmentedButton<int>(
            segments: [
              for (var i = 0; i < _periods.length; i++)
                ButtonSegment(value: i, label: Text(_periods[i])),
            ],
            selected: {_period},
            onSelectionChanged: (s) => setState(() => _period = s.first),
            showSelectedIcon: false,
          ),
          const SizedBox(height: 16),
          // Hero
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: VexaColors.gray900,
              borderRadius: BorderRadius.circular(VexaColors.radiusLg),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('GANANCIAS TOTALES DE ${_periods[_period].toUpperCase()}',
                    style: const TextStyle(
                        fontSize: 10, letterSpacing: 0.8,
                        color: Colors.white60, fontWeight: FontWeight.w600)),
                const SizedBox(height: 8),
                Text(_money(periodTotal),
                    style: theme.textTheme.displaySmall?.copyWith(
                        color: Colors.white, fontWeight: FontWeight.w700)),
                const SizedBox(height: 12),
                Row(
                  children: [
                    _HeroChip('Propinas', _money(summary.tips)),
                    const SizedBox(width: 8),
                    _HeroChip('Bonos', _money(summary.bonuses)),
                  ],
                ),
                const SizedBox(height: 16),
                FilledButton(
                  style: FilledButton.styleFrom(
                      backgroundColor: VexaColors.primary600),
                  onPressed: () => context.push(AppRoutes.courierWithdraw),
                  child: const Text('Retirar fondos'),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          Text('Actividad y tendencias',
              style: theme.textTheme.titleSmall
                  ?.copyWith(fontWeight: FontWeight.w700)),
          const SizedBox(height: 12),
          _BarChart(values: summary.dailyBars),
          const SizedBox(height: 24),
          Text('Desglose por tipo',
              style: theme.textTheme.titleSmall
                  ?.copyWith(fontWeight: FontWeight.w700)),
          const SizedBox(height: 8),
          Card(
            margin: EdgeInsets.zero,
            child: Column(
              children: [
                for (final (type, amount, count) in summary.breakdown)
                  ListTile(
                    title: Text(type, style: const TextStyle(fontSize: 14)),
                    subtitle: Text('$count entregas',
                        style: const TextStyle(
                            fontSize: 11, color: VexaColors.gray500)),
                    trailing: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text(_money(amount),
                            style: const TextStyle(
                                fontWeight: FontWeight.w700)),
                        Text(
                            '${(amount / summary.total * 100).round()}%',
                            style: const TextStyle(
                                fontSize: 11, color: VexaColors.gray400)),
                      ],
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
      bottomNavigationBar: const VexaBottomNav(current: 2, items: VexaBottomNav.courierItems),
    );
  }
}

class _HeroChip extends StatelessWidget {
  const _HeroChip(this.label, this.value);
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.white12,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text('$label $value',
          style: const TextStyle(fontSize: 12, color: Colors.white70)),
    );
  }
}

class _BarChart extends StatelessWidget {
  const _BarChart({required this.values});
  final List<double> values;

  static const _days = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: EdgeInsets.zero,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: SizedBox(
          height: 130,
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              for (var i = 0; i < values.length; i++)
                Expanded(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      Expanded(
                        child: Align(
                          alignment: Alignment.bottomCenter,
                          child: FractionallySizedBox(
                            heightFactor: values[i],
                            widthFactor: 0.55,
                            child: Container(
                              decoration: BoxDecoration(
                                color: i == values.indexOf(values.reduce((a, b) => a > b ? a : b))
                                    ? VexaColors.primary600
                                    : VexaColors.primary200,
                                borderRadius: BorderRadius.circular(4),
                              ),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(_days[i],
                          style: const TextStyle(
                              fontSize: 10, color: VexaColors.gray400)),
                    ],
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
