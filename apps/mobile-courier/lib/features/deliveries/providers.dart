import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../jobs/data/jobs_repository.dart';
import '../jobs/domain/job.dart';

/// Todos los envíos de la empresa (el backend ya filtra por rol en `/jobs`).
final companyJobsProvider = FutureProvider.autoDispose<List<Job>>(
  (ref) => ref.watch(jobsRepositoryProvider).fetchMine(),
);

final companyActiveJobsProvider = Provider.autoDispose<List<Job>>((ref) {
  final jobs = ref.watch(companyJobsProvider).valueOrNull ?? const [];
  return jobs.where((j) => !j.status.isFinished).toList()
    ..sort((a, b) => _statusRank(b.status).compareTo(_statusRank(a.status)));
});

/// Job activo más relevante para la pestaña "Rastrear" (mismo criterio que
/// tracking-overview en el portal web: prioriza el más avanzado).
final mostRelevantActiveJobProvider = Provider.autoDispose<Job?>((ref) {
  final active = ref.watch(companyActiveJobsProvider);
  return active.isEmpty ? null : active.first;
});

int _statusRank(JobStatus status) => switch (status) {
      JobStatus.inTransit => 4,
      JobStatus.pickedUp => 3,
      JobStatus.accepted => 2,
      JobStatus.offered => 1,
      JobStatus.pending => 0,
      _ => -1,
    };

final companyHistoryProvider =
    FutureProvider.autoDispose<({List<Job> items, int totalCount, double totalSpend})>(
  (ref) => ref.watch(jobsRepositoryProvider).history(),
);

final companyJobDetailProvider = FutureProvider.autoDispose.family<Job, String>(
  (ref, id) => ref.watch(jobsRepositoryProvider).fetchById(id),
);
