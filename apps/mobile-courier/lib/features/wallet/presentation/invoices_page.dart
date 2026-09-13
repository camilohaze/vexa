import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/models/paged_result.dart';
import '../../../core/theme/vexa_colors.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/widgets/company_app_bar.dart';
import '../../../core/widgets/date_range_filter_bar.dart';
import '../../../core/widgets/pagination_bar.dart';
import '../providers.dart';

/// Figma: invoices — el "Rango de fechas" ahora filtra de verdad, y la
/// lista está paginada por el backend.
class InvoicesPage extends ConsumerWidget {
  const InvoicesPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final filter = ref.watch(companyInvoicesFilterProvider);
    final invoices = ref.watch(companyInvoicesProvider(filter));
    final money = AppFormatters.money;

    void updateFilter(PageDateFilter next) =>
        ref.read(companyInvoicesFilterProvider.notifier).state = next;

    return Scaffold(
      appBar: companyAppBar(context, 'Facturas'),
      body: invoices.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (_, __) => const Center(child: Text('No se pudieron cargar las facturas')),
        data: (page) => ListView(
          padding: const EdgeInsets.all(24),
          children: [
            DateRangeFilterBar(filter: filter, onChanged: updateFilter, padding: EdgeInsets.zero),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: FilledButton(
                onPressed: () => ScaffoldMessenger.of(context)
                    .showSnackBar(const SnackBar(content: Text('Descarga próximamente'))),
                child: const Text('Descargar todo'),
              ),
            ),
            const SizedBox(height: 20),
            if (page.items.isEmpty)
              Padding(
                padding: const EdgeInsets.only(top: 20),
                child: Center(
                  child: Text(
                    filter.hasDateRange ? 'Sin facturas en este rango.' : 'Aún no hay facturas',
                    style: const TextStyle(color: VexaColors.gray500),
                  ),
                ),
              )
            else
              for (final inv in page.items)
                Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: VexaColors.gray50,
                    border: Border.all(color: VexaColors.gray200),
                    borderRadius: BorderRadius.circular(VexaColors.radiusLg),
                  ),
                  child: Row(children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('FACT-${inv.period}',
                              style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700)),
                          Text(inv.period, style: const TextStyle(fontSize: 12, color: VexaColors.gray400)),
                          Text(money(inv.total),
                              style: const TextStyle(
                                  fontSize: 15, fontWeight: FontWeight.w800, color: VexaColors.primary600)),
                        ],
                      ),
                    ),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(color: VexaColors.success100, borderRadius: BorderRadius.circular(6)),
                          child: const Text('PAGADA',
                              style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: VexaColors.success700)),
                        ),
                        const SizedBox(height: 8),
                        TextButton(
                          onPressed: () => ScaffoldMessenger.of(context)
                              .showSnackBar(const SnackBar(content: Text('Descarga próximamente'))),
                          child: const Text('Descargar', style: TextStyle(fontSize: 13)),
                        ),
                      ],
                    ),
                  ]),
                ),
            PaginationBar(result: page, onPageChanged: (p) => updateFilter(filter.copyWith(page: p))),
          ],
        ),
      ),
    );
  }
}
