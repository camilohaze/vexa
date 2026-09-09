import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Map as VexaMap, MapMarker } from '@vexa/maps';
import { CourierLocationEvent, SocketEvents } from '@vexa/shared';
import { PageHeader } from '@vexa/ui';
import { RealtimeService } from '../../core/realtime/realtime.service';

/** Figma: realtime-map — mapa de flota a pantalla completa con lista de repartidores. */
@Component({
  selector: 'vexa-realtime-map',
  imports: [DecimalPipe, MatIconModule, PageHeader, VexaMap],
  template: `
    <vexa-page-header title="Mapa de flota en vivo" />
    <div class="fleet">
      <div class="side vexa-card">
        <h3 class="vexa-overline">Repartidores activos ({{ list().length }})</h3>
        <div class="legend">
          <span><i class="dot" style="background:#1d4ed8"></i> En tránsito</span>
          <span><i class="dot" style="background:#f59e0b"></i> Esperando</span>
          <span><i class="dot" style="background:#9ca3af"></i> Offline</span>
        </div>
        @for (c of list(); track c.courierId) {
          <div class="row">
            <span class="row__dot"></span>
            <div>
              <strong>Repartidor #{{ c.courierId.slice(0, 8) }}</strong>
              <small>{{ c.lat | number:'1.4-4' }}, {{ c.lng | number:'1.4-4' }}</small>
            </div>
          </div>
        } @empty {
          <p class="muted">Sin repartidores transmitiendo ubicación.</p>
        }
      </div>
      <div class="map vexa-card">
        <vexa-map [markers]="markers()" />
      </div>
    </div>
  `,
  styles: `
    .fleet { display: grid; grid-template-columns: 300px 1fr; gap: 16px; height: calc(100vh - 160px); }
    @media (max-width: 900px) { .fleet { grid-template-columns: 1fr; height: auto; } .map { height: 480px; } }
    .side { padding: 16px; overflow: auto; }
    .legend { display: flex; gap: 12px; font-size: 11px; color: var(--vexa-gray-500); margin: 8px 0 12px; }
    .dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 4px; }
    .row { display: flex; gap: 10px; align-items: center; padding: 10px 0; border-top: 1px solid var(--vexa-gray-100); }
    .row__dot { width: 10px; height: 10px; border-radius: 50%; background: var(--vexa-primary-600); }
    .row small { display: block; color: var(--vexa-gray-500); font-size: 11px; }
    .map { overflow: hidden; padding: 0; }
    .map vexa-map { height: 100%; }
    .muted { color: var(--vexa-gray-500); }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RealtimeMap {
  private readonly realtime = inject(RealtimeService);
  private readonly locations = signal(new Map<string, CourierLocationEvent>());

  protected readonly list = computed(() => [...this.locations().values()]);
  protected readonly markers = computed<MapMarker[]>(() =>
    this.list().map((c) => ({
      id: c.courierId,
      lat: c.lat,
      lng: c.lng,
      label: `#${c.courierId.slice(0, 8)}`,
    })),
  );

  constructor() {
    this.realtime.on(SocketEvents.COURIER_LOCATION).subscribe((loc) =>
      this.locations.update((m) => new Map(m).set(loc.courierId, loc)),
    );
  }
}
