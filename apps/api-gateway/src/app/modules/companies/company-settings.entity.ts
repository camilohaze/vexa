import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';
import { CompanyEntity } from './company.entity';

@Entity('company_settings')
export class CompanySettingsEntity {
  @PrimaryColumn({ name: 'company_id' })
  companyId!: string;

  @OneToOne(() => CompanyEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company!: CompanyEntity;

  @Column({ name: 'admin_email', nullable: true })
  adminEmail?: string | null;

  @Column({ name: 'two_factor', default: false })
  twoFactor!: boolean;

  @Column({ default: 'es' })
  language!: string;

  @Column({ default: 'COP' })
  currency!: string;

  @Column({ nullable: true })
  address?: string | null;

  @Column({ type: 'jsonb', default: {} })
  meta!: Record<string, unknown>;

  @Column({ nullable: true })
  plan?: string | null;

  @Column({ name: 'plan_price', type: 'decimal', precision: 10, scale: 2, nullable: true })
  planPrice?: number | null;

  @Column({ name: 'renewal_at', type: 'timestamptz', nullable: true })
  renewalAt?: Date | null;
}
