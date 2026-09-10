import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface LatLng {
  lat: number;
  lng: number;
}

export interface RouteInfo {
  distanceMeters: number;
  durationSeconds: number;
  /** true si la duración viene de Mapbox con tráfico en tiempo real; false si es un estimado por línea recta. */
  trafficAware: boolean;
}

/** Velocidad urbana promedio usada solo cuando no hay MAPBOX_TOKEN configurado. */
const FALLBACK_SPEED_KMH = 25;

@Injectable()
export class DirectionsService {
  private readonly logger = new Logger(DirectionsService.name);

  constructor(private readonly config: ConfigService) {}

  /** Ruta real (distancia + duración con tráfico) entre dos puntos. Cae a línea recta si Mapbox no está configurado o falla. */
  async route(pickup: LatLng, dropoff: LatLng): Promise<RouteInfo> {
    const token = this.config.get<string>('MAPBOX_TOKEN');
    if (token) {
      try {
        return await this.fetchMapboxRoute(pickup, dropoff, token);
      } catch (err) {
        this.logger.warn(`Mapbox Directions falló, usando estimado por línea recta: ${(err as Error).message}`);
      }
    }
    return this.haversineFallback(pickup, dropoff);
  }

  private async fetchMapboxRoute(pickup: LatLng, dropoff: LatLng, token: string): Promise<RouteInfo> {
    const coords = `${pickup.lng},${pickup.lat};${dropoff.lng},${dropoff.lat}`;
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving-traffic/${coords}?access_token=${token}&overview=false`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Mapbox respondió ${res.status}`);
    const data = (await res.json()) as { routes?: { distance: number; duration: number }[] };
    const route = data.routes?.[0];
    if (!route) throw new Error('Sin ruta disponible entre los puntos dados');
    return {
      distanceMeters: Math.round(route.distance),
      durationSeconds: Math.round(route.duration),
      trafficAware: true,
    };
  }

  private haversineFallback(pickup: LatLng, dropoff: LatLng): RouteInfo {
    const rad = Math.PI / 180;
    const dLat = (dropoff.lat - pickup.lat) * rad;
    const dLng = (dropoff.lng - pickup.lng) * rad;
    const h =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(pickup.lat * rad) * Math.cos(dropoff.lat * rad) * Math.sin(dLng / 2) ** 2;
    const distanceMeters = Math.round(2 * 6_371_000 * Math.asin(Math.sqrt(h)));
    const durationSeconds = Math.round((distanceMeters / 1000 / FALLBACK_SPEED_KMH) * 3600);
    return { distanceMeters, durationSeconds, trafficAware: false };
  }
}
