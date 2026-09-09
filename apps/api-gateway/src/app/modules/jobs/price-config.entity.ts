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

  @Column({ name: 'express_multiplier', type: 'decimal', precision: 5, scale: 2, default: 1.35 })
  expressMultiplier!: number;

  @Column({ name: 'same_day_multiplier', type: 'decimal', precision: 5, scale: 2, default: 1.35 })
  sameDayMultiplier!: number;
}
