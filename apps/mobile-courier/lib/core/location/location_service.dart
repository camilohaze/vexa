import 'package:flutter/foundation.dart';
import 'package:flutter_foreground_task/flutter_foreground_task.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';

enum LocationPermissionResult { granted, denied, deniedForever, serviceDisabled }

@pragma('vm:entry-point')
void trackingServiceCallback() {
  FlutterForegroundTask.setTaskHandler(_TrackingTaskHandler());
}

class _TrackingTaskHandler extends TaskHandler {
  @override
  Future<void> onStart(DateTime timestamp, TaskStarter starter) async {}

  @override
  void onRepeatEvent(DateTime timestamp) {}

  @override
  Future<void> onDestroy(DateTime timestamp) async {}
}

class LocationService {
  static const _serviceId = 2601;
  bool _initialized = false;

  Future<LocationPermissionResult> ensurePermission() async {
    if (!await Geolocator.isLocationServiceEnabled()) {
      return LocationPermissionResult.serviceDisabled;
    }

    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }

    return switch (permission) {
      LocationPermission.always ||
      LocationPermission.whileInUse =>
        LocationPermissionResult.granted,
      LocationPermission.deniedForever =>
        LocationPermissionResult.deniedForever,
      LocationPermission.denied ||
      LocationPermission.unableToDetermine =>
        LocationPermissionResult.denied,
    };
  }

  Future<Position?> current() async {
    try {
      return await Geolocator.getCurrentPosition(
        locationSettings:
            const LocationSettings(accuracy: LocationAccuracy.high),
      );
    } catch (error) {
      debugPrint('Location: current position failed ($error)');
      return null;
    }
  }

  Stream<Position> watch({int distanceFilter = 10}) {
    final settings = LocationSettings(
      accuracy: LocationAccuracy.high,
      distanceFilter: distanceFilter,
    );
    return Geolocator.getPositionStream(locationSettings: settings);
  }

  void _initForegroundTask() {
    if (_initialized) return;
    FlutterForegroundTask.init(
      androidNotificationOptions: AndroidNotificationOptions(
        channelId: 'vexa_tracking',
        channelName: 'Seguimiento de entregas',
        channelDescription:
            'Se muestra mientras Vexa comparte tu ubicación en una entrega.',
        channelImportance: NotificationChannelImportance.LOW,
        priority: NotificationPriority.LOW,
      ),
      iosNotificationOptions: const IOSNotificationOptions(
        showNotification: false,
        playSound: false,
      ),
      foregroundTaskOptions: ForegroundTaskOptions(
        eventAction: ForegroundTaskEventAction.nothing(),
        autoRunOnBoot: false,
        allowWakeLock: true,
        allowWifiLock: true,
      ),
    );
    _initialized = true;
  }

  Future<bool> startBackgroundService() async {
    if (kIsWeb) return false;
    _initForegroundTask();

    if (await FlutterForegroundTask.isRunningService) return true;

    try {
      await FlutterForegroundTask.startService(
        serviceId: _serviceId,
        notificationTitle: 'Vexa',
        notificationText: 'Compartiendo tu ubicación con la entrega en curso',
        callback: trackingServiceCallback,
      );
      return true;
    } catch (error) {
      debugPrint('Location: foreground service failed to start ($error)');
      return false;
    }
  }

  Future<void> stopBackgroundService() async {
    if (kIsWeb) return;
    try {
      if (await FlutterForegroundTask.isRunningService) {
        await FlutterForegroundTask.stopService();
      }
    } catch (error) {
      debugPrint('Location: foreground service failed to stop ($error)');
    }
  }
}

final locationServiceProvider =
    Provider<LocationService>((ref) => LocationService());
