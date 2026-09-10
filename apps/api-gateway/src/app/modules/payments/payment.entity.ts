import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PaymentProvider, PaymentStatus } from '@vexa/shared';
import { JobEntity } from '../jobs/job.entity';

@Entity('payments')
export class PaymentEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ name: 'job_id' })
  jobId!: string;

  @ManyToOne(() => JobEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'job_id' })
  job!: JobEntity;

  @Column({ type: 'enum', enum: PaymentProvider })
  provider!: PaymentProvider;

  @Index({ unique: true })
  @Column({ unique: true })
  reference!: string;

  @Column({ name: 'provider_reference', type: 'varchar', nullable: true })
  providerReference?: string | null;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  amount!: number;

  @Column({ length: 3, default: 'COP' })
  currency!: string;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  status!: PaymentStatus;

  @Column({ name: 'checkout_url', type: 'varchar', nullable: true })
  checkoutUrl?: string | null;

  @Column({ type: 'jsonb', nullable: true })
  raw?: unknown;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
