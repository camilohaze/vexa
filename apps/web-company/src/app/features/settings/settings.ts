import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { PageHeader } from '@vexa/ui';
import { AuthStore } from '../../core/auth/auth.store';
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

/** Figma: company-settings — perfil de empresa, seguridad, preferencias, suscripción. */
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
    PageHeader,
    ReactiveFormsModule,
  ],
  template: `
    <vexa-page-header title="Configuración" />
    <div class="settings">
      <form class="vexa-card block" [formGroup]="form" (ngSubmit)="save()">
        <h3 class="vexa-overline">Perfil de empresa</h3>
        <mat-form-field><mat-label>Nombre de la empresa</mat-label>
          <input matInput formControlName="name" /></mat-form-field>
        <mat-form-field><mat-label>Dirección corporativa</mat-label>
          <input matInput formControlName="address" /></mat-form-field>
        <button mat-flat-button type="submit">Guardar cambios</button>
      </form>

      <form class="vexa-card block" [formGroup]="account">
        <h3 class="vexa-overline">Cuenta y seguridad</h3>
        <mat-form-field><mat-label>Correo de administrador</mat-label>
          <input matInput formControlName="adminEmail" /></mat-form-field>
        <mat-slide-toggle formControlName="twoFactor">
          Autenticación en dos pasos
        </mat-slide-toggle>
      </form>

      <form class="vexa-card block" [formGroup]="prefs">
        <h3 class="vexa-overline">Preferencias</h3>
        <mat-form-field><mat-label>Idioma</mat-label>
          <mat-select formControlName="language">
            <mat-option value="es">Español</mat-option>
            <mat-option value="en">English (US)</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field><mat-label>Moneda</mat-label>
          <mat-select formControlName="currency">
            <mat-option value="COP">COP ($)</mat-option>
            <mat-option value="USD">USD ($)</mat-option>
          </mat-select>
        </mat-form-field>
      </form>

      <div class="vexa-card block sub">
        <h3 class="vexa-overline">Suscripción</h3>
        <div class="sub__plan">
          <strong>{{ settings()?.plan ?? '—' }}</strong>
          <span class="vexa-pill vexa-pill--info">Activo</span>
        </div>
        <p class="muted">Renueva el {{ (settings()?.renewalAt | date:'mediumDate') ?? '—' }} · {{ settings()?.planPrice ?? 0 | currency:'USD':'symbol-narrow':'1.0-0' }}/mes</p>
        <button mat-stroked-button>Mejorar suscripción</button>
      </div>

      <button mat-flat-button color="warn" class="logout" (click)="auth.logout()">
        Cerrar sesión
      </button>
    </div>
  `,
  styles: `
    .settings { display: flex; flex-direction: column; gap: 16px; max-width: 640px; }
    .block { padding: 20px; display: flex; flex-direction: column; gap: 8px; }
    .muted { color: var(--vexa-gray-500); margin: 0; font-size: 13px; }
    .sub__plan { display: flex; align-items: center; gap: 10px; }
    .logout { align-self: flex-start; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Settings {
  private readonly fb = inject(FormBuilder);
  private readonly snack = inject(MatSnackBar);
  private readonly api = inject(ApiService);
  protected readonly auth = inject(AuthStore);

  protected readonly form = this.fb.nonNullable.group({
    name: [''],
    address: [''],
  });

  protected readonly account = this.fb.nonNullable.group({
    adminEmail: [''],
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
      this.form.patchValue({ name: s.name, address: s.address ?? '' });
      this.account.patchValue({ adminEmail: s.adminEmail ?? '', twoFactor: s.twoFactor });
      this.prefs.patchValue({ language: s.language, currency: s.currency });
    });
  }

  save() {
    const dto: CompanySettings = {
      ...this.form.getRawValue(),
      ...this.account.getRawValue(),
      ...this.prefs.getRawValue(),
    } as CompanySettings;
    this.api.patch<CompanySettings>('companies/me/settings', dto).subscribe(() =>
      this.snack.open('Configuración guardada', undefined, { duration: 2500 })
    );
  }
}
