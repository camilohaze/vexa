/// Resultado paginado genérico, espejo de `Paginated<T>` del backend
/// (`{items, total, page, pageSize}`).
class PagedResult<T> {
  const PagedResult({
    required this.items,
    required this.total,
    required this.page,
    required this.pageSize,
  });

  factory PagedResult.empty() => PagedResult(items: const [], total: 0, page: 1, pageSize: 20);

  factory PagedResult.fromJson(
    Map<String, dynamic> json,
    T Function(Map<String, dynamic>) itemFromJson,
  ) {
    final rawItems = json['items'] as List? ?? const [];
    return PagedResult(
      items: rawItems.whereType<Map>().map((m) => itemFromJson(Map<String, dynamic>.from(m))).toList(),
      total: (json['total'] as num?)?.toInt() ?? rawItems.length,
      page: (json['page'] as num?)?.toInt() ?? 1,
      pageSize: (json['pageSize'] as num?)?.toInt() ?? rawItems.length,
    );
  }

  final List<T> items;
  final int total;
  final int page;
  final int pageSize;

  int get totalPages => total == 0 ? 1 : ((total - 1) ~/ pageSize) + 1;
  bool get hasNextPage => page < totalPages;
  bool get hasPreviousPage => page > 1;
}

/// Filtro de rango de fecha + página actual, compartido por las pantallas
/// con listas paginables (billetera, historial, notificaciones, facturas...).
class PageDateFilter {
  const PageDateFilter({this.from, this.to, this.page = 1, this.pageSize = 20});

  final DateTime? from;
  final DateTime? to;
  final int page;
  final int pageSize;

  bool get hasDateRange => from != null || to != null;

  PageDateFilter copyWith({
    DateTime? from,
    DateTime? to,
    int? page,
    bool clearRange = false,
  }) =>
      PageDateFilter(
        from: clearRange ? null : (from ?? this.from),
        to: clearRange ? null : (to ?? this.to),
        page: page ?? (clearRange ? 1 : this.page),
        pageSize: pageSize,
      );

  Map<String, dynamic> toQueryParams() => {
        if (from != null) 'from': from!.toIso8601String(),
        if (to != null) 'to': to!.toIso8601String(),
        'page': page,
        'pageSize': pageSize,
      };
}
