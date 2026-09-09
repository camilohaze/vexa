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
import type { Point } from 'geojson';
import { Address, JobStatus } from '@vexa/shared';
import { CompanyEntity } from '../companies/company.entity';
import { CourierEntity } from '../couriers/courier.entity';

@Entity('jobs')
export class JobEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ name: 'company_id' })
  companyId!: string;

  @ManyToOne(() => CompanyEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'company_id' })
  company!: CompanyEntity;

  @Index()
  @Column({ name: 'courier_id', nullable: true })
  courierId?: string | null;

  @ManyToOne(() => CourierEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'courier_id' })
  courier?: CourierEntity | null;

  @Index()
  @Column({ type: 'enum', enum: JobStatus, default: JobStatus.PENDING })
  status!: JobStatus;

  @Column({ type: 'jsonb' })
  pickup!: Address;

  @Index({ spatial: true })
  @Column({
    name: 'pickup_point',
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326,
  })
  pickupPoint!: Point;

  @Column({ type: 'jsonb' })
  dropoff!: Address;

  @Column({
    name: 'dropoff_point',
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326,
  })
  dropoffPoint!: Point;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  price!: number;

  @Column({ name: 'distance_meters', type: 'int', nullable: true })
  distanceMeters?: number | null;

  @Column({ type: 'text', nullable: true })
  notes?: string | null;

  @Column({ name: 'proof_of_delivery_url', nullable: true })
  proofOfDeliveryUrl?: string | null;

  @Column({ name: 'rating_score', type: 'int', nullable: true })
  ratingScore?: number | null;

  @Column({ name: 'rating_comment', type: 'text', nullable: true })
  ratingComment?: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @Column({ name: 'accepted_at', type: 'timestamptz', nullable: true })
  acceptedAt?: Date | null;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt?: Date | null;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
