import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export interface CommissionTier {
  name: string;
  desc: string;
  rate: string;
  threshold?: number;
}

@Entity('commission_config')
export class CommissionConfigEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'base_rate', type: 'decimal', precision: 5, scale: 2 })
  baseRate!: number;

  @Column({ type: 'jsonb', default: [] })
  tiers!: CommissionTier[];

  @Column({ type: 'jsonb', default: {} })
  meta!: Record<string, unknown>;
}
