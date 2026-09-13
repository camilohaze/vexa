import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsIn,
  IsISO8601,
  IsLatitude,
  IsLongitude,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';
import { CourierStatus, VehicleType } from '@vexa/shared';

/** Rango de fecha + paginación, reutilizado por billetera/notificaciones/reseñas del repartidor. */
export class PageDateQueryDto {
  @ApiPropertyOptional({ example: '2026-08-01' })
  @IsOptional()
  @IsISO8601()
  from?: string;

  @ApiPropertyOptional({ example: '2026-08-31' })
  @IsOptional()
  @IsISO8601()
  to?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  page = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  pageSize = 20;
}

export const VERIFICATION_TYPES = ['identity', 'vehicle', 'insurance', 'background'] as const;
export type VerificationType = (typeof VERIFICATION_TYPES)[number];

export class UpdateCourierStatusDto {
  @ApiProperty({ enum: CourierStatus })
  @IsEnum(CourierStatus)
  status!: CourierStatus;
}

export class UpdateCourierLocationDto {
  @ApiProperty({ example: 4.711 })
  @IsLatitude()
  lat!: number;

  @ApiProperty({ example: -74.0721 })
  @IsLongitude()
  lng!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  heading?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  speed?: number;
}

export class RegisterCourierDto {
  @ApiProperty({ enum: VehicleType })
  @IsEnum(VehicleType)
  vehicle!: VehicleType;
}

export class UpdateFcmTokenDto {
  @ApiProperty()
  @IsString()
  fcmToken!: string;
}

export class SubmitVerificationDto {
  @ApiProperty({ enum: VERIFICATION_TYPES })
  @IsIn(VERIFICATION_TYPES)
  type!: VerificationType;

  @ApiProperty({ type: [String], description: 'URLs de documentos subidos a R2' })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  urls!: string[];

  @ApiPropertyOptional()
  @IsOptional()
  meta?: Record<string, unknown>;
}

export class UpdateVehicleDetailsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  make?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  year?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  plate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ enum: VehicleType })
  @IsOptional()
  @IsEnum(VehicleType)
  vehicleType?: VehicleType;
}

export class CreatePayoutDto {
  @ApiProperty({ example: 120.5 })
  @IsNumber()
  amount!: number;

  @ApiProperty({ example: 'bank_transfer' })
  @IsString()
  method!: string;
}
