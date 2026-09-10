import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_foreground_task/flutter_foreground_task.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mapbox_maps_flutter/mapbox_maps_flutter.dart';

import 'app/app.dart';
import 'core/config/env.dart';
import 'core/notifications/push_service.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  if (!kIsWeb) {
    FlutterForegroundTask.initCommunicationPort();
  }

  await Env.load();
  if (Env.hasMapbox) {
    MapboxOptions.setAccessToken(Env.mapboxToken);
  }

  final push = PushService();
  await push.init();

  runApp(
    ProviderScope(
      overrides: [pushServiceProvider.overrideWithValue(push)],
      child: const VexaApp(),
    ),
  );
}
