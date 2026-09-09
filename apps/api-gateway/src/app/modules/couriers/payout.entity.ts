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

export enum PayoutStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

@Entity('payouts')
export class PayoutEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ name: 'courier_id' })
  courierId!: string;

  @ManyToOne(() => CourierEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'courier_id' })
  courier!: CourierEntity;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  amount!: number;

  @Column({ length: 32 })
  method!: string;

  @Column({ type: 'enum', enum: PayoutStatus, default: PayoutStatus.PENDING })
  status!: PayoutStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
