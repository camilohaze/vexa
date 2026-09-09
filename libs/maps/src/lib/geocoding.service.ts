import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { HttpClient } from '@angular/common/http';

export interface GeocodingResult {
  line1: string;
  city: string;
  lat: number;
  lng: number;
}

/** Geocodificación directa contra la API de Mapbox (sin SDK extra). */
@Injectable({ providedIn: 'root' })
export class GeocodingService {
  constructor(private readonly http: HttpClient) {}

  search(query: string, token: string, proximity?: { lat: number; lng: number }): Observable<GeocodingResult[]> {
    const params = new URLSearchParams({
      access_token: token,
      language: 'es',
      limit: '5',
      types: 'address,place,poi',
      ...(proximity ? { proximity: `${proximity.lng},${proximity.lat}` } : {}),
    });
    return this.http
      .get<{ features: MapboxFeature[] }>(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?${params}`
      )
      .pipe(
        map((res) =>
          res.features.map((f) => ({
            line1: f.place_name,
            city: f.context?.find((c) => c.id.startsWith('place'))?.text ?? '',
            lng: f.center[0],
            lat: f.center[1],
          }))
        )
      );
  }
}

interface MapboxFeature {
  place_name: string;
  center: [number, number];
  context?: { id: string; text: string }[];
}
