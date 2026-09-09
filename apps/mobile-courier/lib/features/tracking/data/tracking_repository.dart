import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';

import '../../../core/location/location_service.dart';
import '../../../core/network/realtime_client.dart';

class TrackingRepository {
  TrackingRepository({
    required LocationService location,
    required RealtimeClient realtime,
    this.throttle = const Duration(seconds: 5),
  })  : _location = location,
        _realtime = realtime;

  final LocationService _location;
  final RealtimeClient _realtime;
  final Duration throttle;

  StreamSubscription<Position>? _subscription;
  DateTime? _lastSentAt;
  Position? _lastPosition;

  bool get isTracking => _subscription != null;
  Position? get lastPosition => _lastPosition;

  Future<LocationPermissionResult> start({
    required String courierId,
    String? jobId,
  }) async {
    final permission = await _location.ensurePermission();
    if (permission != LocationPermissionResult.granted) return permission;

    await stop();
    await _location.startBackgroundService();

    _subscription = _location.watch(distanceFilter: 10).listen(
      (position) => _publish(position, courierId: courierId, jobId: jobId),
      onError: (Object error) => debugPrint('Tracking: stream error $error'),
    );
    return permission;
  }

  Future<void> stop() async {
    await _subscription?.cancel();
    _subscription = null;
    _lastSentAt = null;
    await _location.stopBackgroundService();
  }

  void _publish(
    Position position, {
    required String courierId,
    String? jobId,
  }) {
    _lastPosition = position;
    final now = DateTime.now();
    final last = _lastSentAt;
    if (last != null && now.difference(last) < throttle) return;
    _lastSentAt = now;

    _realtime.emitCourierLocation({
      'courierId': courierId,
      if (jobId != null) 'jobId': jobId,
      'lat': position.latitude,
      'lng': position.longitude,
      'heading': position.heading,
      'speed': position.speed,
      'recordedAt': position.timestamp.toUtc().toIso8601String(),
    });
  }
}

final trackingRepositoryProvider = Provider<TrackingRepository>((ref) {
  final repository = TrackingRepository(
    location: ref.watch(locationServiceProvider),
    realtime: ref.watch(realtimeClientProvider),
  );
  ref.onDispose(repository.stop);
  return repository;
});
