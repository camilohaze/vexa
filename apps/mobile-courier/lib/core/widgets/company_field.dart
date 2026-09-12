import 'package:flutter/material.dart';

import '../theme/vexa_colors.dart';

/// Campo de texto con label arriba + icono, reutilizado en las pantallas
/// de company (Figma: "input-field-group" / "input-container").
class CompanyField extends StatelessWidget {
  const CompanyField({
    super.key,
    required this.label,
    this.hint,
    this.icon,
    this.controller,
    this.keyboardType,
    this.maxLines = 1,
    this.onTap,
    this.readOnly = false,
    this.validator,
  });

  final String label;
  final String? hint;
  final IconData? icon;
  final TextEditingController? controller;
  final TextInputType? keyboardType;
  final int maxLines;
  final VoidCallback? onTap;
  final bool readOnly;
  final String? Function(String?)? validator;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label,
            style: const TextStyle(
                fontSize: 13, fontWeight: FontWeight.w600, color: VexaColors.gray600)),
        const SizedBox(height: 6),
        TextFormField(
          controller: controller,
          keyboardType: keyboardType,
          maxLines: maxLines,
          readOnly: readOnly,
          onTap: onTap,
          validator: validator,
          style: const TextStyle(fontSize: 15, color: VexaColors.gray800),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: const TextStyle(color: VexaColors.gray400, fontSize: 15),
            prefixIcon: icon == null
                ? null
                : Icon(icon, size: 18, color: VexaColors.gray500),
            filled: true,
            fillColor: VexaColors.gray50,
            contentPadding:
                const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(VexaColors.radiusMd),
              borderSide: const BorderSide(color: VexaColors.gray200),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(VexaColors.radiusMd),
              borderSide: const BorderSide(color: VexaColors.gray200),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(VexaColors.radiusMd),
              borderSide: const BorderSide(color: VexaColors.primary600, width: 1.5),
            ),
          ),
        ),
      ],
    );
  }
}
