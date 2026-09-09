import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CourierStatus, JobStatus } from '@vexa/shared';

type PillKind = 'success' | 'warning' | 'error' | 'info' | 'neutral';

const STATUS_META: Record<string, { label: string; kind: PillKind }> = {
  [JobStatus.PENDING]: { label: 'Pendiente', kind: 'warning' },
  [JobStatus.OFFERED]: { label: 'Ofrecido', kind: 'info' },
  [JobStatus.ACCEPTED]: { label: 'Aceptado', kind: 'info' },
  [JobStatus.PICKED_UP]: { label: 'Recogido', kind: 'info' },
  [JobStatus.IN_TRANSIT]: { label: 'En ruta', kind: 'info' },
  [JobStatus.DELIVERED]: { label: 'Entregado', kind: 'success' },
  [JobStatus.CANCELLED]: { label: 'Cancelado', kind: 'error' },
  [CourierStatus.OFFLINE]: { label: 'Desconectado', kind: 'neutral' },
  [CourierStatus.AVAILABLE]: { label: 'Disponible', kind: 'success' },
  [CourierStatus.BUSY]: { label: 'Ocupado', kind: 'info' },
};

@Component({
  selector: 'vexa-status-chip',
  template: `<span class="vexa-pill" [class]="'vexa-pill vexa-pill--' + meta().kind">{{ meta().label }}</span>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusChip {
  readonly status = input.required<JobStatus | CourierStatus | string>();
  protected readonly meta = computed(
    () => STATUS_META[this.status()] ?? { label: this.status(), kind: 'neutral' as PillKind }
  );
}
