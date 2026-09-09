import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserRole } from '@vexa/shared';
import { JobEntity } from './job.entity';

@Entity('job_messages')
export class JobMessageEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ name: 'job_id' })
  jobId!: string;

  @ManyToOne(() => JobEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'job_id' })
  job!: JobEntity;

  @Column({ name: 'sender_id' })
  senderId!: string;

  @Column({ name: 'sender_role', type: 'enum', enum: UserRole })
  senderRole!: UserRole;

  @Column({ type: 'text' })
  body!: string;

  @CreateDateColumn({ name: 'sent_at', type: 'timestamptz' })
  sentAt!: Date;
}
