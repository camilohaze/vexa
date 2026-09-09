import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';
import '../../../core/network/realtime_client.dart';
import '../domain/job.dart';

class JobsRepository {
  JobsRepository({required ApiClient api, required RealtimeClient realtime})
      : _api = api,
        _realtime = realtime;

  final ApiClient _api;
  final RealtimeClient _realtime;

  Stream<Job> get newJobs => _realtime.newJobs
      .where((event) => event['job'] is Map)
      .map((event) => Job.fromJson(_asMap(event['job'])));

  Stream<String> get cancelledJobIds => _realtime.jobCancelled
      .map((event) => event['jobId'])
      .where((id) => id is String)
      .cast<String>();

  Stream<String> get acceptedElsewhereJobIds => _realtime.jobAccepted
      .map((event) => event['jobId'])
      .where((id) => id is String)
      .cast<String>();

  Future<List<Job>> fetchOffered() async {
    final response = await _api.dio.get<dynamic>(
      '/jobs',
      queryParameters: {'status': JobStatus.offered.value},
    );
    return _parseList(response.data);
  }

  Future<List<Job>> fetchMine() async {
    final response = await _api.dio.get<dynamic>('/jobs');
    return _parseList(response.data);
  }

  Future<Job> fetchById(String id) async {
    final response = await _api.dio.get<dynamic>('/jobs/$id');
    return Job.fromJson(_unwrap(response.data));
  }

  Future<Job> accept(String id) async {
    final response = await _api.dio.post<dynamic>('/jobs/$id/accept');
    return Job.fromJson(_unwrap(response.data));
  }

  Future<Job> pickUp(String id) async {
    final response = await _api.dio.patch<dynamic>('/jobs/$id/pickup');
    return Job.fromJson(_unwrap(response.data));
  }

  Stream<JsonMap> get jobMessages => _realtime.jobMessages;

  void subscribeJob(String jobId) =>
      _realtime.emit('JOB_SUBSCRIBE', {'jobId': jobId});

  Future<List<JsonMap>> fetchMessages(String jobId) async {
    final response = await _api.dio.get<dynamic>('/jobs/$jobId/messages');
    final raw = response.data;
    if (raw is List) return raw.whereType<Map>().map(_asMap).toList();
    return const [];
  }

  Future<void> sendMessage(String jobId, String body) =>
      _api.dio.post<dynamic>('/jobs/$jobId/messages', data: {'body': body});

  Future<String?> fetchReceiptUrl(String id) async {
    final response = await _api.dio.get<Map<String, dynamic>>('/jobs/$id/receipt');
    return response.data?['url'] as String?;
  }

  Future<Job> complete(String id, {String? proofOfDeliveryUrl}) async {
    final response = await _api.dio.post<dynamic>(
      '/jobs/$id/complete',
      data: {
        if (proofOfDeliveryUrl != null) 'proofOfDeliveryUrl': proofOfDeliveryUrl,
      },
    );
    return Job.fromJson(_unwrap(response.data));
  }

  static List<Job> _parseList(dynamic data) {
    List<dynamic> raw = const [];
    if (data is List) {
      raw = data;
    } else if (data is Map && data['items'] is List) {
      raw = data['items'] as List;
    } else if (data is Map && data['data'] is List) {
      raw = data['data'] as List;
    }
    return raw
        .whereType<Map>()
        .map((item) => Job.fromJson(_asMap(item)))
        .toList();
  }

  static Map<String, dynamic> _unwrap(dynamic data) {
    final map = _asMap(data);
    if (map['data'] is Map && map['id'] == null) return _asMap(map['data']);
    if (map['job'] is Map && map['id'] == null) return _asMap(map['job']);
    return map;
  }

  static Map<String, dynamic> _asMap(Object? raw) =>
      raw is Map ? Map<String, dynamic>.from(raw) : const {};
}

final jobsRepositoryProvider = Provider<JobsRepository>(
  (ref) => JobsRepository(
    api: ref.watch(apiClientProvider),
    realtime: ref.watch(realtimeClientProvider),
  ),
);
