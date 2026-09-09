import 'package:flutter/material.dart';
import '../theme/vexa_colors.dart';
import '../../features/jobs/domain/job.dart';

enum PillKind { success, warning, error, info, neutral }

class StatusPill extends StatelessWidget {
  const StatusPill({super.key, required this.label, required this.kind});

  factory StatusPill.job(JobStatus status, {Key? key}) {
    final kind = switch (status) {
      JobStatus.pending => PillKind.warning,
      JobStatus.offered ||
      JobStatus.accepted ||
      JobStatus.pickedUp ||
      JobStatus.inTransit => PillKind.info,
      JobStatus.delivered => PillKind.success,
      JobStatus.cancelled => PillKind.error,
    };
    return StatusPill(key: key, label: status.label, kind: kind);
  }

  final String label;
  final PillKind kind;

  @override
  Widget build(BuildContext context) {
    final (bg, fg) = switch (kind) {
      PillKind.success => (VexaColors.success100, VexaColors.success700),
      PillKind.warning => (VexaColors.warning100, VexaColors.warning700),
      PillKind.error => (VexaColors.error100, VexaColors.error700),
      PillKind.info => (VexaColors.primary100, VexaColors.primary700),
      PillKind.neutral => (VexaColors.gray100, VexaColors.gray600),
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(999)),
      child: Text(
        label,
        style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: fg),
      ),
    );
  }
}
