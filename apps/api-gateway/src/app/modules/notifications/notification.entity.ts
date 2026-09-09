import { UserRole } from '@vexa/shared';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export type NotificationScope = 'global' | 'company' | 'courier';

@Entity('notifications')
@Index(['scope', 'companyId'])
@Index(['scope', 'courierId'])
export class NotificationEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'scope', type: 'enum', enum: ['global', 'company', 'courier'] })
  scope!: NotificationScope;

  @Column({ name: 'company_id', nullable: true })
  companyId?: string | null;

  @Column({ name: 'courier_id', nullable: true })
  courierId?: string | null;

  @Column({ type: 'enum', enum: UserRole, name: 'audience', nullable: true })
  audience?: UserRole | null;

  @Column()
  icon!: string;

  @Column()
  title!: string;

  @Column()
  body!: string;

  @Column({ name: 'is_read', default: false })
  isRead!: boolean;

  @Column({ name: 'reference_id', nullable: true })
  referenceId?: string | null;

  @Column({ name: 'reference_type', nullable: true })
  referenceType?: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
