import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/config/env.dart';

class GeocodeResult {
  const GeocodeResult({
    required this.line1,
    required this.city,
    required this.lat,
    required this.lng,
  });

  final String line1;
  final String city;
  final double lat;
  final double lng;
}

/// Geocodificación directa contra Mapbox (misma API que usa el portal web),
/// usada solo por el flujo de creación de envío (recogida/destino).
class GeocodingRepository {
  final Dio _dio = Dio();

  Future<List<GeocodeResult>> search(String query) async {
    if (!Env.hasMapbox || query.trim().length < 3) return const [];
    final response = await _dio.get<Map<String, dynamic>>(
      'https://api.mapbox.com/geocoding/v5/mapbox.places/${Uri.encodeComponent(query)}.json',
      queryParameters: {
        'access_token': Env.mapboxToken,
        'language': 'es',
        'limit': 5,
        'types': 'address,place,poi',
      },
    );
    final features = response.data?['features'] as List? ?? const [];
    return features.whereType<Map>().map((f) {
      final center = f['center'] as List? ?? const [0, 0];
      final context = (f['context'] as List? ?? const []).whereType<Map>();
      final city = context
          .firstWhere((c) => (c['id'] as String? ?? '').startsWith('place'),
              orElse: () => const {})['text'] as String?;
      return GeocodeResult(
        line1: f['place_name'] as String? ?? '',
        city: city ?? '',
        lng: (center[0] as num).toDouble(),
        lat: (center[1] as num).toDouble(),
      );
    }).toList();
  }
}

final geocodingRepositoryProvider = Provider<GeocodingRepository>((ref) => GeocodingRepository());
