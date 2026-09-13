import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';
import '../../../core/network/realtime_client.dart';
import '../../../core/utils/json_parse.dart';
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

  /// Lista paginada y filtrable por fecha de los pedidos del usuario
  /// autenticado (courier: sus propios pedidos; company: los de su cuenta).
  Future<Map<String, dynamic>> fetchJobs({
    String? status,
    DateTime? from,
    DateTime? to,
    int page = 1,
    int pageSize = 20,
  }) async {
    final response = await _api.dio.get<Map<String, dynamic>>('/jobs', queryParameters: {
      if (status != null) 'status': status,
      if (from != null) 'from': from.toIso8601String(),
      if (to != null) 'to': to.toIso8601String(),
      'page': page,
      'pageSize': pageSize,
    });
    return response.data ?? const {};
  }

  Future<List<Job>> fetchMine() async {
    final response = await _api.dio.get<dynamic>('/jobs', queryParameters: {'pageSize': 20});
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

  /// Crea un envío (rol COMPANY). [pickup]/[dropoff] deben incluir line1/city/lat/lng.
  Future<Job> create({
    required Map<String, dynamic> pickup,
    required Map<String, dynamic> dropoff,
    required double price,
    String? notes,
    String? packageType,
    double? weightKg,
    Map<String, dynamic>? dimensions,
    bool? fragile,
    bool? refrigerated,
    String priority = 'standard',
    Map<String, dynamic>? priceBreakdown,
    double? durationSeconds,
  }) async {
    final response = await _api.dio.post<dynamic>('/jobs', data: {
      'pickup': pickup,
      'dropoff': dropoff,
      'price': price,
      if (notes != null) 'notes': notes,
      if (packageType != null) 'packageType': packageType,
      if (weightKg != null) 'weightKg': weightKg,
      if (dimensions != null) 'dimensions': dimensions,
      if (fragile != null) 'fragile': fragile,
      if (refrigerated != null) 'refrigerated': refrigerated,
      'priority': priority,
      if (priceBreakdown != null) 'priceBreakdown': priceBreakdown,
      if (durationSeconds != null) 'durationSeconds': durationSeconds,
    });
    return Job.fromJson(_unwrap(response.data));
  }

  Future<Map<String, dynamic>> priceEstimate({
    required double pickupLat,
    required double pickupLng,
    required double dropoffLat,
    required double dropoffLng,
    double? weightKg,
    String priority = 'standard',
  }) async {
    final response = await _api.dio.get<Map<String, dynamic>>('/jobs/price-estimate', queryParameters: {
      'pickupLat': pickupLat,
      'pickupLng': pickupLng,
      'dropoffLat': dropoffLat,
      'dropoffLng': dropoffLng,
      if (weightKg != null) 'weightKg': weightKg,
      'priority': priority,
    });
    return response.data ?? const {};
  }

  /// Historial de envíos entregados (rol COMPANY), con estadísticas agregadas
  /// sobre todo el rango filtrado (no solo la página actual).
  Future<({List<Job> items, int total, int page, int pageSize, int totalCount, double totalSpend})> history({
    String? search,
    DateTime? from,
    DateTime? to,
    int page = 1,
    int pageSize = 20,
  }) async {
    final response = await _api.dio.get<Map<String, dynamic>>('/jobs/history', queryParameters: {
      if (search != null && search.isNotEmpty) 'search': search,
      if (from != null) 'from': from.toIso8601String(),
      if (to != null) 'to': to.toIso8601String(),
      'page': page,
      'pageSize': pageSize,
    });
    final data = response.data ?? const {};
    final stats = data['stats'] is Map ? Map<String, dynamic>.from(data['stats']) : const {};
    return (
      items: _parseList(data['items']),
      total: asInt(data['total']),
      page: asInt(data['page'], 1),
      pageSize: asInt(data['pageSize'], pageSize),
      totalCount: asInt(stats['totalCount']),
      totalSpend: asDouble(stats['totalSpend']),
    );
  }

  /// Company califica al repartidor tras la entrega.
  Future<Job> rate(String id, {required int score, String? comment}) async {
    final response = await _api.dio.post<dynamic>('/jobs/$id/rate', data: {
      'score': score,
      if (comment != null) 'comment': comment,
    });
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
