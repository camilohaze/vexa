import { Injectable } from '@angular/core';
import { GeoPoint } from '@vexa/shared';

const EARTH_RADIUS_METERS = 6_371_000;

@Injectable({ providedIn: 'root' })
export class GeoService {
  haversineMeters(a: GeoPoint, b: GeoPoint): number {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const h =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
    return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(h));
  }

  boundsFor(points: GeoPoint[]): { min: GeoPoint; max: GeoPoint } | null {
    if (!points.length) return null;
    return {
      min: {
        lat: Math.min(...points.map((p) => p.lat)),
        lng: Math.min(...points.map((p) => p.lng)),
      },
      max: {
        lat: Math.max(...points.map((p) => p.lat)),
        lng: Math.max(...points.map((p) => p.lng)),
      },
    };
  }
}
