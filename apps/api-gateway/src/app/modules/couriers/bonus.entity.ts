import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { CourierEntity } from './courier.entity';

export enum BonusType {
  LEVEL_MULTIPLIER = 'LEVEL_MULTIPLIER',
  WEEKLY_QUEST = 'WEEKLY_QUEST',
}

@Entity('bonuses')
export class BonusEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ name: 'courier_id' })
  courierId!: string;

  @ManyToOne(() => CourierEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'courier_id' })
  courier!: CourierEntity;

  @Column({ type: 'uuid', name: 'job_id', nullable: true })
  jobId?: string | null;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  amount!: number;

  @Column({ type: 'enum', enum: BonusType })
  type!: BonusType;

  @Column({ length: 160 })
  description!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
