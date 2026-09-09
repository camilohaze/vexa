import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type PaymentMethodType = 'card' | 'bank' | 'wallet';

@Entity('company_payment_methods')
@Index(['companyId'])
export class PaymentMethodEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'company_id' })
  companyId!: string;

  @Column({ name: 'method_type', type: 'enum', enum: ['card', 'bank', 'wallet'] })
  methodType!: PaymentMethodType;

  @Column()
  label!: string;

  @Column({ nullable: true })
  sub?: string | null;

  @Column({ name: 'is_default', default: false })
  isDefault!: boolean;

  @Column({ name: 'last4', nullable: true })
  last4?: string | null;

  @Column({ name: 'brand', nullable: true })
  brand?: string | null;

  @Column({ name: 'provider_token', nullable: true })
  providerToken?: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
