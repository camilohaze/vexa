import 'package:url_launcher/url_launcher.dart';

import '../../features/jobs/domain/job.dart';

/// Abre la navegación turn-by-turn hacia [target] en la app de Google Maps
/// del dispositivo (o en el navegador si no está instalada), en vez de
/// calcular y renderizar la ruta dentro de Vexa. Evita una carga de mapa
/// Mapbox y una llamada a Directions por cada entrega.
Future<bool> openExternalNavigation(Address target) {
  final uri = Uri.https('www.google.com', '/maps/dir/', {
    'api': '1',
    'destination': '${target.lat},${target.lng}',
    'travelmode': 'driving',
  });
  return launchUrl(uri, mode: LaunchMode.externalApplication);
}
