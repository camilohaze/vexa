import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../config/env.dart';
import '../storage/secure_storage.dart';

class ApiClient {
  ApiClient({required SecureStorage storage, Dio? dio})
      : _storage = storage,
        dio = dio ??
            Dio(
              BaseOptions(
                baseUrl: Env.apiUrl,
                connectTimeout: const Duration(seconds: 15),
                receiveTimeout: const Duration(seconds: 30),
                headers: {'Accept': 'application/json'},
              ),
            ) {
    this.dio.interceptors.add(
          QueuedInterceptorsWrapper(
            onRequest: _onRequest,
            onError: _onError,
          ),
        );
  }

  static const _retriedKey = 'vexa.retried';

  final Dio dio;
  final SecureStorage _storage;

  Future<void> _onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    final token = await _storage.readAccessToken();
    if (token != null && token.isNotEmpty) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    handler.next(options);
  }

  Future<void> _onError(
    DioException error,
    ErrorInterceptorHandler handler,
  ) async {
    final alreadyRetried = error.requestOptions.extra[_retriedKey] == true;
    if (error.response?.statusCode != 401 || alreadyRetried) {
      handler.next(error);
      return;
    }

    final newToken = await refreshTokens();
    if (newToken == null) {
      handler.next(error);
      return;
    }

    final options = error.requestOptions
      ..extra[_retriedKey] = true
      ..headers['Authorization'] = 'Bearer $newToken';

    try {
      final response = await dio.fetch<dynamic>(options);
      handler.resolve(response);
    } on DioException catch (retryError) {
      handler.next(retryError);
    }
  }

  Future<String?> refreshTokens() async {
    final refreshToken = await _storage.readRefreshToken();
    if (refreshToken == null || refreshToken.isEmpty) return null;

    try {
      final response = await Dio(BaseOptions(baseUrl: dio.options.baseUrl))
          .post<Map<String, dynamic>>(
        '/auth/refresh',
        data: {'refreshToken': refreshToken},
      );
      final data = response.data;
      final access = data?['accessToken'] as String?;
      final refresh = data?['refreshToken'] as String? ?? refreshToken;
      if (access == null || access.isEmpty) return null;
      await _storage.saveTokens(accessToken: access, refreshToken: refresh);
      return access;
    } on DioException {
      await _storage.clear();
      return null;
    }
  }
}

final apiClientProvider = Provider<ApiClient>(
  (ref) => ApiClient(storage: ref.watch(secureStorageProvider)),
);
