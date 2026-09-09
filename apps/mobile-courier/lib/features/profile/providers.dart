import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'data/courier_repository.dart';

class CourierStatusNotifier extends AsyncNotifier<CourierStatus> {
  CourierRepository get _repository => ref.read(courierRepositoryProvider);

  @override
  Future<CourierStatus> build() =>
      ref.watch(courierRepositoryProvider).fetchStatus();

  Future<void> setAvailable(bool available) async {
    final target = available ? CourierStatus.available : CourierStatus.offline;
    final previous = state;
    state = AsyncData(target);
    try {
      state = AsyncData(await _repository.updateStatus(target));
    } catch (error, stackTrace) {
      state = AsyncError<CourierStatus>(error, stackTrace)
          .copyWithPrevious(previous);
    }
  }
}

final courierStatusProvider =
    AsyncNotifierProvider<CourierStatusNotifier, CourierStatus>(
  CourierStatusNotifier.new,
);
