import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ApiService } from '../../core/api/api.service';

interface CompanySettings {
  name: string;
  address?: string | null;
  adminEmail?: string | null;
  twoFactor: boolean;
  language: 'es' | 'en';
  currency: 'COP' | 'USD';
  plan?: string | null;
  planPrice?: number | null;
  renewalAt?: string | null;
}

/** Figma: web-company-settings */
@Component({
  selector: 'vexa-settings',
  imports: [
    CurrencyPipe,
    DatePipe,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatSnackBarModule,
    ReactiveFormsModule,
  ],
  template: `
    <div class="settings">
      <form class="vexa-card section" [formGroup]="form" (ngSubmit)="save()">
        <div class="section__head">
          <h2 class="vexa-h5">Perfil de empresa</h2>
          <p class="section__hint">Administra la identidad de tu cuenta Vexa</p>
        </div>
        <div class="grid-2">
          <mat-form-field appearance="outline"><mat-label>Nombre de la empresa</mat-label>
            <input matInput formControlName="name" /></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Correo de facturación</mat-label>
            <input matInput formControlName="adminEmail" /></mat-form-field>
        </div>
        <mat-form-field appearance="outline" class="full"><mat-label>Dirección corporativa</mat-label>
          <input matInput formControlName="address" /></mat-form-field>
        <button mat-flat-button type="submit">Guardar cambios</button>
      </form>

      <div class="vexa-card section">
        <h2 class="vexa-h5">Cuenta y seguridad</h2>
        <div class="option-row">
          <div>
            <strong>Autenticación en dos pasos</strong>
            <p class="section__hint">Protege tu cuenta con un código de verificación adicional</p>
          </div>
          <mat-slide-toggle [formControl]="account.controls.twoFactor" />
        </div>
        <hr />
        <div class="option-row">
          <div>
            <strong>Contraseña</strong>
            <p class="section__hint">Recomendamos cambiarla cada 90 días</p>
          </div>
          <button mat-stroked-button type="button">Cambiar contraseña</button>
        </div>
      </div>

      <div class="vexa-card section">
        <h2 class="vexa-h5">Preferencias del sistema</h2>
        <div class="grid-2">
          <mat-form-field appearance="outline">
            <mat-label>Idioma</mat-label>
            <mat-select [formControl]="prefs.controls.language">
              <mat-option value="es">Español</mat-option>
              <mat-option value="en">English (US)</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Moneda</mat-label>
            <mat-select [formControl]="prefs.controls.currency">
              <mat-option value="COP">COP ($)</mat-option>
              <mat-option value="USD">USD ($)</mat-option>
            </mat-select>
          </mat-form-field>
        </div>
      </div>

      <div class="vexa-card section">
        <h2 class="vexa-h5">Suscripción</h2>
        <div class="plan-row">
          <strong>{{ settings()?.plan ?? '—' }}</strong>
          <span class="vexa-pill vexa-pill--info">Activo</span>
        </div>
        <p class="section__hint">
          Renueva el {{ (settings()?.renewalAt | date: 'mediumDate') ?? '—' }} ·
          {{ settings()?.planPrice ?? 0 | currency: 'USD':'symbol-narrow':'1.0-0' }}/mes
        </p>
        <button mat-stroked-button type="button">Mejorar suscripción</button>
      </div>
    </div>
  `,
  styles: `
    .settings { display: flex; flex-direction: column; gap: 24px; max-width: 720px; }
    .section { display: flex; flex-direction: column; gap: 20px; padding: 28px; }
    .section__head { display: flex; flex-direction: column; gap: 4px; }
    .section__hint { margin: 0; font-size: 13px; color: var(--vexa-gray-400); }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .full { width: 100%; }
    hr { border: none; border-top: 1px solid var(--vexa-gray-200); margin: 0; }
    .option-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
    .option-row strong { font-size: 15px; color: var(--vexa-gray-900); }
    .plan-row { display: flex; align-items: center; gap: 10px; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Settings {
  private readonly fb = inject(FormBuilder);
  private readonly snack = inject(MatSnackBar);
  private readonly api = inject(ApiService);

  protected readonly form = this.fb.nonNullable.group({
    name: [''],
    address: [''],
    adminEmail: [''],
  });

  protected readonly account = this.fb.nonNullable.group({
    twoFactor: [false],
  });

  protected readonly prefs = this.fb.nonNullable.group({
    language: 'es' as 'es' | 'en',
    currency: 'COP' as 'COP' | 'USD',
  });
  protected readonly settings = signal<CompanySettings | null>(null);

  constructor() {
    this.api.get<CompanySettings>('companies/me/settings').subscribe((s) => {
      this.settings.set(s);
      this.form.patchValue({ name: s.name, address: s.address ?? '', adminEmail: s.adminEmail ?? '' });
      this.account.patchValue({ twoFactor: s.twoFactor });
      this.prefs.patchValue({ language: s.language, currency: s.currency });
    });
  }

  save() {
    const dto: CompanySettings = {
      ...this.form.getRawValue(),
      ...this.account.getRawValue(),
      ...this.prefs.getRawValue(),
    } as CompanySettings;
    this.api
      .patch<CompanySettings>('companies/me/settings', dto)
      .subscribe(() => this.snack.open('Configuración guardada', undefined, { duration: 2500 }));
  }
}
