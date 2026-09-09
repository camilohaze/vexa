import 'dart:async';

import 'package:app_links/app_links.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../features/auth/providers.dart';

/// Maneja deep links `vexa://auth/callback?access_token=…&refresh_token=…`
/// emitidos por el backend al finalizar el login OAuth en el navegador.
class DeepLinkService {
  DeepLinkService(this._ref);

  final Ref _ref;
  final _links = AppLinks();
  StreamSubscription<Uri>? _sub;

  Future<void> init() async {
    try {
      final initial = await _links.getInitialLink();
      if (initial != null) await _handle(initial);
    } catch (e) {
      debugPrint('DeepLink initial error: $e');
    }
    _sub = _links.uriLinkStream.listen(_handle, onError: (Object e) {
      debugPrint('DeepLink stream error: $e');
    });
  }

  Future<void> _handle(Uri uri) async {
    if (uri.scheme != 'vexa' || uri.host != 'auth') return;
    final access = uri.queryParameters['access_token'];
    final refresh = uri.queryParameters['refresh_token'];
    if (access == null || access.isEmpty) return;
    await _ref.read(authStateProvider.notifier).completeLogin(
          accessToken: access,
          refreshToken: refresh ?? '',
        );
  }

  void dispose() => _sub?.cancel();
}

final deepLinkServiceProvider = Provider<DeepLinkService>((ref) {
  final service = DeepLinkService(ref);
  ref.onDispose(service.dispose);
  return service;
});
