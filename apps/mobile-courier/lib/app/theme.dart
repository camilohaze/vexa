import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../core/theme/vexa_colors.dart';

/// Vexa Design System v1.0.4 — tema Material 3 (Inter, radius 16, blue #2563EB).
abstract final class VexaTheme {
  static ThemeData get light {
    final base = ThemeData(useMaterial3: true, colorScheme: _scheme);
    final text = GoogleFonts.interTextTheme(base.textTheme);
    return base.copyWith(
      textTheme: text,
      scaffoldBackgroundColor: VexaColors.gray50,
      appBarTheme: AppBarTheme(
        centerTitle: true,
        backgroundColor: Colors.white,
        foregroundColor: VexaColors.gray900,
        elevation: 0,
        titleTextStyle: text.titleLarge?.copyWith(
          fontWeight: FontWeight.w600,
          color: VexaColors.gray900,
        ),
      ),
      cardTheme: CardThemeData(
        elevation: 0,
        color: Colors.white,
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(VexaColors.radiusLg),
          side: const BorderSide(color: VexaColors.gray200),
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          minimumSize: const Size.fromHeight(48),
          backgroundColor: VexaColors.primary600,
          foregroundColor: Colors.white,
          textStyle: text.labelLarge?.copyWith(fontWeight: FontWeight.w600),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(VexaColors.radiusLg),
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          minimumSize: const Size.fromHeight(48),
          foregroundColor: VexaColors.primary700,
          side: const BorderSide(color: VexaColors.primary200),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(VexaColors.radiusLg),
          ),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(foregroundColor: VexaColors.primary600),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Colors.white,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(VexaColors.radiusLg),
          borderSide: const BorderSide(color: VexaColors.gray200),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(VexaColors.radiusLg),
          borderSide: const BorderSide(color: VexaColors.gray200),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(VexaColors.radiusLg),
          borderSide: const BorderSide(color: VexaColors.primary600, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(VexaColors.radiusLg),
          borderSide: const BorderSide(color: VexaColors.error500),
        ),
        labelStyle: text.bodyMedium?.copyWith(color: VexaColors.gray600),
      ),
      chipTheme: base.chipTheme.copyWith(
        shape: const StadiumBorder(),
        labelStyle: text.labelSmall?.copyWith(fontWeight: FontWeight.w600),
      ),
      snackBarTheme: const SnackBarThemeData(behavior: SnackBarBehavior.floating),
      dividerTheme: const DividerThemeData(color: VexaColors.gray200, thickness: 1),
    );
  }

  static const _scheme = ColorScheme.light(
    primary: VexaColors.primary600,
    onPrimary: Colors.white,
    primaryContainer: VexaColors.primary100,
    onPrimaryContainer: VexaColors.primary900,
    secondary: VexaColors.secondary600,
    onSecondary: Colors.white,
    secondaryContainer: VexaColors.secondary100,
    onSecondaryContainer: VexaColors.secondary900,
    tertiary: VexaColors.secondary500,
    error: VexaColors.error500,
    onError: Colors.white,
    errorContainer: VexaColors.error100,
    onErrorContainer: VexaColors.error900,
    surface: VexaColors.gray50,
    onSurface: VexaColors.gray900,
    onSurfaceVariant: VexaColors.gray600,
    outline: VexaColors.gray300,
    outlineVariant: VexaColors.gray200,
  );
}
