import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { GeocodingResult, GeocodingService } from '@vexa/maps';
import { PageHeader } from '@vexa/ui';
import { environment } from '../../../environments/environment';
import { JobsService } from './jobs.service';

const PACKAGE_TYPES = [
  { id: 'document', icon: 'description', label: 'Documento', sub: 'Sobres, archivos' },
  { id: 'small', icon: 'inventory_2', label: 'Paquete pequeño', sub: 'Hasta 5 kg' },
  { id: 'large', icon: 'local_shipping', label: 'Paquete grande', sub: 'Hasta 30 kg' },
  { id: 'pallet', icon: 'forklift', label: 'Pallet', sub: 'Carga voluminosa' },
] as const;

const PRIORITIES = [
  { id: 'standard', label: 'Estándar', sub: '2-3 días' },
  { id: 'express', label: 'Express', sub: 'Al día siguiente' },
  { id: 'same_day', label: 'Mismo día', sub: 'Inmediato' },
] as const;

/** Wizard de nuevo pedido (Figma: create-delivery → … → publish-delivery). */
@Component({
  selector: 'vexa-job-create',
  imports: [
    CurrencyPipe,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSnackBarModule,
    PageHeader,
    ReactiveFormsModule,
  ],
  template: `
    <vexa-page-header title="Nuevo pedido" subtitle="Crea una oferta de entrega en 5 pasos" />

    <div class="wizard vexa-card">
      <!-- Stepper de progreso -->
      <div class="steps">
        @for (s of stepLabels; track s; let i = $index) {
          <div class="steps__bar" [class.steps__bar--on]="i <= step()"></div>
        }
      </div>

      <form [formGroup]="form">
        @switch (step()) {
          <!-- Paso 1: tipo de paquete -->
          @case (0) {
            <h2 class="vexa-h4">¿Qué vas a enviar?</h2>
            <p class="vexa-body-sm muted">Selecciona el tamaño y la categoría del paquete.</p>
            <div class="type-grid">
              @for (t of packageTypes; track t.id) {
                <button type="button" class="type-card"
                    [class.type-card--on]="form.controls.packageType.value === t.id"
                    (click)="form.controls.packageType.setValue(t.id)">
                  <mat-icon>{{ t.icon }}</mat-icon>
                  <div>
                    <strong>{{ t.label }}</strong>
                    <small>{{ t.sub }}</small>
                  </div>
                  @if (form.controls.packageType.value === t.id) {
                    <mat-icon class="type-card__check">check_circle</mat-icon>
                  }
                </button>
              }
            </div>
            <mat-form-field class="w-full">
              <mat-label>Peso estimado (kg)</mat-label>
              <input matInput type="number" formControlName="weight" />
            </mat-form-field>
            <div class="toggles vexa-card">
              <h3 class="vexa-overline">Manejo especial</h3>
              <mat-checkbox formControlName="fragile">Artículo frágil</mat-checkbox>
              <mat-checkbox formControlName="refrigerated">Temperatura controlada</mat-checkbox>
            </div>
          }

          <!-- Paso 2: detalles -->
          @case (1) {
            <h2 class="vexa-h4">Detalles del paquete</h2>
            <p class="vexa-body-sm muted">Dimensiones, prioridad e instrucciones.</p>
            <mat-form-field class="w-full">
              <mat-label>Descripción del paquete</mat-label>
              <input matInput formControlName="description" />
            </mat-form-field>
            <div class="dims">
              <mat-form-field><mat-label>Largo (cm)</mat-label><input matInput type="number" formControlName="dimL" /></mat-form-field>
              <mat-form-field><mat-label>Ancho</mat-label><input matInput type="number" formControlName="dimW" /></mat-form-field>
              <mat-form-field><mat-label>Alto</mat-label><input matInput type="number" formControlName="dimH" /></mat-form-field>
            </div>
            <h3 class="vexa-overline">Prioridad de entrega</h3>
            <div class="priority-row">
              @for (p of priorities; track p.id) {
                <button type="button" class="priority"
                    [class.priority--on]="form.controls.priority.value === p.id"
                    (click)="form.controls.priority.setValue(p.id)">
                  <strong>{{ p.label }}</strong>
                  <small>{{ p.sub }}</small>
                </button>
              }
            </div>
            <mat-form-field class="w-full">
              <mat-label>Fecha y hora de recogida preferida</mat-label>
              <input matInput type="datetime-local" formControlName="pickupAt" />
            </mat-form-field>
            <mat-form-field class="w-full">
              <mat-label>Instrucciones adicionales</mat-label>
              <textarea matInput formControlName="notes" rows="2"></textarea>
            </mat-form-field>
          }

          <!-- Paso 3: recogida -->
          @case (2) {
            <h2 class="vexa-h4">Punto de recogida</h2>
            <div formGroupName="pickup" class="grid">
              <mat-form-field class="span2"><mat-label>Dirección</mat-label>
                <input matInput formControlName="line1" /></mat-form-field>
              <button mat-stroked-button type="button" class="span2 geo-btn"
                  (click)="geocode('pickup')">
                <mat-icon>travel_explore</mat-icon> Buscar en mapa</button>
              @if (suggestions()['pickup']?.length) {
                <div class="span2 sugg">
                  @for (s of suggestions()['pickup']; track s.line1) {
                    <button type="button" (click)="applyGeocode('pickup', s)">{{ s.line1 }}</button>
                  }
                </div>
              }
              <mat-form-field><mat-label>Ciudad</mat-label><input matInput formControlName="city" /></mat-form-field>
              <mat-form-field><mat-label>Estado/Depto</mat-label><input matInput formControlName="line2" /></mat-form-field>
              <mat-form-field><mat-label>Latitud</mat-label><input matInput type="number" step="any" formControlName="lat" /></mat-form-field>
              <mat-form-field><mat-label>Longitud</mat-label><input matInput type="number" step="any" formControlName="lng" /></mat-form-field>
            </div>
            <h3 class="vexa-overline">Persona de contacto</h3>
            <div class="grid">
              <mat-form-field><mat-label>Nombre</mat-label><input matInput formControlName="pickupContact" /></mat-form-field>
              <mat-form-field><mat-label>Teléfono</mat-label><input matInput formControlName="pickupPhone" /></mat-form-field>
            </div>
          }

          <!-- Paso 4: destino -->
          @case (3) {
            <h2 class="vexa-h4">Destino de entrega</h2>
            <div formGroupName="dropoff" class="grid">
              <mat-form-field class="span2"><mat-label>Dirección</mat-label>
                <input matInput formControlName="line1" /></mat-form-field>
              <button mat-stroked-button type="button" class="span2 geo-btn"
                  (click)="geocode('dropoff')">
                <mat-icon>travel_explore</mat-icon> Buscar en mapa</button>
              @if (suggestions()['dropoff']?.length) {
                <div class="span2 sugg">
                  @for (s of suggestions()['dropoff']; track s.line1) {
                    <button type="button" (click)="applyGeocode('dropoff', s)">{{ s.line1 }}</button>
                  }
                </div>
              }
              <mat-form-field><mat-label>Ciudad</mat-label><input matInput formControlName="city" /></mat-form-field>
              <mat-form-field><mat-label>Estado/Depto</mat-label><input matInput formControlName="line2" /></mat-form-field>
              <mat-form-field><mat-label>Latitud</mat-label><input matInput type="number" step="any" formControlName="lat" /></mat-form-field>
              <mat-form-field><mat-label>Longitud</mat-label><input matInput type="number" step="any" formControlName="lng" /></mat-form-field>
            </div>
            <h3 class="vexa-overline">Destinatario</h3>
            <div class="grid">
              <mat-form-field><mat-label>Nombre</mat-label><input matInput formControlName="dropoffContact" /></mat-form-field>
              <mat-form-field><mat-label>Teléfono</mat-label><input matInput formControlName="dropoffPhone" /></mat-form-field>
            </div>
            <mat-form-field class="w-full">
              <mat-label>Instrucciones de entrega</mat-label>
              <input matInput formControlName="dropoffNotes" />
            </mat-form-field>
          }

          <!-- Paso 5: precio y revisión -->
          @case (4) {
            <div class="review__route vexa-card">
              <p><mat-icon class="dot dot--pickup">trip_origin</mat-icon> {{ form.controls.pickup.controls.line1.value || '—' }}</p>
              <p><mat-icon class="dot dot--dropoff">location_on</mat-icon> {{ form.controls.dropoff.controls.line1.value || '—' }}</p>
              <small class="muted">Distancia estimada · Tiempo aprox.</small>
            </div>
            <div class="price-box">
              <span class="vexa-overline">Precio sugerido del mercado</span>
              <strong class="price-box__range">{{ estimate()?.price ?? costsTotal() | currency:'COP':'symbol-narrow':'1.0-0' }} – {{ (estimate()?.price ?? costsTotal()) * 1.3 | currency:'COP':'symbol-narrow':'1.0-0' }}</strong>
              <small class="muted">Basado en la demanda actual y la prioridad</small>
            </div>
            <mat-form-field class="w-full">
              <mat-label>Tu oferta (COP)</mat-label>
              <input matInput type="number" formControlName="price" />
            </mat-form-field>
            <div class="costs vexa-card">
              <h3 class="vexa-overline">Desglose de costos</h3>
              <div class="costs__row"><span>Tarifa base</span><span>{{ costs().base | currency:'COP':'symbol-narrow':'1.0-0' }}</span></div>
              <div class="costs__row"><span>Distancia</span><span>{{ costs().distance | currency:'COP':'symbol-narrow':'1.0-0' }}</span></div>
              <div class="costs__row"><span>Recargo por peso</span><span>{{ costs().weight | currency:'COP':'symbol-narrow':'1.0-0' }}</span></div>
              @if (form.controls.priority.value === 'express' || form.controls.priority.value === 'same_day') {
                <div class="costs__row"><span>Prioridad</span><span>{{ costs().priority | currency:'COP':'symbol-narrow':'1.0-0' }}</span></div>
              }
            </div>
            <mat-checkbox formControlName="acceptTerms">Acepto los términos de servicio de Vexa</mat-checkbox>
          }
        }
      </form>

      <div class="wizard__nav">
        @if (step() > 0) {
          <button mat-button type="button" (click)="step.set(step() - 1)">Atrás</button>
        }
        <span class="spacer"></span>
        @if (step() < 4) {
          <button mat-flat-button type="button" (click)="next()">
            {{ step() === 4 ? '' : 'Siguiente' }}
          </button>
        } @else {
          <button mat-stroked-button type="button" (click)="saveDraft()">Guardar borrador</button>
          <button mat-flat-button type="button" [disabled]="!canPublish() || saving()" (click)="publish()">
            {{ saving() ? 'Publicando…' : 'Publicar pedido' }}
          </button>
        }
      </div>
    </div>
  `,
  styles: `
    .wizard { max-width: 720px; padding: 28px; }
    .steps { display: flex; gap: 8px; margin-bottom: 28px; }
    .steps__bar { flex: 1; height: 4px; border-radius: 2px; background: var(--vexa-gray-200); }
    .steps__bar--on { background: var(--vexa-primary-600); }
    .w-full { width: 100%; }
    .muted { color: var(--vexa-gray-500); }
    .type-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin: 16px 0; }
    .type-card {
      display: flex; align-items: center; gap: 14px; padding: 16px; text-align: left;
      background: #fff; border: 1px solid var(--vexa-gray-200); border-radius: 16px;
      cursor: pointer; font: inherit;
      mat-icon { color: var(--vexa-gray-500); }
      strong { display: block; font-size: 14px; }
      small { color: var(--vexa-gray-500); font-size: 12px; }
    }
    .type-card--on { border-color: var(--vexa-primary-600); background: var(--vexa-primary-50); }
    .type-card__check { margin-left: auto; color: var(--vexa-primary-600) !important; }
    .toggles { padding: 16px; display: flex; flex-direction: column; gap: 4px; margin-top: 16px; }
    .dims, .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0 12px; }
    .dims { grid-template-columns: repeat(3, 1fr); }
    .span2 { grid-column: span 2; }
    .geo-btn { justify-self: start; }
    .sugg { display: flex; flex-direction: column; border: 1px solid var(--vexa-gray-200); border-radius: 10px; overflow: hidden; }
    .sugg button { text-align: left; padding: 8px 12px; background: #fff; border: 0; border-top: 1px solid var(--vexa-gray-100); cursor: pointer; font: inherit; font-size: 13px; }
    .sugg button:hover { background: var(--vexa-primary-50); }
    .priority-row { display: flex; gap: 8px; margin-bottom: 16px; }
    .priority {
      flex: 1; padding: 10px; background: #fff; border: 1px solid var(--vexa-gray-200);
      border-radius: 12px; cursor: pointer; font: inherit; text-align: center;
      strong { display: block; font-size: 13px; }
      small { font-size: 11px; color: var(--vexa-gray-500); }
    }
    .priority--on { border-color: var(--vexa-primary-600); background: var(--vexa-primary-50); }
    .review__route { padding: 16px; margin-bottom: 16px; }
    .review__route p { display: flex; align-items: center; gap: 10px; margin: 0 0 8px; font-weight: 600; font-size: 14px; }
    .dot { font-size: 18px; width: 18px; height: 18px; }
    .dot--pickup { color: var(--vexa-primary-600); }
    .dot--dropoff { color: var(--vexa-error-500); }
    .price-box {
      padding: 20px; border-radius: 16px; background: var(--vexa-primary-50);
      border: 1px solid var(--vexa-primary-200); margin-bottom: 16px;
      display: flex; flex-direction: column; gap: 4px;
    }
    .price-box__range { font-size: 24px; font-weight: 800; color: var(--vexa-primary-700); }
    .costs { padding: 16px; margin: 12px 0; }
    .costs__row { display: flex; justify-content: space-between; font-size: 13px; padding: 4px 0; }
    .wizard__nav { display: flex; gap: 12px; margin-top: 24px; }
    .spacer { flex: 1; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JobCreate {
  private readonly fb = inject(FormBuilder);
  private readonly jobs = inject(JobsService);
  private readonly snack = inject(MatSnackBar);
  private readonly router = inject(Router);
  private readonly geocoding = inject(GeocodingService);

  protected readonly suggestions = signal<Record<'pickup' | 'dropoff', GeocodingResult[]>>({
    pickup: [],
    dropoff: [],
  });

  protected readonly estimate = signal<{
    price: number;
    breakdown: { base: number; distance: number; weight: number; priorityMultiplier: number };
  } | null>(null);

  protected readonly step = signal(0);
  protected readonly saving = signal(false);
  protected readonly stepLabels = ['Tipo', 'Detalles', 'Recogida', 'Destino', 'Precio'];
  protected readonly packageTypes = PACKAGE_TYPES;
  protected readonly priorities = PRIORITIES;

  protected readonly form = this.fb.nonNullable.group({
    packageType: ['small', Validators.required],
    weight: [0, [Validators.required, Validators.min(0.1)]],
    fragile: [false],
    refrigerated: [false],
    description: [''],
    dimL: [0],
    dimW: [0],
    dimH: [0],
    priority: ['standard'],
    pickupAt: [''],
    notes: [''],
    pickup: this.fb.nonNullable.group({
      line1: ['', Validators.required],
      city: ['', Validators.required],
      line2: [''],
      lat: [4.6097, [Validators.required, Validators.min(-90), Validators.max(90)]],
      lng: [-74.0817, [Validators.required, Validators.min(-180), Validators.max(180)]],
    }),
    dropoff: this.fb.nonNullable.group({
      line1: ['', Validators.required],
      city: ['', Validators.required],
      line2: [''],
      lat: [4.65, [Validators.required, Validators.min(-90), Validators.max(90)]],
      lng: [-74.1, [Validators.required, Validators.min(-180), Validators.max(180)]],
    }),
    pickupContact: [''],
    pickupPhone: [''],
    dropoffContact: [''],
    dropoffPhone: [''],
    dropoffNotes: [''],
    price: [0, [Validators.required, Validators.min(1)]],
    acceptTerms: [false],
  });

  protected readonly costs = computed(() => {
    const e = this.estimate();
    if (!e) return { base: 0, distance: 0, weight: 0, priority: 0 };
    return {
      base: e.breakdown.base,
      distance: e.breakdown.distance,
      weight: e.breakdown.weight,
      priority: Math.round(
        (e.breakdown.base + e.breakdown.distance + e.breakdown.weight) *
          (e.breakdown.priorityMultiplier - 1)
      ),
    };
  });

  protected readonly costsTotal = computed(() => this.estimate()?.price ?? 0);

  protected canPublish() {
    return this.form.valid && this.form.controls.acceptTerms.value;
  }

  geocode(field: 'pickup' | 'dropoff') {
    const group = this.form.controls[field];
    const query = group.controls.line1.value;
    if (!query || !environment.mapboxToken) return;
    this.geocoding.search(query, environment.mapboxToken).subscribe((results) =>
      this.suggestions.update((s) => ({ ...s, [field]: results })),
    );
  }

  applyGeocode(field: 'pickup' | 'dropoff', result: GeocodingResult) {
    this.form.controls[field].patchValue({
      line1: result.line1,
      city: result.city || this.form.controls[field].controls.city.value,
      lat: result.lat,
      lng: result.lng,
    });
    this.suggestions.update((s) => ({ ...s, [field]: [] }));
  }

  /** Haversine entre recogida y destino para el estimador. */
  private distanceMeters(): number {
    const a = this.form.controls.pickup.getRawValue();
    const b = this.form.controls.dropoff.getRawValue();
    const rad = Math.PI / 180;
    const dLat = (b.lat - a.lat) * rad;
    const dLng = (b.lng - a.lng) * rad;
    const h =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
    return Math.round(2 * 6371_000 * Math.asin(Math.sqrt(h)));
  }

  private loadEstimate() {
    const v = this.form.getRawValue();
    this.jobs
      .priceEstimate({
        distanceMeters: this.distanceMeters(),
        weightKg: v.weight,
        priority: v.priority === 'standard' ? 'standard' : 'express',
      })
      .subscribe({
        next: (e) => {
          this.estimate.set(e);
          if (!v.price) this.form.controls.price.setValue(e.price);
        },
        error: () => this.estimate.set(null),
      });
  }

  next() {
    this.step.update((s) => Math.min(4, s + 1));
    if (this.step() === 4) this.loadEstimate();
  }

  saveDraft() {
    this.snack.open('Borrador guardado', undefined, { duration: 2500 });
  }

  publish() {
    if (!this.canPublish()) return;
    this.saving.set(true);
    const v = this.form.getRawValue();
    this.jobs
      .create({
        pickup: v.pickup,
        dropoff: v.dropoff,
        price: v.price,
        notes: v.description || v.notes,
      })
      .subscribe({
        next: (job) => {
          this.snack.open('Pedido publicado', undefined, { duration: 3000 });
          this.router.navigate(['/jobs', job.id]);
        },
        error: () => {
          this.saving.set(false);
          this.snack.open('No se pudo crear el pedido', undefined, { duration: 3000 });
        },
      });
  }
}
