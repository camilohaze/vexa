import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';

import '../../../core/network/api_client.dart';
import '../../../core/storage/secure_storage.dart';
import '../domain/auth_state.dart';
import '../domain/courier_user.dart';

class AuthRepository {
  AuthRepository({required ApiClient api, required SecureStorage storage})
      : _api = api,
        _storage = storage;

  final ApiClient _api;
  final SecureStorage _storage;

  Uri loginUri(AuthProvider provider) {
    final base = Uri.parse(_api.dio.options.baseUrl);
    final basePath = base.path.endsWith('/')
        ? base.path.substring(0, base.path.length - 1)
        : base.path;
    return base.replace(
      path: '$basePath/auth/${provider.path}',
      queryParameters: {'client': 'mobile'},
    );
  }

  /// 403 = cuenta sin verificar (se envió OTP al correo).
  Future<({String access, String refresh})> loginWithPassword({
    required String email,
    required String password,
  }) async {
    final response = await _api.dio.post<Map<String, dynamic>>(
      '/auth/login',
      data: {'email': email, 'password': password},
    );
    return (
      access: response.data?['accessToken'] as String? ?? '',
      refresh: response.data?['refreshToken'] as String? ?? '',
    );
  }

  Future<void> register({
    required String fullName,
    required String email,
    required String password,
    required String role,
    String? phone,
  }) async {
    await _api.dio.post<void>(
      '/auth/register',
      data: {
        'fullName': fullName,
        'email': email,
        'password': password,
        'role': role,
        'phone': phone,
        'acceptTerms': true,
      },
    );
  }

  Future<({String access, String refresh})> verifyEmail({
    required String email,
    required String code,
  }) async {
    final response = await _api.dio.post<Map<String, dynamic>>(
      '/auth/verify-email',
      data: {'email': email, 'code': code},
    );
    return (
      access: response.data?['accessToken'] as String? ?? '',
      refresh: response.data?['refreshToken'] as String? ?? '',
    );
  }

  Future<void> resendVerification(String email) async {
    await _api.dio
        .post<void>('/auth/resend-verification', data: {'email': email});
  }

  Future<void> forgotPassword(String email) async {
    await _api.dio.post<void>('/auth/forgot-password', data: {'email': email});
  }

  Future<void> resetPassword({
    required String email,
    required String code,
    required String password,
  }) async {
    await _api.dio.post<void>(
      '/auth/reset-password',
      data: {'email': email, 'code': code, 'password': password},
    );
  }

  Future<CourierUser> completeLogin({
    required String accessToken,
    required String refreshToken,
  }) async {
    await _storage.saveTokens(
      accessToken: accessToken,
      refreshToken: refreshToken,
    );
    return fetchMe();
  }

  Future<AuthState> restoreSession() async {
    final tokens = await _storage.readTokens();
    if (tokens == null) return const Unauthenticated();

    try {
      return Authenticated(await fetchMe());
    } on DioException catch (error) {
      final status = error.response?.statusCode;
      if (status == 401 || status == 403) {
        await _storage.clear();
        return const Unauthenticated();
      }
      debugPrint('Auth: session restore failed offline ($error)');
      return const Unauthenticated();
    }
  }

  Future<CourierUser> fetchMe() async {
    final response = await _api.dio.get<Map<String, dynamic>>('/users/me');
    return CourierUser.fromJson(response.data ?? const {});
  }

  Future<String?> refresh() => _api.refreshTokens();

  Future<void> logout() async {
    try {
      await _api.dio.post<void>('/auth/logout');
    } catch (error) {
      debugPrint('Auth: remote logout skipped ($error)');
    } finally {
      await _storage.clear();
    }
  }

  Future<String?> accessToken() => _storage.readAccessToken();

  Future<void> registerDevice(String fcmToken) async {
    try {
      await _api.dio.patch<void>(
        '/couriers/me/fcm-token',
        data: {'fcmToken': fcmToken},
      );
    } catch (error) {
      debugPrint('Auth: device registration failed ($error)');
    }
  }
}
