import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** Sparkline SVG simple (Figma: line charts del dashboard admin). */
@Component({
  selector: 'vexa-line-chart',
  template: `
    <svg class="chart" [attr.viewBox]="'0 0 100 40'" preserveAspectRatio="none" role="img"
        [attr.aria-label]="label()">
      <polyline [attr.points]="points()" fill="none"
          [attr.stroke]="color()" stroke-width="1.6" stroke-linecap="round"
          stroke-linejoin="round" vector-effect="non-scaling-stroke" />
      @if (fill()) {
        <polygon [attr.points]="area()" [attr.fill]="color()" fill-opacity="0.12" />
      }
    </svg>
  `,
  styles: `.chart { display: block; width: 100%; height: 120px; }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LineChart {
  readonly values = input.required<number[]>();
  readonly color = input('#1d4ed8');
  readonly label = input('');
  readonly fill = input(false);

  protected readonly points = computed(() => {
    const vs = this.values();
    if (vs.length < 2) return '';
    const min = Math.min(...vs);
    const max = Math.max(...vs);
    const range = max - min || 1;
    return vs
      .map((v, i) => `${(i / (vs.length - 1)) * 100},${38 - ((v - min) / range) * 36}`)
      .join(' ');
  });

  protected readonly area = computed(() => `0,40 ${this.points()} 100,40`);
}
