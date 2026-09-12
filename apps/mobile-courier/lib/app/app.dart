import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/network/deep_links.dart';
import 'router.dart';
import 'theme.dart';

class VexaApp extends ConsumerWidget {
  const VexaApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Inicializa el listener de deep links (vexa://auth/callback) una sola vez.
    ref.watch(deepLinkServiceProvider).init();
    final router = ref.watch(routerProvider);
    return MaterialApp.router(
      title: 'Vexa Courier',
      debugShowCheckedModeBanner: false,
      theme: VexaTheme.light,
      locale: const Locale('es'),
      supportedLocales: const [Locale('es'), Locale('en')],
      localizationsDelegates: const [
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      routerConfig: router,
    );
  }
}
