import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_foreground_task/flutter_foreground_task.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/date_symbol_data_local.dart';

import 'app/app.dart';
import 'core/config/env.dart';
import 'core/notifications/push_service.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  if (!kIsWeb) {
    FlutterForegroundTask.initCommunicationPort();
  }

  await Env.load();
  // Requerido por DateFormat(..., 'es') en toda la app (jobs, wallet,
  // historial, calificaciones) — sin esto lanza LocaleDataException.
  await initializeDateFormatting('es');

  final push = PushService();
  await push.init();

  runApp(
    ProviderScope(
      overrides: [pushServiceProvider.overrideWithValue(push)],
      child: const VexaApp(),
    ),
  );
}
