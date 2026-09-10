import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { debounceTime } from 'rxjs';
import { GeocodingResult, GeocodingService } from '@vexa/maps';
import { JobPriceBreakdown } from '@vexa/shared';
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

/** Figma: web-create-delivery */
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
    ReactiveFormsModule,
  ],
  template: `
    <div class="stepper vexa-card">
      @for (s of stepLabels; track s; let i = $index) {
        <div class="stepper__item">
          <span class="stepper__num" [class.stepper__num--on]="i <= step()">{{ i + 1 }}</span>
          <span class="stepper__label" [class.stepper__label--on]="i <= step()">{{ s }}</span>
          @if (i < stepLabels.length - 1) {
            <mat-icon class="stepper__chevron">chevron_right</mat-icon>
          }
        </div>
      }
    </div>

    <div class="workspace">
      <form [formGroup]="form" class="vexa-card form-panel">
        @switch (step()) {
          <!-- Paso 1: detalles del paquete (tipo + descripción + peso + dimensiones + instrucciones) -->
          @case (0) {
            <h2 class="vexa-h4">Especificaciones del paquete</h2>
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
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Descripción del paquete</mat-label>
              <input matInput formControlName="description" />
            </mat-form-field>
            <div class="dims">
              <mat-form-field appearance="outline"><mat-label>Peso (kg)</mat-label><input matInput type="number" formControlName="weight" /></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>Largo (cm)</mat-label><input matInput type="number" formControlName="dimL" /></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>Ancho</mat-label><input matInput type="number" formControlName="dimW" /></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>Alto</mat-label><input matInput type="number" formControlName="dimH" /></mat-form-field>
            </div>
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Valor declarado (COP, opcional)</mat-label>
              <input matInput type="number" formControlName="declaredValue" />
            </mat-form-field>
            <div class="toggles vexa-card">
              <h3 class="vexa-overline">Manejo especial</h3>
              <mat-checkbox formControlName="fragile">Artículo frágil</mat-checkbox>
              <mat-checkbox formControlName="refrigerated">Temperatura controlada</mat-checkbox>
            </div>
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Instrucciones especiales</mat-label>
              <textarea matInput formControlName="notes" rows="2"></textarea>
            </mat-form-field>
          }

          <!-- Paso 2: recogida -->
          @case (1) {
            <h2 class="vexa-h4">Punto de recogida</h2>
            <div formGroupName="pickup" class="grid">
              <mat-form-field appearance="outline" class="span2"><mat-label>Dirección</mat-label>
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
              <mat-form-field appearance="outline"><mat-label>Ciudad</mat-label><input matInput formControlName="city" /></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>Estado/Depto</mat-label><input matInput formControlName="line2" /></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>Latitud</mat-label><input matInput type="number" step="any" formControlName="lat" /></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>Longitud</mat-label><input matInput type="number" step="any" formControlName="lng" /></mat-form-field>
            </div>
            <h3 class="vexa-overline">Persona de contacto</h3>
            <div class="grid">
              <mat-form-field appearance="outline"><mat-label>Nombre</mat-label><input matInput formControlName="pickupContact" /></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>Teléfono</mat-label><input matInput formControlName="pickupPhone" /></mat-form-field>
            </div>
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Fecha y hora de recogida preferida</mat-label>
              <input matInput type="datetime-local" formControlName="pickupAt" />
            </mat-form-field>
          }

          <!-- Paso 3: destino -->
          @case (2) {
            <h2 class="vexa-h4">Destino de entrega</h2>
            <div formGroupName="dropoff" class="grid">
              <mat-form-field appearance="outline" class="span2"><mat-label>Dirección</mat-label>
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
              <mat-form-field appearance="outline"><mat-label>Ciudad</mat-label><input matInput formControlName="city" /></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>Estado/Depto</mat-label><input matInput formControlName="line2" /></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>Latitud</mat-label><input matInput type="number" step="any" formControlName="lat" /></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>Longitud</mat-label><input matInput type="number" step="any" formControlName="lng" /></mat-form-field>
            </div>
            <h3 class="vexa-overline">Destinatario</h3>
            <div class="grid">
              <mat-form-field appearance="outline"><mat-label>Nombre</mat-label><input matInput formControlName="dropoffContact" /></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>Teléfono</mat-label><input matInput formControlName="dropoffPhone" /></mat-form-field>
            </div>
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Instrucciones de entrega</mat-label>
              <input matInput formControlName="dropoffNotes" />
            </mat-form-field>
          }

          <!-- Paso 4: precio -->
          @case (3) {
            <h2 class="vexa-h4">Precio del envío</h2>
            <p class="vexa-body-sm muted">Ajusta tu oferta según la prioridad de entrega.</p>
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
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Tu oferta (COP)</mat-label>
              <input matInput type="number" formControlName="price" />
            </mat-form-field>
            <p class="price-notice">El precio final se confirma al verificar el peso en la recogida.</p>
          }

          <!-- Paso 5: revisión -->
          @case (4) {
            <h2 class="vexa-h4">Revisa y publica</h2>
            <div class="review__route vexa-card">
              <p><mat-icon class="dot dot--pickup">trip_origin</mat-icon> {{ form.controls.pickup.controls.line1.value || '—' }}</p>
              <p><mat-icon class="dot dot--dropoff">location_on</mat-icon> {{ form.controls.dropoff.controls.line1.value || '—' }}</p>
            </div>
            <div class="review__price vexa-card">
              <span class="vexa-overline">Tu oferta</span>
              <strong>{{ form.controls.price.value | currency: 'COP':'symbol-narrow':'1.0-0' }}</strong>
            </div>
            <mat-checkbox formControlName="acceptTerms">Acepto los términos de servicio de Vexa</mat-checkbox>
          }
        }

        <div class="form-panel__actions">
          @if (step() > 0) {
            <button mat-stroked-button type="button" (click)="step.set(step() - 1)">Atrás</button>
          } @else {
            <span></span>
          }
          @if (step() < 4) {
            <button mat-flat-button type="button" (click)="next()">Siguiente</button>
          } @else {
            <div class="final-actions">
              <button mat-stroked-button type="button" (click)="saveDraft()">Guardar borrador</button>
              <button mat-flat-button type="button" [disabled]="!canPublish() || saving()" (click)="publish()">
                {{ saving() ? 'Publicando…' : 'Publicar pedido' }}
              </button>
            </div>
          }
        </div>
      </form>

      <aside class="vexa-card summary-panel">
        <h2 class="vexa-h5">Resumen estimado</h2>
        <div class="summary-panel__notice">
          El precio final se confirma al verificar el peso en la recogida.
        </div>
        <div class="breakdown">
          <div class="breakdown__row"><span>Tarifa base</span><span>{{ costs().base | currency: 'COP':'symbol-narrow':'1.0-0' }}</span></div>
          <div class="breakdown__row"><span>Distancia</span><span>{{ costs().distance | currency: 'COP':'symbol-narrow':'1.0-0' }}</span></div>
          <div class="breakdown__row"><span>Tiempo estimado{{ estimate()?.trafficAware ? ' (con tráfico)' : '' }}</span><span>{{ costs().time | currency: 'COP':'symbol-narrow':'1.0-0' }}</span></div>
          <div class="breakdown__row"><span>Recargo por peso</span><span>{{ costs().weight | currency: 'COP':'symbol-narrow':'1.0-0' }}</span></div>
          @if (form.controls.priority.value !== 'standard') {
            <div class="breakdown__row"><span>Prioridad</span><span>{{ costs().priority | currency: 'COP':'symbol-narrow':'1.0-0' }}</span></div>
          }
          @if (costs().demand > 0) {
            <div class="breakdown__row">
              <span>Demanda alta en la zona</span>
              <span>{{ costs().demand | currency: 'COP':'symbol-narrow':'1.0-0' }}</span>
            </div>
          }
          <div class="breakdown__row"><span>Comisión plataforma</span><span>{{ costs().commission | currency: 'COP':'symbol-narrow':'1.0-0' }}</span></div>
          <hr />
          <div class="breakdown__total">
            <span>Total estimado</span>
            <strong>{{ costsTotal() | currency: 'COP':'symbol-narrow':'1.0-0' }}</strong>
          </div>
        </div>
      </aside>
    </div>
  `,
  styles: `
    .stepper { display: flex; align-items: center; gap: 8px; padding: 20px; margin-bottom: 24px; flex-wrap: wrap; }
    .stepper__item { display: flex; align-items: center; gap: 8px; }
    .stepper__num {
      width: 24px; height: 24px; border-radius: 12px; display: grid; place-items: center;
      background: var(--vexa-gray-200); color: var(--vexa-gray-600); font-size: 12px; font-weight: 700;
    }
    .stepper__num--on { background: var(--vexa-primary-600); color: #fff; }
    .stepper__label { font-size: 14px; font-weight: 500; color: var(--vexa-gray-600); }
    .stepper__label--on { color: var(--vexa-primary-600); font-weight: 600; }
    .stepper__chevron { color: var(--vexa-gray-300); margin: 0 4px; font-size: 18px; width: 18px; height: 18px; }

    .workspace { display: flex; gap: 24px; align-items: flex-start; }
    @media (max-width: 1000px) { .workspace { flex-direction: column; } }
    .form-panel { flex: 1 1 auto; min-width: 0; padding: 32px; display: flex; flex-direction: column; gap: 20px; }
    .summary-panel { width: 380px; flex: none; padding: 24px; display: flex; flex-direction: column; gap: 20px; }
    @media (max-width: 1000px) { .summary-panel { width: 100%; } }

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
    .toggles { padding: 16px; display: flex; flex-direction: column; gap: 4px; margin-top: 8px; }
    .dims, .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0 12px; }
    .dims { grid-template-columns: repeat(4, 1fr); }
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
    .review__route { padding: 16px; }
    .review__route p { display: flex; align-items: center; gap: 10px; margin: 0 0 8px; font-weight: 600; font-size: 14px; }
    .review__route p:last-child { margin-bottom: 0; }
    .dot { font-size: 18px; width: 18px; height: 18px; }
    .dot--pickup { color: var(--vexa-primary-600); }
    .dot--dropoff { color: var(--vexa-error-500); }
    .review__price { padding: 16px; display: flex; flex-direction: column; gap: 4px; }
    .review__price strong { font-size: 24px; color: var(--vexa-primary-600); }
    .price-notice { font-size: 12px; color: var(--vexa-gray-500); margin: 0; }

    .form-panel__actions { display: flex; align-items: center; justify-content: space-between; padding-top: 12px; }
    .final-actions { display: flex; gap: 12px; }

    .summary-panel__notice {
      background: var(--vexa-warning-50); border: 1px solid var(--vexa-warning-300);
      color: var(--vexa-warning-900); font-size: 12px; padding: 12px; border-radius: var(--vexa-radius-sm);
    }
    .breakdown { display: flex; flex-direction: column; gap: 12px; }
    .breakdown__row { display: flex; justify-content: space-between; font-size: 14px; color: var(--vexa-gray-600); }
    .breakdown hr { border: none; border-top: 1px solid var(--vexa-gray-200); margin: 0; }
    .breakdown__total { display: flex; justify-content: space-between; align-items: center; font-weight: 700; }
    .breakdown__total strong { font-size: 22px; color: var(--vexa-primary-600); }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JobCreate {
  private readonly fb = inject(FormBuilder);
  private readonly jobs = inject(JobsService);
  private readonly snack = inject(MatSnackBar);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly geocoding = inject(GeocodingService);

  protected readonly suggestions = signal<Record<'pickup' | 'dropoff', GeocodingResult[]>>({
    pickup: [],
    dropoff: [],
  });

  protected readonly estimate = signal<{
    price: number;
    durationSeconds: number;
    trafficAware: boolean;
    demand: { availableCouriersNearby: number; activeJobsNearby: number };
    breakdown: JobPriceBreakdown;
  } | null>(null);

  protected readonly step = signal(0);
  protected readonly saving = signal(false);
  protected readonly stepLabels = ['Paquete', 'Recogida', 'Destino', 'Precio', 'Revisión'];
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
    declaredValue: [0],
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
    if (!e) return { base: 0, distance: 0, time: 0, weight: 0, priority: 0, demand: 0, commission: 0 };
    const base = e.breakdown.base + e.breakdown.distance + e.breakdown.time + e.breakdown.weight;
    const afterPriority = base * e.breakdown.priorityMultiplier;
    return {
      base: e.breakdown.base,
      distance: e.breakdown.distance,
      time: e.breakdown.time,
      weight: e.breakdown.weight,
      priority: Math.round(afterPriority - base),
      demand: Math.round(afterPriority * (e.breakdown.demandMultiplier - 1)),
      commission: e.breakdown.commission,
    };
  });

  protected readonly costsTotal = computed(() => this.estimate()?.price ?? 0);

  constructor() {
    this.loadEstimate();
    this.form.valueChanges.pipe(debounceTime(400)).subscribe(() => this.loadEstimate());
  }

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

  private loadEstimate() {
    const v = this.form.getRawValue();
    this.jobs
      .priceEstimate({
        pickupLat: v.pickup.lat,
        pickupLng: v.pickup.lng,
        dropoffLat: v.dropoff.lat,
        dropoffLng: v.dropoff.lng,
        weightKg: v.weight,
        priority: v.priority as 'standard' | 'express' | 'same_day',
      })
      .subscribe({
        next: (e) => {
          this.estimate.set(e);
          if (!v.price) this.form.controls.price.setValue(e.price, { emitEvent: false });
        },
        error: () => this.estimate.set(null),
      });
  }

  next() {
    this.step.update((s) => Math.min(4, s + 1));
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
        packageType: v.packageType,
        weightKg: v.weight,
        dimensions: { l: v.dimL, w: v.dimW, h: v.dimH },
        declaredValue: v.declaredValue || undefined,
        fragile: v.fragile,
        refrigerated: v.refrigerated,
        priority: v.priority as 'standard' | 'express' | 'same_day',
        priceBreakdown: this.estimate()?.breakdown,
        durationSeconds: this.estimate()?.durationSeconds,
      })
      .subscribe({
        next: (job) => {
          this.snack.open('Pedido publicado', undefined, { duration: 3000 });
          this.router.navigate(['..', 'jobs', job.id], { relativeTo: this.route });
        },
        error: () => {
          this.saving.set(false);
          this.snack.open('No se pudo crear el pedido', undefined, { duration: 3000 });
        },
      });
  }
}
