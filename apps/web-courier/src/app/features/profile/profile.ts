import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Courier, VehicleType } from '@vexa/shared';
import { AuthStore } from '../../core/auth/auth.store';
import { CourierVerification, CouriersService } from '../../core/couriers/couriers.service';

const VEHICLE_LABEL: Record<VehicleType, string> = {
  [VehicleType.BICYCLE]: 'Bicicleta',
  [VehicleType.MOTORCYCLE]: 'Motocicleta',
  [VehicleType.CAR]: 'Automóvil',
  [VehicleType.VAN]: 'Camioneta',
};

const STEP_LABEL: Record<string, string> = {
  identity: 'Identidad',
  vehicle: 'Documentos del vehículo',
  insurance: 'Seguro',
  background: 'Verificación de antecedentes',
};

/** Figma: web-courier-profile */
@Component({
  selector: 'vexa-profile',
  imports: [DatePipe, RouterLink],
  template: `
    <div class="hero">
      <div class="hero__left">
        <div class="hero__avatar">{{ initials() }}</div>
        <div>
          <h1>{{ auth.user()?.fullName }}</h1>
          <div class="hero__meta">
            <span class="badge">Socio Vexa</span>
            <span class="muted">Miembro desde {{ auth.user()?.createdAt | date: 'MMM yyyy':'':'es-CO' }}</span>
          </div>
        </div>
      </div>
      <a routerLink="/verification" class="hero__btn">Editar perfil</a>
    </div>

    <div class="grid">
      <div class="col">
        <div class="vexa-card">
          <h2 class="vexa-h5">Información personal</h2>
          <div class="row"><span>Nombre completo</span><strong>{{ auth.user()?.fullName }}</strong></div>
          <div class="row"><span>Correo electrónico</span><strong>{{ auth.user()?.email }}</strong></div>
        </div>

        <div class="vexa-card">
          <h2 class="vexa-h5">Cuenta y seguridad</h2>
          <div class="row"><span>Correo de acceso</span><strong>{{ auth.user()?.email }}</strong></div>
          <button type="button" class="logout-btn" (click)="auth.logout()">Cerrar sesión</button>
        </div>

        <div class="vexa-card">
          <h2 class="vexa-h5">Detalles del vehículo</h2>
          <div class="row"><span>Tipo de vehículo</span><strong>{{ vehicleTypeLabel() }}</strong></div>
          @if (vehicle(); as v) {
            @if (v.make) { <div class="row"><span>Marca</span><strong>{{ v.make }}</strong></div> }
            @if (v.plate) { <div class="row"><span>Placa</span><strong>{{ v.plate }}</strong></div> }
            @if (v.color) { <div class="row"><span>Color</span><strong>{{ v.color }}</strong></div> }
            @if (v.year) { <div class="row"><span>Año</span><strong>{{ v.year }}</strong></div> }
          }
        </div>
      </div>

      <div class="vexa-card docs-card">
        <h2 class="vexa-h5">Credenciales y documentos</h2>
        <p class="muted">Todos los repartidores deben mantener su documentación al día para recibir pedidos.</p>
        @for (step of verification()?.steps ?? []; track step.type) {
          <div class="doc-row">
            <div class="doc-row__top">
              <strong>{{ STEP_LABEL[step.type] }}</strong>
              <span class="status-badge" [class]="'status-badge--' + step.status">{{ statusLabel(step.status) }}</span>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: `
    .hero {
      display: flex; align-items: center; justify-content: space-between;
      background: var(--vexa-sidebar-bg); color: #fff; padding: 32px; border-radius: var(--vexa-radius-lg);
      margin-bottom: 24px;
    }
    .hero__left { display: flex; align-items: center; gap: 24px; }
    .hero__avatar {
      width: 80px; height: 80px; border-radius: 50%; background: var(--vexa-primary-600);
      display: grid; place-items: center; font-size: 28px; font-weight: 700; flex: none;
    }
    .hero h1 { margin: 0 0 6px; font-size: 28px; font-weight: 700; }
    .hero__meta { display: flex; align-items: center; gap: 8px; }
    .badge { background: var(--vexa-primary-600); color: #fff; font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 6px; }
    .muted { color: var(--vexa-sidebar-muted); font-size: 13px; }
    .hero__btn {
      background: var(--vexa-sidebar-active); border: 1px solid #334155; color: #fff; text-decoration: none;
      padding: 12px 24px; border-radius: var(--vexa-radius-sm); font-size: 14px; font-weight: 600;
    }

    .grid { display: flex; gap: 24px; align-items: flex-start; }
    @media (max-width: 1000px) { .grid { flex-direction: column; } }
    .col { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; gap: 24px; }
    .docs-card { width: 420px; flex: none; display: flex; flex-direction: column; gap: 16px; }
    @media (max-width: 1000px) { .docs-card { width: 100%; } }

    .row { display: flex; align-items: center; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid var(--vexa-gray-200); font-size: 14px; }
    .row:last-child { border-bottom: none; }
    .row span { color: var(--vexa-gray-500); font-size: 13px; }
    .row strong { color: var(--vexa-gray-900); }
    .logout-btn {
      margin-top: 12px; align-self: flex-start; background: none; border: 1px solid var(--vexa-error-300);
      color: var(--vexa-error-600); border-radius: var(--vexa-radius-sm); padding: 8px 16px;
      font-size: 13px; font-weight: 600; cursor: pointer;
    }

    .doc-row { border: 1px solid var(--vexa-gray-200); border-radius: var(--vexa-radius-md); padding: 16px; }
    .doc-row__top { display: flex; align-items: center; justify-content: space-between; }
    .status-badge { font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 6px; }
    .status-badge--verified { background: var(--vexa-success-100); color: var(--vexa-success-700); }
    .status-badge--pending { background: var(--vexa-warning-100); color: var(--vexa-warning-700); }
    .status-badge--required, .status-badge--rejected { background: var(--vexa-error-100); color: var(--vexa-error-700); }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Profile {
  protected readonly auth = inject(AuthStore);
  private readonly couriers = inject(CouriersService);
  protected readonly STEP_LABEL = STEP_LABEL;

  protected readonly courier = signal<Courier | null>(null);
  protected readonly verification = signal<CourierVerification | null>(null);
  protected readonly vehicle = computed(() => this.verification()?.vehicleDetails ?? null);
  protected readonly vehicleTypeLabel = computed(() => {
    const t = this.courier()?.vehicle;
    return t ? VEHICLE_LABEL[t] : '—';
  });

  protected readonly initials = computed(() => {
    const name = this.auth.user()?.fullName ?? '';
    return name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('');
  });

  constructor() {
    this.couriers.me().subscribe((c) => this.courier.set(c));
    this.couriers.verification().subscribe((v) => this.verification.set(v));
  }

  protected statusLabel(s: string): string {
    return { verified: 'Verificado', pending: 'En revisión', required: 'Requerido', rejected: 'Rechazado' }[s] ?? s;
  }
}
