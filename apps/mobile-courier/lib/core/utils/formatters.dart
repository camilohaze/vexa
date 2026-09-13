import 'package:intl/intl.dart';

/// Formateo centralizado de moneda (COP) y fechas para toda la app —
/// evita que cada pantalla declare su propio NumberFormat/DateFormat
/// con configuraciones inconsistentes (decimales, separadores, locale).
class AppFormatters {
  AppFormatters._();

  static final NumberFormat _currency = NumberFormat.currency(
    locale: 'es_CO',
    symbol: r'$',
    decimalDigits: 0,
  );

  /// "$103.000"
  static String money(num value) => _currency.format(value);

  static final DateFormat _date = DateFormat('d MMM, y', 'es');
  static final DateFormat _shortDate = DateFormat('d MMM', 'es');
  static final DateFormat _dateTime = DateFormat('d MMM, y • h:mm a', 'es');
  static final DateFormat _time = DateFormat('h:mm a', 'es');

  /// "12 sep, 2026"
  static String date(DateTime value) => _date.format(value);

  /// "12 sep"
  static String shortDate(DateTime value) => _shortDate.format(value);

  /// "12 sep, 2026 • 3:45 p. m."
  static String dateTime(DateTime value) => _dateTime.format(value);

  /// "3:45 p. m."
  static String time(DateTime value) => _time.format(value);

  /// "hace 5 min" / "hace 3 h" / "hace 2 d"
  static String relative(DateTime value) {
    final diff = DateTime.now().difference(value);
    if (diff.inMinutes < 1) return 'hace un momento';
    if (diff.inMinutes < 60) return 'hace ${diff.inMinutes} min';
    if (diff.inHours < 24) return 'hace ${diff.inHours} h';
    return 'hace ${diff.inDays} d';
  }
}
