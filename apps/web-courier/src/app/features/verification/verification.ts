import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { CourierVerification, CouriersService, VerificationStep } from '../../core/couriers/couriers.service';

const STEP_META: Record<VerificationStep['type'], { title: string; desc: string }> = {
  identity: { title: 'Identidad', desc: 'Documento de identidad válido y verificable.' },
  vehicle: { title: 'Documentos del vehículo', desc: 'Tarjeta de propiedad y matrícula vigente.' },
  insurance: { title: 'Seguro', desc: 'Póliza de responsabilidad civil vigente.' },
  background: { title: 'Verificación de antecedentes', desc: 'Revisión de antecedentes para operar en Vexa.' },
};

/** Figma: web-verification-center */
@Component({
  selector: 'vexa-verification',
  imports: [FormsModule, MatIconModule],
  template: `
    <div class="banner" [class.banner--warn]="(verification()?.progress ?? 0) < 1">
      <mat-icon>{{ (verification()?.progress ?? 0) < 1 ? 'error_outline' : 'check_circle' }}</mat-icon>
      <div>
        <strong>{{ (verification()?.progress ?? 0) < 1 ? 'Verificación en progreso' : 'Todos los documentos verificados' }}</strong>
        <p>{{ bannerText() }}</p>
      </div>
    </div>

    <div class="grid">
      @for (step of verification()?.steps ?? []; track step.type) {
        <div class="vexa-card doc-card">
          <div class="doc-card__head">
            <h3 class="vexa-h5">{{ STEP_META[step.type].title }}</h3>
            <span class="status-badge" [class]="'status-badge--' + step.status">{{ statusLabel(step.status) }}</span>
          </div>
          <p class="doc-card__desc">{{ STEP_META[step.type].desc }}</p>
          @if (step.urls.length) {
            <a [href]="step.urls[0]" target="_blank" rel="noopener" class="link">Ver documento</a>
          }
          @if (step.meta?.docNumber || step.meta?.expiresAt) {
            <div class="doc-meta">
              @if (step.meta?.docNumber) { <span>N.º documento: <strong>{{ step.meta?.docNumber }}</strong></span> }
              @if (step.meta?.expiresAt) { <span>Vence: <strong>{{ step.meta?.expiresAt }}</strong></span> }
            </div>
          }
          <hr />
          <div class="upload-row">
            <input type="url" placeholder="URL del documento" [(ngModel)]="urlDraft[step.type]" />
          </div>
          <div class="upload-row">
            <input type="text" placeholder="N.º de documento (opcional)" [(ngModel)]="docNumberDraft[step.type]" />
            <input type="date" placeholder="Vencimiento" [(ngModel)]="expiresAtDraft[step.type]" />
          </div>
          <button type="button" class="submit-btn" (click)="submit(step.type)" [disabled]="!urlDraft[step.type] || submitting() === step.type">
            {{ submitting() === step.type ? 'Enviando…' : 'Enviar' }}
          </button>
        </div>
      }
    </div>
  `,
  styles: `
    .banner {
      display: flex; align-items: center; gap: 16px; padding: 24px; border-radius: var(--vexa-radius-lg);
      background: var(--vexa-success-100); border: 1px solid var(--vexa-success-500); margin-bottom: 24px;
      mat-icon { color: var(--vexa-success-700); flex: none; }
      strong { display: block; font-size: 18px; color: var(--vexa-gray-900); margin-bottom: 4px; }
      p { margin: 0; font-size: 14px; color: var(--vexa-gray-600); }
    }
    .banner--warn {
      background: var(--vexa-warning-100); border-color: var(--vexa-warning-500);
      mat-icon { color: var(--vexa-warning-700); }
    }

    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px; }
    .doc-card { display: flex; flex-direction: column; gap: 16px; padding: 28px; }
    .doc-card__head { display: flex; align-items: center; justify-content: space-between; }
    .doc-card__desc { margin: 0; font-size: 14px; color: var(--vexa-gray-600); }
    .status-badge { font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 8px; }
    .status-badge--verified { background: var(--vexa-success-100); color: var(--vexa-success-700); }
    .status-badge--pending { background: var(--vexa-warning-100); color: var(--vexa-warning-700); }
    .status-badge--required, .status-badge--rejected { background: var(--vexa-error-100); color: var(--vexa-error-700); }
    .link { color: var(--vexa-primary-600); font-size: 13px; font-weight: 600; text-decoration: none; }
    hr { border: none; border-top: 1px solid var(--vexa-gray-200); margin: 0; }
    .upload-row { display: flex; gap: 8px; }
    .upload-row input {
      flex: 1 1 auto; min-width: 0; padding: 10px 12px; border-radius: var(--vexa-radius-sm);
      border: 1px solid var(--vexa-gray-200); font-size: 13px;
    }
    .doc-meta { display: flex; flex-direction: column; gap: 2px; font-size: 12px; color: var(--vexa-gray-600); }
    .doc-meta strong { color: var(--vexa-gray-900); }
    .submit-btn {
      background: var(--vexa-primary-600); color: #fff; border: none; border-radius: var(--vexa-radius-sm);
      padding: 10px 16px; font-size: 13px; font-weight: 600; cursor: pointer;
      &:disabled { opacity: 0.5; cursor: not-allowed; }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Verification {
  private readonly couriers = inject(CouriersService);
  protected readonly STEP_META = STEP_META;

  protected readonly verification = signal<CourierVerification | null>(null);
  protected readonly submitting = signal<string | null>(null);
  protected readonly urlDraft: Record<string, string> = {};
  protected readonly docNumberDraft: Record<string, string> = {};
  protected readonly expiresAtDraft: Record<string, string> = {};

  protected readonly bannerText = computed(() => {
    const v = this.verification();
    if (!v) return '';
    const pending = v.steps.filter((s) => s.status !== 'verified').length;
    return pending === 0
      ? 'Tu cuenta está al día y tu acceso a despachos está activo.'
      : `Tienes ${pending} documento(s) pendiente(s) de verificación.`;
  });

  constructor() {
    this.load();
  }

  private load() {
    this.couriers.verification().subscribe((v) => this.verification.set(v));
  }

  submit(type: VerificationStep['type']) {
    const url = this.urlDraft[type];
    if (!url) return;
    this.submitting.set(type);
    const meta = {
      ...(this.docNumberDraft[type] ? { docNumber: this.docNumberDraft[type] } : {}),
      ...(this.expiresAtDraft[type] ? { expiresAt: this.expiresAtDraft[type] } : {}),
    };
    this.couriers.submitVerification(type, [url], Object.keys(meta).length ? meta : undefined).subscribe({
      next: () => {
        this.submitting.set(null);
        this.urlDraft[type] = '';
        this.docNumberDraft[type] = '';
        this.expiresAtDraft[type] = '';
        this.load();
      },
      error: () => this.submitting.set(null),
    });
  }

  protected statusLabel(s: string): string {
    return { verified: 'Verificado', pending: 'En revisión', required: 'Requerido', rejected: 'Rechazado' }[s] ?? s;
  }
}
