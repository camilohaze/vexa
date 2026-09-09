import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';
import type mapboxgl from 'mapbox-gl';
import { GeoPoint } from '@vexa/shared';
import { MAPBOX_ACCESS_TOKEN } from '../mapbox.config';
import { MapMarker } from '../models/map-marker';

@Component({
  selector: 'vexa-map',
  imports: [],
  template: `
    @if (!hasToken) {
      <div class="vexa-map__fallback">
        Configura MAPBOX_ACCESS_TOKEN para mostrar el mapa
      </div>
    }
    <div #container class="vexa-map__container"></div>
  `,
  styles: `
    :host { display: block; position: relative; min-height: 320px; }
    .vexa-map__container { position: absolute; inset: 0; border-radius: 12px; }
    .vexa-map__fallback {
      position: absolute; inset: 0; z-index: 1; display: flex;
      align-items: center; justify-content: center;
      background: var(--mat-sys-surface-container-high);
      border-radius: 12px; color: var(--mat-sys-on-surface-variant);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Map {
  center = input<GeoPoint>({ lat: 4.711, lng: -74.0721 });
  zoom = input(12);
  style = input('mapbox://styles/mapbox/streets-v12');
  markers = input<MapMarker[]>([]);
  markerClick = output<MapMarker>();

  private readonly container = viewChild.required<ElementRef<HTMLElement>>('container');
  private readonly token = inject(MAPBOX_ACCESS_TOKEN, { optional: true });
  private readonly markersById = new globalThis.Map<string, mapboxgl.Marker>();
  private mapboxgl?: typeof import('mapbox-gl').default;
  private map?: mapboxgl.Map;

  protected readonly hasToken = !!this.token;

  constructor() {
    afterNextRender(async () => {
      if (!this.token) return;
      this.mapboxgl = (await import('mapbox-gl')).default;
      this.mapboxgl.accessToken = this.token;
      this.map = new this.mapboxgl.Map({
        container: this.container().nativeElement,
        style: this.style(),
        center: [this.center().lng, this.center().lat],
        zoom: this.zoom(),
      });
      this.map.addControl(new this.mapboxgl.NavigationControl(), 'top-right');
      this.syncMarkers(this.markers());
    });

    effect(() => {
      if (!this.map) return;
      const { lat, lng } = this.center();
      this.map.easeTo({ center: [lng, lat] });
    });

    effect(() => this.syncMarkers(this.markers()));

    inject(DestroyRef).onDestroy(() => {
      this.markersById.forEach((marker) => marker.remove());
      this.markersById.clear();
      this.map?.remove();
    });
  }

  private syncMarkers(markers: MapMarker[]) {
    const map = this.map;
    const mapboxgl = this.mapboxgl;
    if (!map || !mapboxgl) return;
    const incoming = new globalThis.Map(markers.map((m) => [m.id, m]));
    this.markersById.forEach((marker, id) => {
      if (!incoming.has(id)) {
        marker.remove();
        this.markersById.delete(id);
      }
    });
    incoming.forEach((model, id) => {
      const existing = this.markersById.get(id);
      if (existing) {
        existing.setLngLat([model.lng, model.lat]);
        return;
      }
      const marker = new mapboxgl.Marker({ color: model.color ?? '#1b5e20' })
        .setLngLat([model.lng, model.lat])
        .addTo(map);
      if (model.label) {
        marker.setPopup(new mapboxgl.Popup({ offset: 24 }).setText(model.label));
      }
      marker.getElement().addEventListener('click', () => this.markerClick.emit(model));
      this.markersById.set(id, marker);
    });
  }
}
