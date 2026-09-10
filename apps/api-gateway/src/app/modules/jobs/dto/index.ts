import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsLatitude,
  Max,
  Min,
  IsLongitude,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUrl,
  Length,
  ValidateNested,
} from 'class-validator';
import { Address, JobStatus } from '@vexa/shared';

export class AddressDto implements Address {
  @ApiProperty({ example: 'Calle 100 # 15-20' })
  @IsString()
  @Length(3, 200)
  line1!: string;

  @ApiPropertyOptional({ example: 'Oficina 302' })
  @IsOptional()
  @IsString()
  line2?: string;

  @ApiProperty({ example: 'Bogotá' })
  @IsString()
  city!: string;

  @ApiPropertyOptional({ example: 'Edificio azul, portería 2' })
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiProperty({ example: 4.6861 })
  @IsLatitude()
  lat!: number;

  @ApiProperty({ example: -74.0451 })
  @IsLongitude()
  lng!: number;
}

export class CreateJobDto {
  @ApiProperty({ type: AddressDto })
  @ValidateNested()
  @Type(() => AddressDto)
  pickup!: AddressDto;

  @ApiProperty({ type: AddressDto })
  @ValidateNested()
  @Type(() => AddressDto)
  dropoff!: AddressDto;

  @ApiProperty({ example: 12000, description: 'Precio en COP' })
  @IsNumber()
  @IsPositive()
  price!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class ListJobsQueryDto {
  @ApiPropertyOptional({ enum: JobStatus })
  @IsOptional()
  @IsEnum(JobStatus)
  status?: JobStatus;

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

export class CompleteJobDto {
  @ApiPropertyOptional({ description: 'URL en R2 de la prueba de entrega' })
  @IsOptional()
  @IsUrl({ require_tld: false })
  proofOfDeliveryUrl?: string;
}

export class CancelJobDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}

export class PriceEstimateQueryDto {
  @ApiProperty({ example: 4.711 })
  @Type(() => Number)
  @IsLatitude()
  pickupLat!: number;

  @ApiProperty({ example: -74.0721 })
  @Type(() => Number)
  @IsLongitude()
  pickupLng!: number;

  @ApiProperty({ example: 4.65 })
  @Type(() => Number)
  @IsLatitude()
  dropoffLat!: number;

  @ApiProperty({ example: -74.1 })
  @Type(() => Number)
  @IsLongitude()
  dropoffLng!: number;

  @ApiPropertyOptional({ example: 2, description: 'Peso en kg' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  weightKg?: number;

  @ApiPropertyOptional({ enum: ['standard', 'express', 'same_day'] })
  @IsOptional()
  @IsIn(['standard', 'express', 'same_day'])
  priority?: 'standard' | 'express' | 'same_day';
}

export class SendMessageDto {
  @ApiProperty()
  @IsString()
  @Length(1, 2000)
  body!: string;
}

export class RateJobDto {
  @ApiProperty({ description: 'Puntuación 1–5' })
  @IsInt()
  @Min(1)
  @Max(5)
  score!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  comment?: string;
}
