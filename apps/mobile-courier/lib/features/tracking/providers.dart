import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/location/location_service.dart';
import '../auth/domain/auth_state.dart';
import '../auth/providers.dart';
import 'data/tracking_repository.dart';

sealed class TrackingState {
  const TrackingState();
}

final class TrackingIdle extends TrackingState {
  const TrackingIdle();
}

final class TrackingActive extends TrackingState {
  const TrackingActive({this.jobId});

  final String? jobId;
}

final class TrackingBlocked extends TrackingState {
  const TrackingBlocked(this.reason);

  final LocationPermissionResult reason;

  String get message => switch (reason) {
        LocationPermissionResult.serviceDisabled =>
          'Activa el GPS para compartir tu ubicación.',
        LocationPermissionResult.deniedForever =>
          'Permite la ubicación desde Ajustes para continuar.',
        LocationPermissionResult.denied ||
        LocationPermissionResult.granted =>
          'No se pudo obtener permiso de ubicación.',
      };
}

class TrackingController extends Notifier<TrackingState> {
  TrackingRepository get _repository => ref.read(trackingRepositoryProvider);

  @override
  TrackingState build() {
    ref.listen(authStateProvider, (_, next) {
      if (next.valueOrNull is! Authenticated) stop();
    });
    return const TrackingIdle();
  }

  Future<bool> start({String? jobId}) async {
    final user = ref.read(currentUserProvider);
    if (user == null) return false;

    final result = await _repository.start(
      courierId: user.trackingId,
      jobId: jobId,
    );

    if (result == LocationPermissionResult.granted) {
      state = TrackingActive(jobId: jobId);
      return true;
    }
    state = TrackingBlocked(result);
    return false;
  }

  Future<void> stop() async {
    await _repository.stop();
    state = const TrackingIdle();
  }
}

final trackingControllerProvider =
    NotifierProvider<TrackingController, TrackingState>(TrackingController.new);
