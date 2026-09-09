import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { Point } from 'geojson';
import { CourierStatus, VehicleType } from '@vexa/shared';
import { UserEntity } from '../users/user.entity';

@Entity('couriers')
export class CourierEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', unique: true })
  userId!: string;

  @OneToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: UserEntity;

  @Column({ type: 'enum', enum: CourierStatus, default: CourierStatus.OFFLINE })
  status!: CourierStatus;

  @Column({ type: 'enum', enum: VehicleType, default: VehicleType.MOTORCYCLE })
  vehicle!: VehicleType;

  @Column({ type: 'numeric', precision: 3, scale: 2, default: 5 })
  rating!: number;

  @Column({ name: 'ratings_count', type: 'int', default: 0 })
  ratingsCount!: number;

  @Index({ spatial: true })
  @Column({
    name: 'last_location',
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: true,
  })
  lastLocation?: Point | null;

  @Column({ name: 'last_location_at', type: 'timestamptz', nullable: true })
  lastLocationAt?: Date | null;

  @Column({ name: 'fcm_token', nullable: true })
  fcmToken?: string | null;

  /** Estado de verificación: { identity, vehicle, insurance, background } →
   * { status: 'pending'|'verified'|'rejected', urls: string[], meta?: {...} } */
  @Column({ type: 'jsonb', nullable: true })
  verification?: Record<string, { status: string; urls?: string[]; meta?: Record<string, unknown> }> | null;

  @Column({ name: 'vehicle_details', type: 'jsonb', nullable: true })
  vehicleDetails?: { make?: string; year?: number; plate?: string; color?: string } | null;

  @Column({ name: 'payout_details', type: 'jsonb', nullable: true })
  payoutDetails?: { methods: { key: string; label: string; detail: string; fee: string; time: string }[] } | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
