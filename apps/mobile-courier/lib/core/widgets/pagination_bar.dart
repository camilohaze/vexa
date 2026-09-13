import 'package:flutter/material.dart';

import '../models/paged_result.dart';
import '../theme/vexa_colors.dart';

/// Controles Anterior/Siguiente + "Mostrando A–B de N", reutilizados por
/// toda pantalla con una lista paginada del backend.
class PaginationBar extends StatelessWidget {
  const PaginationBar({super.key, required this.result, required this.onPageChanged});

  final PagedResult<dynamic> result;
  final ValueChanged<int> onPageChanged;

  @override
  Widget build(BuildContext context) {
    if (result.total == 0) return const SizedBox.shrink();
    final start = (result.page - 1) * result.pageSize + 1;
    final end = (start + result.items.length - 1).clamp(start, result.total);

    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 8, 20, 16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text('Mostrando $start–$end de ${result.total}',
              style: const TextStyle(fontSize: 12, color: VexaColors.gray500)),
          Row(
            children: [
              IconButton(
                onPressed: result.hasPreviousPage ? () => onPageChanged(result.page - 1) : null,
                icon: const Icon(Icons.chevron_left),
                iconSize: 20,
                visualDensity: VisualDensity.compact,
              ),
              Text('${result.page} / ${result.totalPages}',
                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
              IconButton(
                onPressed: result.hasNextPage ? () => onPageChanged(result.page + 1) : null,
                icon: const Icon(Icons.chevron_right),
                iconSize: 20,
                visualDensity: VisualDensity.compact,
              ),
            ],
          ),
        ],
      ),
    );
  }
}
