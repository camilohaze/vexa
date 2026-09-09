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
}
