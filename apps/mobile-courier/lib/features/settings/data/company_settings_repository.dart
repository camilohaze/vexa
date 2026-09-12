import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';
import '../domain/company_profile.dart';

class CompanySettingsRepository {
  CompanySettingsRepository({required ApiClient api}) : _api = api;

  final ApiClient _api;

  Future<CompanyProfile> getMe() async {
    final response = await _api.dio.get<Map<String, dynamic>>('/companies/me');
    return CompanyProfile.fromJson(response.data ?? const {});
  }

  Future<CompanySettings> settings() async {
    final response = await _api.dio.get<Map<String, dynamic>>('/companies/me/settings');
    return CompanySettings.fromJson(response.data ?? const {});
  }

  Future<CompanySettings> updateSettings({
    String? adminEmail,
    bool? twoFactor,
    String? language,
    String? currency,
    String? timezone,
    String? address,
  }) async {
    final response = await _api.dio.put<Map<String, dynamic>>(
      '/companies/me/settings',
      data: {
        if (adminEmail != null) 'adminEmail': adminEmail,
        if (twoFactor != null) 'twoFactor': twoFactor,
        if (language != null) 'language': language,
        if (currency != null) 'currency': currency,
        if (timezone != null) 'timezone': timezone,
        if (address != null) 'address': address,
      },
    );
    return CompanySettings.fromJson(response.data ?? const {});
  }
}

final companySettingsRepositoryProvider = Provider<CompanySettingsRepository>(
  (ref) => CompanySettingsRepository(api: ref.watch(apiClientProvider)),
);
