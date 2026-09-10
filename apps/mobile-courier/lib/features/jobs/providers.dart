import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'data/jobs_repository.dart';
import 'domain/job.dart';

/// Filtros seleccionados en el Job Board.
final offeredFiltersProvider = StateProvider<Set<int>>((ref) => const {});

class OfferedJobsNotifier extends AsyncNotifier<List<Job>> {
  JobsRepository get _repository => ref.read(jobsRepositoryProvider);

  @override
  Future<List<Job>> build() async {
    final repository = ref.watch(jobsRepositoryProvider);

    final newJobs = repository.newJobs.listen(_upsert);
    final removed = repository.cancelledJobIds.listen(_remove);
    final taken = repository.acceptedElsewhereJobIds.listen(_remove);
    ref.onDispose(() {
      newJobs.cancel();
      removed.cancel();
      taken.cancel();
    });

    return repository.fetchOffered();
  }

  Future<void> refresh() async {
    state = const AsyncLoading<List<Job>>().copyWithPrevious(state);
    state = await AsyncValue.guard(_repository.fetchOffered);
  }

  Future<Job> accept(String id) async {
    final job = await _repository.accept(id);
    _remove(id);
    return job;
  }

  void _upsert(Job job) {
    if (job.status != JobStatus.offered) {
      _remove(job.id);
      return;
    }
    final current = state.valueOrNull ?? const <Job>[];
    final others = current.where((item) => item.id != job.id);
    state = AsyncData([job, ...others]);
  }

  void _remove(String id) {
    final current = state.valueOrNull;
    if (current == null) return;
    state = AsyncData(current.where((item) => item.id != id).toList());
  }
}

final offeredJobsProvider =
    AsyncNotifierProvider<OfferedJobsNotifier, List<Job>>(
  OfferedJobsNotifier.new,
);

final newJobStreamProvider = StreamProvider<Job>(
  (ref) => ref.watch(jobsRepositoryProvider).newJobs,
);

/// Historial del repartidor (pedidos propios completados).
final myJobsProvider = FutureProvider<List<Job>>((ref) async {
  final jobs = await ref.watch(jobsRepositoryProvider).fetchMine();
  return jobs.where((j) => j.status.isFinished).toList();
});

class JobDetailNotifier extends FamilyAsyncNotifier<Job, String> {
  JobsRepository get _repository => ref.read(jobsRepositoryProvider);

  @override
  Future<Job> build(String arg) async {
    final offered = ref.read(offeredJobsProvider).valueOrNull;
    final cached = offered?.where((job) => job.id == arg).firstOrNull;
    if (cached != null) return cached;
    return _repository.fetchById(arg);
  }

  Future<Job> accept() => _mutate(() => _repository.accept(arg));

  Future<Job> pickUp() => _mutate(() => _repository.pickUp(arg));

  Future<Job> complete({String? proofOfDeliveryUrl}) => _mutate(
        () => _repository.complete(arg, proofOfDeliveryUrl: proofOfDeliveryUrl),
      );

  Future<Job> _mutate(Future<Job> Function() action) async {
    final job = await action();
    state = AsyncData(job);
    return job;
  }
}

final jobDetailProvider =
    AsyncNotifierProvider.family<JobDetailNotifier, Job, String>(
  JobDetailNotifier.new,
);
