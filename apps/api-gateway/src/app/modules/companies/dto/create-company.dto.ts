import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class CreateCompanyDto {
  @ApiProperty({ example: 'Logística Andina S.A.S.' })
  @IsString()
  @Length(2, 120)
  name!: string;

  @ApiProperty({ example: '900123456-7', description: 'NIT' })
  @IsString()
  @Length(5, 30)
  taxId!: string;
}
