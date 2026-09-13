import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/models/paged_result.dart';
import '../jobs/data/jobs_repository.dart';
import '../jobs/domain/job.dart';

/// Todos los envíos activos de la empresa (el backend ya filtra por rol en
/// `/jobs`). El endpoint no soporta filtrar por varios estados a la vez, así
/// que se piden 100 (volumen razonable de envíos simultáneos) y se filtran
/// en cliente los que ya terminaron.
final companyJobsProvider = FutureProvider.autoDispose<PagedResult<Job>>((ref) async {
  final data = await ref.watch(jobsRepositoryProvider).fetchJobs(pageSize: 100);
  return PagedResult.fromJson(data, Job.fromJson);
});

final companyActiveJobsProvider = Provider.autoDispose<List<Job>>((ref) {
  final jobs = ref.watch(companyJobsProvider).valueOrNull?.items ?? const [];
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

/// Filtro (rango de fecha + página) del historial de envíos de la empresa.
final companyHistoryFilterProvider =
    StateProvider.autoDispose<PageDateFilter>((ref) => const PageDateFilter());

final companyHistoryProvider = FutureProvider.autoDispose
    .family<({PagedResult<Job> page, int totalCount, double totalSpend}), PageDateFilter>((ref, filter) async {
  final result = await ref.watch(jobsRepositoryProvider).history(
        from: filter.from,
        to: filter.to,
        page: filter.page,
        pageSize: filter.pageSize,
      );
  return (
    page: PagedResult(items: result.items, total: result.total, page: result.page, pageSize: result.pageSize),
    totalCount: result.totalCount,
    totalSpend: result.totalSpend,
  );
});

final companyJobDetailProvider = FutureProvider.autoDispose.family<Job, String>(
  (ref, id) => ref.watch(jobsRepositoryProvider).fetchById(id),
);
