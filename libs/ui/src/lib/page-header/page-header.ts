import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'vexa-page-header',
  imports: [],
  template: `
    <header class="page-header">
      <div>
        <h1>{{ title() }}</h1>
        @if (subtitle()) {
          <p class="subtitle">{{ subtitle() }}</p>
        }
      </div>
      <div class="actions">
        <ng-content select="[actions]" />
      </div>
    </header>
  `,
  styles: `
    .page-header {
      display: flex; align-items: flex-end; justify-content: space-between;
      gap: 16px; margin-bottom: 24px;
    }
    h1 { margin: 0; font: var(--mat-sys-headline-medium); }
    .subtitle { margin: 4px 0 0; color: var(--mat-sys-on-surface-variant); }
    .actions { display: flex; gap: 8px; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageHeader {
  title = input.required<string>();
  subtitle = input<string>();
}
