import 'package:flutter/material.dart';

import '../../../../core/theme/vexa_colors.dart';

/// Título de sección en mayúsculas (overline del design system).
class VerificationSectionTitle extends StatelessWidget {
  const VerificationSectionTitle(this.text, {super.key});
  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Text(text,
          style: const TextStyle(
              fontSize: 10, letterSpacing: 0.6,
              color: VexaColors.gray500, fontWeight: FontWeight.w600)),
    );
  }
}

class VerificationCheckTile extends StatelessWidget {
  const VerificationCheckTile({
    super.key,
    required this.label,
    required this.value,
    required this.onChanged,
  });

  final String label;
  final bool value;
  final ValueChanged<bool> onChanged;

  @override
  Widget build(BuildContext context) {
    return CheckboxListTile(
      controlAffinity: ListTileControlAffinity.leading,
      contentPadding: const EdgeInsets.symmetric(horizontal: 12),
      title: Text(label, style: const TextStyle(fontSize: 14)),
      value: value,
      onChanged: (v) => onChanged(v ?? false),
    );
  }
}

/// Pill azul de estado (PICKUP / DROP-OFF del Figma).
class StatusPillInfo extends StatelessWidget {
  const StatusPillInfo({super.key, required this.label});
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: VexaColors.primary100,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(label,
          style: const TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w700,
              color: VexaColors.primary700)),
    );
  }
}

/// Área punteada para foto/firma — muestra estado "capturado" en verde.
class UploadTile extends StatelessWidget {
  const UploadTile({
    super.key,
    required this.icon,
    required this.label,
    required this.done,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final bool done;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(VexaColors.radiusLg),
      child: Container(
        height: 88,
        decoration: BoxDecoration(
          color: done ? VexaColors.success50 : VexaColors.gray50,
          borderRadius: BorderRadius.circular(VexaColors.radiusLg),
          border: Border.all(
            color: done ? VexaColors.success300 : VexaColors.gray300,
          ),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(done ? Icons.check_circle : icon,
                color: done ? VexaColors.success500 : VexaColors.gray400,
                size: 28),
            const SizedBox(height: 6),
            Text(label,
                style: TextStyle(
                    fontSize: 13,
                    color: done ? VexaColors.success700 : VexaColors.gray500)),
          ],
        ),
      ),
    );
  }
}
