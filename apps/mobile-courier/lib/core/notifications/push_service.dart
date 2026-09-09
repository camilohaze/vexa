import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class PushService {
  bool _initialized = false;

  bool get isAvailable => _initialized;

  Future<void> init() async {
    if (_initialized) return;
    try {
      await Firebase.initializeApp();
      _initialized = true;
    } catch (error) {
      debugPrint('Push: Firebase unavailable, notifications disabled ($error)');
    }
  }

  Future<bool> requestPermission() async {
    if (!_initialized) return false;
    try {
      final settings = await FirebaseMessaging.instance.requestPermission(
        alert: true,
        badge: true,
        sound: true,
      );
      return settings.authorizationStatus == AuthorizationStatus.authorized ||
          settings.authorizationStatus == AuthorizationStatus.provisional;
    } catch (error) {
      debugPrint('Push: permission request failed ($error)');
      return false;
    }
  }

  Future<String?> getToken() async {
    if (!_initialized) return null;
    try {
      return await FirebaseMessaging.instance.getToken();
    } catch (error) {
      debugPrint('Push: token retrieval failed ($error)');
      return null;
    }
  }

  Stream<String> get tokenRefreshes =>
      _initialized ? FirebaseMessaging.instance.onTokenRefresh : const Stream.empty();

  Stream<RemoteMessage> get foregroundMessages =>
      _initialized ? FirebaseMessaging.onMessage : const Stream.empty();

  Stream<RemoteMessage> get openedFromNotification =>
      _initialized ? FirebaseMessaging.onMessageOpenedApp : const Stream.empty();
}

final pushServiceProvider = Provider<PushService>((ref) => PushService());
