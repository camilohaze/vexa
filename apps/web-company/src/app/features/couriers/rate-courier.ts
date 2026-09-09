import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { PageHeader, RatingStars } from '@vexa/ui';
import { JobsService } from '../jobs/jobs.service';

/** Figma: courier-rating — calificación por categorías + feedback. */
@Component({
  selector: 'vexa-rate-courier',
  imports: [MatButtonModule, MatFormFieldModule, MatInputModule, MatSnackBarModule, PageHeader, RatingStars],
  template: `
    <vexa-page-header title="Calificar repartidor" />
    <div class="rate vexa-card">
      <p class="vexa-overline">Calificación general</p>
      <vexa-rating-stars [value]="overall()" [interactive]="true" (rate)="overall.set($event)" />
      @for (cat of categories; track cat.key) {
        <div class="cat">
          <span>{{ cat.label }}</span>
          <vexa-rating-stars
            [value]="scores()[cat.key]"
            [interactive]="true"
            (rate)="setScore(cat.key, $event)"
          />
        </div>
      }
      <mat-form-field>
        <mat-label>Comparte tu opinión (opcional)</mat-label>
        <textarea matInput rows="3" [value]="comment" (input)="comment = $any($event.target).value"
            placeholder="Describe la entrega, la actitud del repartidor, la puntualidad…"></textarea>
      </mat-form-field>
      <button mat-flat-button (click)="submit()">Enviar calificación</button>
    </div>
  `,
  styles: `
    .rate { max-width: 560px; padding: 24px; display: flex; flex-direction: column; gap: 12px; }
    .cat { display: flex; justify-content: space-between; align-items: center; font-size: 14px; }
    mat-form-field { width: 100%; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RateCourier {
  readonly id = input.required<string>();
  private readonly snack = inject(MatSnackBar);
  private readonly router = inject(Router);
  private readonly jobs = inject(JobsService);

  protected readonly overall = signal(0);
  protected comment = '';
  protected readonly categories = [
    { key: 'punctuality', label: 'Puntualidad' },
    { key: 'communication', label: 'Comunicación' },
    { key: 'care', label: 'Cuidado del paquete' },
  ];
  protected readonly scores = signal<Record<string, number>>({
    punctuality: 0,
    communication: 0,
    care: 0,
  });

  setScore(key: string, value: number) {
    this.scores.update((s) => ({ ...s, [key]: value }));
  }

  submit() {
    const score = this.overall() || Math.max(...Object.values(this.scores()));
    this.jobs.rate(this.id(), score || 5, this.comment || undefined).subscribe({
      next: () => {
        this.snack.open('¡Gracias por tu calificación!', undefined, { duration: 2500 });
        this.router.navigate(['/jobs']);
      },
      error: () =>
        this.snack.open('No se pudo enviar la calificación', undefined, { duration: 3000 }),
    });
  }
}
