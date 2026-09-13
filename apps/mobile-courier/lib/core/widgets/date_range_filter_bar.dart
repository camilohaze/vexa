import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../models/paged_result.dart';
import '../theme/vexa_colors.dart';

/// Barra de filtro de rango de fecha, reutilizada por billetera, historial,
/// notificaciones, facturas y reseñas. Cambiar el rango reinicia la página a 1.
class DateRangeFilterBar extends StatelessWidget {
  const DateRangeFilterBar({
    super.key,
    required this.filter,
    required this.onChanged,
    this.padding = const EdgeInsets.fromLTRB(20, 8, 20, 4),
  });

  final PageDateFilter filter;
  final ValueChanged<PageDateFilter> onChanged;

  /// Por defecto asume que se usa como hijo directo de un `ListView` sin
  /// padding propio. Pásalo en `EdgeInsets.zero` (o el que corresponda) si
  /// el contenedor ya aporta su propio padding horizontal.
  final EdgeInsets padding;

  static final _format = DateFormat('d MMM yyyy', 'es');

  Future<void> _pickRange(BuildContext context) async {
    final now = DateTime.now();
    final picked = await showDateRangePicker(
      context: context,
      firstDate: DateTime(now.year - 3),
      lastDate: now,
      initialDateRange: filter.from != null && filter.to != null
          ? DateTimeRange(start: filter.from!, end: filter.to!)
          : null,
    );
    if (picked != null) {
      onChanged(filter.copyWith(from: picked.start, to: picked.end, page: 1));
    }
  }

  @override
  Widget build(BuildContext context) {
    final label = filter.hasDateRange
        ? '${_format.format(filter.from ?? filter.to!)} – ${_format.format(filter.to ?? filter.from!)}'
        : 'Todo el historial';

    return Padding(
      padding: padding,
      child: Row(
        children: [
          Expanded(
            child: InkWell(
              onTap: () => _pickRange(context),
              borderRadius: BorderRadius.circular(VexaColors.radiusSm),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  border: Border.all(color: VexaColors.gray200),
                  borderRadius: BorderRadius.circular(VexaColors.radiusSm),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.date_range, size: 16, color: VexaColors.gray500),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(label,
                          style: const TextStyle(fontSize: 12, color: VexaColors.gray700),
                          overflow: TextOverflow.ellipsis),
                    ),
                  ],
                ),
              ),
            ),
          ),
          if (filter.hasDateRange) ...[
            const SizedBox(width: 8),
            TextButton(
              onPressed: () => onChanged(filter.copyWith(clearRange: true)),
              child: const Text('Restablecer', style: TextStyle(fontSize: 12)),
            ),
          ],
        ],
      ),
    );
  }
}
