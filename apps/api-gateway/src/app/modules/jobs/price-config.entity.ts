import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('price_config')
export class PriceConfigEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 8000 })
  base!: number;

  @Column({ name: 'per_km', type: 'decimal', precision: 10, scale: 2, default: 1500 })
  perKm!: number;

  @Column({ name: 'per_kg', type: 'decimal', precision: 10, scale: 2, default: 500 })
  perKg!: number;

  @Column({ name: 'per_minute', type: 'decimal', precision: 10, scale: 2, default: 120 })
  perMinute!: number;

  @Column({ name: 'express_multiplier', type: 'decimal', precision: 5, scale: 2, default: 1.35 })
  expressMultiplier!: number;

  @Column({ name: 'same_day_multiplier', type: 'decimal', precision: 5, scale: 2, default: 1.6 })
  sameDayMultiplier!: number;

  @Column({ name: 'commission_percent', type: 'decimal', precision: 5, scale: 2, default: 20 })
  commissionPercent!: number;

  /** Multiplicador máximo aplicado cuando hay muy pocos repartidores disponibles frente a la demanda cercana. */
  @Column({ name: 'demand_multiplier_max', type: 'decimal', precision: 5, scale: 2, default: 1.3 })
  demandMultiplierMax!: number;
}
