import 'package:dio/dio.dart';
import 'package:geolocator/geolocator.dart';

import '../../../core/config/env.dart';
import '../domain/job.dart';

class RouteStep {
  const RouteStep({required this.instruction, required this.distanceMeters, required this.durationSeconds});

  final String instruction;
  final double distanceMeters;
  final double durationSeconds;
}

class RouteInfo {
  const RouteInfo({
    required this.distanceMeters,
    required this.durationSeconds,
    this.steps = const [],
    this.geometry,
  });

  final double distanceMeters;
  final double durationSeconds;
  final List<RouteStep> steps;
  final List<Map<String, double>>? geometry;
}

class DirectionsRepository {
  const DirectionsRepository({required Dio dio}) : _dio = dio;

  final Dio _dio;

  Future<RouteInfo> fetchRoute(Address target) async {
    final permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      final request = await Geolocator.requestPermission();
      if (request == LocationPermission.denied || request == LocationPermission.deniedForever) {
        throw Exception('Permiso de ubicación denegado');
      }
    }
    if (permission == LocationPermission.deniedForever) {
      throw Exception('Permiso de ubicación denegado permanentemente');
    }
    final position = await Geolocator.getCurrentPosition();
    final token = Env.mapboxToken;
    if (token.isEmpty) throw Exception('No hay token de Mapbox');
    final origin = '${position.longitude},${position.latitude}';
    final dest = '${target.lng},${target.lat}';
    final url = 'https://api.mapbox.com/directions/v5/mapbox/driving/$origin;$dest?'
        'access_token=$token&geometries=geojson&overview=full&steps=true';
    final response = await _dio.get<Map<String, dynamic>>(url);
    final data = response.data?['routes'] as List<dynamic>?;
    if (data == null || data.isEmpty) throw Exception('No se encontró ruta');
    final route = data.first as Map<String, dynamic>;
    final steps = <RouteStep>[];
    final legs = route['legs'] as List<dynamic>?;
    if (legs != null) {
      for (final leg in legs) {
        final legSteps = (leg as Map<String, dynamic>)['steps'] as List<dynamic>?;
        if (legSteps != null) {
          for (final s in legSteps) {
            final step = s as Map<String, dynamic>;
            final maneuver = step['maneuver'] as Map<String, dynamic>?;
            steps.add(RouteStep(
              instruction: maneuver?['instruction'] as String? ?? (step['name'] as String? ?? 'Continúa'),
              distanceMeters: ((step['distance'] as num?)?.toDouble() ?? 0),
              durationSeconds: ((step['duration'] as num?)?.toDouble() ?? 0),
            ));
          }
        }
      }
    }
    final coords = (route['geometry']?['coordinates'] as List<dynamic>?)
        ?.map((c) => <String, double>{'lng': (c[0] as num).toDouble(), 'lat': (c[1] as num).toDouble()})
        .toList();
    return RouteInfo(
      distanceMeters: ((route['distance'] as num?)?.toDouble() ?? 0),
      durationSeconds: ((route['duration'] as num?)?.toDouble() ?? 0),
      steps: steps,
      geometry: coords,
    );
  }
}
