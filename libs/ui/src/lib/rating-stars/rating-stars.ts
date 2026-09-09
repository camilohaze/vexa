import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'vexa-rating-stars',
  imports: [MatIconModule],
  template: `
    <span class="stars" role="img" [attr.aria-label]="value() + ' de 5'">
      @for (i of [1,2,3,4,5]; track i) {
        @if (interactive()) {
          <button type="button" class="stars__btn" (click)="rate.emit(i)">
            <mat-icon [class.stars__on]="i <= value()">{{ i <= value() ? 'star' : 'star_border' }}</mat-icon>
          </button>
        } @else {
          <mat-icon [class.stars__on]="i <= value()">{{ i <= value() ? 'star' : 'star_border' }}</mat-icon>
        }
      }
    </span>
  `,
  styles: `
    .stars { display: inline-flex; align-items: center; gap: 2px; color: var(--vexa-gray-300); }
    .stars__on { color: var(--vexa-warning-500); }
    mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .stars__btn { background: none; border: 0; padding: 0; cursor: pointer; display: inline-flex; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RatingStars {
  readonly value = input.required<number>();
  readonly interactive = input(false);
  readonly rate = output<number>();
}
