import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { PageHeader } from '@vexa/ui';
import { ApiService } from '../../core/api/api.service';

/** Figma: reports-hub — reportes predefinidos, generador y automatización. */
@Component({
  selector: 'vexa-reports',
  imports: [MatButtonModule, MatFormFieldModule, MatIconModule, MatSelectModule, PageHeader],
  template: `
    <vexa-page-header title="Centro de reportes" />

    @if (data(); as d) {
    <div class="cards">
      @for (r of d.reports; track r.title) {
        <div class="rep vexa-card">
          <mat-icon>{{ r.icon }}</mat-icon>
          <strong>{{ r.title }}</strong>
          <small>{{ r.desc }}</small>
        </div>
      }
    </div>

    <div class="grid">
      <div class="vexa-card block">
        <h3 class="vexa-overline">Generar reporte personalizado</h3>
        <mat-form-field><mat-label>Rango de fechas</mat-label>
          <mat-select value="30d">
            <mat-option value="7d">Últimos 7 días</mat-option>
            <mat-option value="30d">Últimos 30 días</mat-option>
            <mat-option value="q">Este trimestre</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field><mat-label>Formato de exportación</mat-label>
          <mat-select value="pdf">
            <mat-option value="pdf">PDF (.pdf)</mat-option>
            <mat-option value="csv">CSV</mat-option>
            <mat-option value="xlsx">Excel</mat-option>
          </mat-select>
        </mat-form-field>
        <button mat-flat-button (click)="generate()">Compilar y descargar</button>
      </div>

      <div class="vexa-card block">
        <h3 class="vexa-overline">Automatización programada</h3>
        @for (a of d.automation; track a.name) {
          <div class="auto">
            <mat-icon>schedule</mat-icon>
            <div><strong>{{ a.name }}</strong><small>{{ a.freq }}</small></div>
          </div>
        }
      </div>
    </div>
    }
  `,
  styles: `
    .cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 20px; }
    @media (max-width: 900px) { .cards { grid-template-columns: 1fr; } }
    .rep { padding: 20px; display: flex; flex-direction: column; gap: 6px; }
    .rep mat-icon { color: var(--vexa-primary-600); }
    .rep small { color: var(--vexa-gray-500); }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; max-width: 900px; }
    @media (max-width: 800px) { .grid { grid-template-columns: 1fr; } }
    .block { padding: 20px; display: flex; flex-direction: column; gap: 10px; }
    .auto { display: flex; gap: 12px; align-items: center; padding: 10px 0; border-top: 1px solid var(--vexa-gray-100); }
    .auto mat-icon { color: var(--vexa-gray-500); }
    .auto small { display: block; color: var(--vexa-gray-500); }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Reports {
  private readonly api = inject(ApiService);
  protected readonly data = signal<{ reports: { icon: string; title: string; desc: string }[]; automation: { name: string; freq: string }[] } | null>(null);
  protected readonly reports = () => this.data()?.reports ?? [];

  constructor() {
    this.api.get<{ reports: { icon: string; title: string; desc: string }[]; automation: { name: string; freq: string }[] }>('admin/reports')
      .subscribe((d) => this.data.set(d));
  }

  generate() {
    this.api.post<Blob>('admin/reports/generate', { range: '30d', format: 'pdf' }).subscribe({
      next: () => undefined,
      error: () => undefined,
    });
  }
}
