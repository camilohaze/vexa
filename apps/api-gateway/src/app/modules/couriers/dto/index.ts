import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsEnum, IsIn, IsLatitude, IsLongitude, IsNumber, IsOptional, IsString } from 'class-validator';
import { CourierStatus, VehicleType } from '@vexa/shared';

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
