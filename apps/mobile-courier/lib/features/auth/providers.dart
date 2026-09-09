import 'dart:async';

import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/network/api_client.dart';
import '../../core/network/realtime_client.dart';
import '../../core/notifications/push_service.dart';
import '../../core/storage/secure_storage.dart';
import 'data/auth_repository.dart';
import 'domain/auth_state.dart';
import 'domain/courier_user.dart';

final authRepositoryProvider = Provider<AuthRepository>(
  (ref) => AuthRepository(
    api: ref.watch(apiClientProvider),
    storage: ref.watch(secureStorageProvider),
  ),
);

class AuthNotifier extends AsyncNotifier<AuthState> {
  AuthRepository get _repository => ref.read(authRepositoryProvider);

  @override
  Future<AuthState> build() async {
    final state = await _repository.restoreSession();
    await _onStateChanged(state);
    return state;
  }

  Uri loginUri(AuthProvider provider) => _repository.loginUri(provider);

  /// Devuelve `true` si el login exige verificación de correo (OTP enviado).
  Future<bool> loginWithPassword({
    required String email,
    required String password,
  }) async {
    try {
      final tokens = await _repository.loginWithPassword(
        email: email,
        password: password,
      );
      await completeLogin(
        accessToken: tokens.access,
        refreshToken: tokens.refresh,
      );
      return false;
    } on DioException catch (error) {
      if (error.response?.statusCode == 403 &&
          error.response?.data is Map &&
          (error.response?.data['message'] as String? ?? '')
              .contains('EMAIL_NOT_VERIFIED')) {
        return true;
      }
      rethrow;
    }
  }

  Future<void> register({
    required String fullName,
    required String email,
    required String password,
    String role = 'COURIER',
    String? phone,
  }) =>
      _repository.register(
        fullName: fullName,
        email: email,
        password: password,
        role: role,
        phone: phone,
      );

  Future<void> verifyEmail({required String email, required String code}) async {
    final tokens = await _repository.verifyEmail(email: email, code: code);
    await completeLogin(accessToken: tokens.access, refreshToken: tokens.refresh);
  }

  Future<void> resendVerification(String email) =>
      _repository.resendVerification(email);

  Future<void> forgotPassword(String email) =>
      _repository.forgotPassword(email);

  Future<void> resetPassword({
    required String email,
    required String code,
    required String password,
  }) =>
      _repository.resetPassword(email: email, code: code, password: password);

  Future<void> completeLogin({
    required String accessToken,
    required String refreshToken,
  }) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      final user = await _repository.completeLogin(
        accessToken: accessToken,
        refreshToken: refreshToken,
      );
      final next = Authenticated(user);
      await _onStateChanged(next);
      return next;
    });
  }

  Future<void> refreshUser() async {
    final current = state.valueOrNull;
    if (current is! Authenticated) return;
    final user = await _repository.fetchMe();
    state = AsyncData(Authenticated(user));
  }

  Future<void> logout() async {
    await _repository.logout();
    ref.read(realtimeClientProvider).disconnect();
    state = const AsyncData(Unauthenticated());
  }

  Future<void> _onStateChanged(AuthState next) async {
    final realtime = ref.read(realtimeClientProvider);
    switch (next) {
      case Authenticated():
        final token = await _repository.accessToken();
        if (token != null) realtime.connect(token);
        unawaited(_registerPushToken());
      case Unauthenticated():
        realtime.disconnect();
    }
  }

  Future<void> _registerPushToken() async {
    final push = ref.read(pushServiceProvider);
    if (!push.isAvailable) return;
    if (!await push.requestPermission()) return;
    final token = await push.getToken();
    if (token != null) await _repository.registerDevice(token);
  }
}

final authStateProvider =
    AsyncNotifierProvider<AuthNotifier, AuthState>(AuthNotifier.new);

final currentUserProvider = Provider<CourierUser?>((ref) {
  final auth = ref.watch(authStateProvider);
  return switch (auth) {
    AsyncData(value: Authenticated(:final user)) => user,
    _ => null,
  };
});

final isAuthenticatedProvider = Provider<bool>(
  (ref) => ref.watch(currentUserProvider) != null,
);
