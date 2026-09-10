import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { Map as VexaMap, MapMarker } from '@vexa/maps';
import { Job, JobStatus, SocketEvents } from '@vexa/shared';
import { StatusChip, Timeline, TimelineStep } from '@vexa/ui';
import { ApiService } from '../../core/api/api.service';
import { RealtimeService } from '../../core/realtime/realtime.service';
import { JobsService } from './jobs.service';

/** Figma: web-delivery-tracking */
@Component({
  selector: 'vexa-job-tracking',
  imports: [DecimalPipe, MatIconModule, RouterLink, StatusChip, Timeline, VexaMap],
  template: `
    <div class="tracking">
      <div class="telemetry">
        <div class="vexa-card info-card">
          <div class="info-card__top">
            <span class="job-id">#{{ id().slice(0, 8).toUpperCase() }}</span>
            <vexa-status-chip [status]="job()?.status ?? JobStatus.PENDING" />
          </div>
          <hr />
          <div class="courier-brief">
            <div class="courier-brief__avatar"><mat-icon>person</mat-icon></div>
            <div class="courier-brief__info">
              <span class="courier-brief__name">{{ courierProfile()?.name ?? 'Repartidor por asignar' }}</span>
              <span class="courier-brief__meta">Socio Vexa</span>
            </div>
          </div>
          <hr />
          <div class="eta-row">
            <div>
              <span class="vexa-overline">Entrega estimada</span>
              <strong>{{ etaLabel() }}</strong>
            </div>
            <div class="eta-row__progress">
              <span class="vexa-overline">Progreso</span>
              <strong class="progress-pct">{{ progress() }}% completado</strong>
            </div>
          </div>
          <div class="progress-track">
            <div class="progress-track__fill" [style.width.%]="progress()"></div>
          </div>
        </div>

        <div class="vexa-card timeline-card">
          <h3 class="vexa-h5">Historial del envío</h3>
          <vexa-timeline [steps]="timeline()" />
        </div>

        @if (job()?.status === 'DELIVERED') {
          <div class="vexa-card">
            <h3 class="vexa-h5">Especificaciones del paquete</h3>
            <div class="spec-grid">
              <div class="spec"><span class="vexa-overline">Tipo</span><strong>{{ job()?.packageType || '—' }}</strong></div>
              <div class="spec"><span class="vexa-overline">Peso</span><strong>{{ job()?.weightKg ? job()?.weightKg + ' kg' : '—' }}</strong></div>
              @if (job()?.dimensions; as d) {
                <div class="spec"><span class="vexa-overline">Dimensiones</span><strong>{{ d.l }} × {{ d.w }} × {{ d.h }} cm</strong></div>
              }
              @if (job()?.declaredValue) {
                <div class="spec"><span class="vexa-overline">Valor declarado</span><strong>{{ job()?.declaredValue | number: '1.0-0' }} COP</strong></div>
              }
            </div>
            @if (job()?.fragile || job()?.refrigerated) {
              <div class="spec-tags">
                @if (job()?.fragile) { <span class="tag">Frágil</span> }
                @if (job()?.refrigerated) { <span class="tag">Temperatura controlada</span> }
              </div>
            }
          </div>

          <div class="vexa-card">
            <h3 class="vexa-h5">Prueba de entrega</h3>
            @if (job()?.proofOfDeliveryUrl; as pod) {
              <img class="pod" [src]="pod" alt="Prueba de entrega" />
            } @else {
              <p class="muted">Sin evidencia cargada.</p>
            }
            @if (job()?.podSignedBy; as signer) {
              <p class="signed-by">Firmado por: <strong>{{ signer }}</strong></p>
            }
          </div>

          @if (courierProfile(); as cp) {
            <div class="vexa-card">
              <h3 class="vexa-h5">Repartidor asignado</h3>
              <div class="courier-card">
                <div class="courier-card__avatar">
                  @if (cp.avatarUrl) {
                    <img [src]="cp.avatarUrl" alt="" />
                  } @else {
                    <mat-icon>person</mat-icon>
                  }
                </div>
                <div class="courier-card__info">
                  <strong>{{ cp.name }}</strong>
                  <div class="courier-card__meta">
                    <mat-icon class="star">star</mat-icon>
                    {{ cp.rating | number: '1.1-1' }} ({{ cp.totalJobs }} entregas)
                  </div>
                  @if (cp.vehicleDetails; as vd) {
                    @if (vd.make || vd.plate) {
                      <div class="courier-card__vehicle">
                        {{ vd.make }}
                        @if (vd.plate) { ({{ vd.plate }}) }
                      </div>
                    }
                  }
                </div>
              </div>
            </div>
          }

          <div class="vexa-card">
            <h3 class="vexa-h5">Desglose de facturación</h3>
            @if (job()?.priceBreakdown; as b) {
              <div class="cost"><span>Tarifa base</span><span>{{ b.base | number: '1.0-0' }} COP</span></div>
              <div class="cost"><span>Distancia</span><span>{{ b.distance | number: '1.0-0' }} COP</span></div>
              <div class="cost"><span>Tiempo</span><span>{{ b.time | number: '1.0-0' }} COP</span></div>
              @if (b.weight) {
                <div class="cost"><span>Peso</span><span>{{ b.weight | number: '1.0-0' }} COP</span></div>
              }
              @if (b.priorityMultiplier !== 1) {
                <div class="cost"><span>Prioridad</span><span>×{{ b.priorityMultiplier }}</span></div>
              }
              @if (b.demandMultiplier && b.demandMultiplier !== 1) {
                <div class="cost"><span>Demanda alta en la zona</span><span>×{{ b.demandMultiplier }}</span></div>
              }
              <div class="cost"><span>Comisión plataforma</span><span>{{ b.commission | number: '1.0-0' }} COP</span></div>
            }
            <div class="cost cost--total"><span>Total</span><span>{{ job()?.price | number: '1.0-0' }} COP</span></div>
            <a class="rate-btn" [routerLink]="['/jobs', id(), 'rate']">Calificar repartidor</a>
          </div>
        }
      </div>

      <div class="vexa-card map-panel">
        <vexa-map [markers]="markers()" [center]="center()" />
        @if (job(); as j) {
          <div class="map-address-panel">
            <div class="route-node">
              <span class="route-node__dot route-node__dot--pickup"></span>
              <span>{{ j.pickup.line1 }}, {{ j.pickup.city }}</span>
            </div>
            <hr />
            <div class="route-node">
              <span class="route-node__dot route-node__dot--dest"></span>
              <span>{{ j.dropoff.line1 }}, {{ j.dropoff.city }}</span>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: `
    .tracking { display: flex; gap: 24px; align-items: flex-start; }
    .telemetry { display: flex; flex-direction: column; gap: 24px; width: 440px; flex: none; }
    @media (max-width: 1100px) { .tracking { flex-direction: column; } .telemetry { width: 100%; } }

    .info-card { display: flex; flex-direction: column; gap: 16px; }
    .info-card__top { display: flex; align-items: center; justify-content: space-between; }
    .job-id { font-size: 20px; font-weight: 700; color: var(--vexa-gray-900); }
    hr { border: none; border-top: 1px solid var(--vexa-gray-200); margin: 0; width: 100%; }

    .courier-brief { display: flex; align-items: center; gap: 12px; }
    .courier-brief__avatar {
      width: 48px; height: 48px; border-radius: 50%; flex: none;
      background: var(--vexa-primary-100); color: var(--vexa-primary-700);
      display: grid; place-items: center;
    }
    .courier-brief__info { display: flex; flex-direction: column; gap: 2px; }
    .courier-brief__name { font-size: 16px; font-weight: 600; color: var(--vexa-gray-900); }
    .courier-brief__meta { font-size: 12px; color: var(--vexa-gray-400); }

    .eta-row { display: flex; justify-content: space-between; align-items: flex-start; }
    .eta-row div { display: flex; flex-direction: column; gap: 4px; }
    .eta-row__progress { align-items: flex-end; text-align: right; }
    .eta-row strong { font-size: 18px; color: var(--vexa-gray-900); }
    .progress-pct { color: var(--vexa-primary-600) !important; }
    .progress-track { height: 8px; border-radius: 4px; background: var(--vexa-gray-200); overflow: hidden; }
    .progress-track__fill { height: 100%; background: var(--vexa-primary-600); border-radius: 4px; }

    .timeline-card { display: flex; flex-direction: column; gap: 20px; }

    .muted { color: var(--vexa-gray-500); margin: 0; }
    .spec-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
    .spec { display: flex; flex-direction: column; gap: 2px; }
    .spec strong { font-size: 14px; color: var(--vexa-gray-900); }
    .spec-tags { display: flex; gap: 8px; margin-top: 12px; }
    .tag {
      font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 8px;
      background: var(--vexa-warning-50); color: var(--vexa-warning-900);
    }
    .pod { width: 100%; border-radius: 12px; }
    .signed-by { font-size: 13px; color: var(--vexa-gray-600); margin: 8px 0 0; }
    .courier-card { display: flex; align-items: center; gap: 14px; }
    .courier-card__avatar {
      width: 48px; height: 48px; border-radius: 50%; flex: none; overflow: hidden;
      background: var(--vexa-primary-100); color: var(--vexa-primary-700);
      display: grid; place-items: center;
    }
    .courier-card__avatar img { width: 100%; height: 100%; object-fit: cover; }
    .courier-card__info { display: flex; flex-direction: column; gap: 2px; }
    .courier-card__info strong { font-size: 15px; color: var(--vexa-gray-900); }
    .courier-card__meta { display: flex; align-items: center; gap: 4px; font-size: 13px; color: var(--vexa-gray-600); }
    .courier-card__meta .star { font-size: 15px; width: 15px; height: 15px; color: var(--vexa-warning-500); }
    .courier-card__vehicle { font-size: 12px; color: var(--vexa-gray-500); }
    .cost { display: flex; justify-content: space-between; font-size: 13px; padding: 4px 0; }
    .cost--total { font-weight: 700; border-top: 1px solid var(--vexa-gray-200); margin-top: 8px; padding-top: 10px; }
    .rate-btn {
      display: block; text-align: center; margin-top: 16px; padding: 10px 16px;
      background: var(--vexa-primary-600); color: #fff; border-radius: var(--vexa-radius-sm);
      font-size: 14px; font-weight: 600; text-decoration: none;
    }

    .map-panel { flex: 1 1 auto; min-width: 0; height: 600px; position: relative; padding: 0; overflow: hidden; }
    .map-panel vexa-map { display: block; height: 100%; }
    .map-address-panel {
      position: absolute; left: 24px; bottom: 24px; width: 320px;
      background: #fff; border: 1px solid var(--vexa-gray-200); border-radius: var(--vexa-radius-md);
      padding: 16px; display: flex; flex-direction: column; gap: 12px;
      box-shadow: var(--vexa-shadow-card);
    }
    .route-node { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--vexa-gray-600); }
    .route-node__dot { width: 8px; height: 8px; border-radius: 50%; flex: none; }
    .route-node__dot--pickup { background: var(--vexa-success-500); }
    .route-node__dot--dest { background: var(--vexa-primary-600); }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JobTracking implements OnInit {
  readonly id = input.required<string>();
  protected readonly JobStatus = JobStatus;

  protected readonly job = signal<Job | null>(null);
  protected readonly courierAt = signal<{ lat: number; lng: number } | null>(null);
  protected readonly courierProfile = signal<{
    name: string;
    avatarUrl: string | null;
    vehicle: string;
    vehicleDetails: { make?: string; year?: number; plate?: string; color?: string } | null;
    rating: number;
    totalJobs: number;
  } | null>(null);

  private readonly jobs = inject(JobsService);
  private readonly realtime = inject(RealtimeService);
  private readonly api = inject(ApiService);

  protected readonly center = computed(() => this.courierAt() ?? this.job()?.pickup ?? { lat: 4.711, lng: -74.0721 });
  protected readonly markers = computed<MapMarker[]>(() => {
    const job = this.job();
    const courier = this.courierAt();
    if (!job) return [];
    const markers: MapMarker[] = [
      { id: 'pickup', lat: job.pickup.lat, lng: job.pickup.lng, label: 'Recogida', color: '#1b5e20' },
      { id: 'dropoff', lat: job.dropoff.lat, lng: job.dropoff.lng, label: 'Entrega', color: '#9c1b1b' },
    ];
    if (courier) markers.push({ id: 'courier', ...courier, label: 'Repartidor', color: '#0b4f9e' });
    return markers;
  });

  private static readonly PROGRESS: Record<string, number> = {
    [JobStatus.PENDING]: 5,
    [JobStatus.OFFERED]: 15,
    [JobStatus.ACCEPTED]: 35,
    [JobStatus.PICKED_UP]: 60,
    [JobStatus.IN_TRANSIT]: 80,
    [JobStatus.DELIVERED]: 100,
    [JobStatus.CANCELLED]: 100,
  };
  protected readonly progress = computed(() => JobTracking.PROGRESS[this.job()?.status ?? ''] ?? 0);
  protected readonly etaLabel = computed(() => {
    const j = this.job();
    if (!j) return '—';
    if (j.status === JobStatus.DELIVERED && j.completedAt) return new Date(j.completedAt).toLocaleString('es-CO');
    return 'En camino';
  });

  protected readonly timeline = computed<TimelineStep[]>(() => {
    const j = this.job();
    if (!j) return [];
    const order = [JobStatus.ACCEPTED, JobStatus.PICKED_UP, JobStatus.IN_TRANSIT, JobStatus.DELIVERED];
    const idx = order.indexOf(j.status);
    const labels = ['Aceptado', 'Recogido', 'En tránsito', 'Entregado'];
    const times = [j.acceptedAt, null, null, j.completedAt];
    return labels.map((label, i) => ({
      title: label,
      state: (j.status === JobStatus.CANCELLED || j.status === JobStatus.DELIVERED || i < idx
          ? 'done'
          : i === idx
            ? 'active'
            : 'pending') as TimelineStep['state'],
      timestamp: times[i] ? new Date(times[i] as string).toLocaleString('es-CO') : undefined,
    }));
  });

  ngOnInit() {
    this.jobs.getById(this.id()).subscribe((job) => {
      this.job.set(job);
      if (job.courierId) this.loadCourierProfile(job.courierId);
    });
    this.realtime.subscribeToJob(this.id());
    this.realtime.on(SocketEvents.COURIER_LOCATION).subscribe((loc) => {
      if (loc.jobId === this.id()) this.courierAt.set({ lat: loc.lat, lng: loc.lng });
    });
    this.realtime.on(SocketEvents.JOB_ACCEPTED).subscribe(() => this.refresh());
    this.realtime.on(SocketEvents.JOB_COMPLETED).subscribe(() => this.refresh());
    this.realtime.on(SocketEvents.JOB_CANCELLED).subscribe(() => this.refresh());
  }

  private loadCourierProfile(courierId: string) {
    this.api
      .get<{
        name: string;
        avatarUrl: string | null;
        vehicle: string;
        vehicleDetails: { make?: string; year?: number; plate?: string; color?: string } | null;
        rating: number;
        totalJobs: number;
      }>(`couriers/${courierId}/profile`)
      .subscribe((c) => this.courierProfile.set(c));
  }

  private refresh() {
    this.jobs.getById(this.id()).subscribe((job) => {
      this.job.set(job);
      if (job.courierId) this.loadCourierProfile(job.courierId);
    });
  }
}
