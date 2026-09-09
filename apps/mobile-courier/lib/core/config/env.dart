import 'package:flutter/foundation.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

abstract final class Env {
  static const defaultApiUrl = 'http://10.0.2.2:3000/api';
  static const defaultRealtimeUrl = 'http://10.0.2.2:3001';

  static String get apiUrl => _read('API_URL', defaultApiUrl);
  static String get realtimeUrl => _read('REALTIME_URL', defaultRealtimeUrl);
  static String get mapboxToken => _read('MAPBOX_ACCESS_TOKEN', '');
  static bool get hasMapbox => mapboxToken.isNotEmpty;

  static Future<void> load() async {
    try {
      await dotenv.load(fileName: '.env');
    } catch (error) {
      debugPrint('Env: .env not found, using defaults ($error)');
    }
  }

  static String _read(String key, String fallback) {
    if (!dotenv.isInitialized) return fallback;
    final value = dotenv.maybeGet(key);
    if (value == null || value.trim().isEmpty) return fallback;
    return value.trim();
  }
}
