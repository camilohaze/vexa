import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';

class SupportRepository {
  SupportRepository({required ApiClient api}) : _api = api;

  final ApiClient _api;

  Future<List<Map<String, dynamic>>> fetchFaq() async {
    final response = await _api.dio.get<List<dynamic>>('/support/faq');
    return (response.data ?? const [])
        .whereType<Map>()
        .map(Map<String, dynamic>.from)
        .toList();
  }

  Future<Map<String, dynamic>> fetchHelp() async {
    final response = await _api.dio.get<Map<String, dynamic>>('/support/help');
    return response.data ?? const {'categories': [], 'articles': []};
  }

  Future<List<Map<String, dynamic>>> fetchLegal() async {
    final response = await _api.dio.get<List<dynamic>>('/support/legal');
    return (response.data ?? const [])
        .whereType<Map>()
        .map(Map<String, dynamic>.from)
        .toList();
  }
}

final supportRepositoryProvider = Provider<SupportRepository>(
  (ref) => SupportRepository(api: ref.watch(apiClientProvider)),
);
