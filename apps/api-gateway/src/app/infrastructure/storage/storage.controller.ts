import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsIn, IsMimeType } from 'class-validator';
import { Transform } from 'class-transformer';
import { StorageFolder, StorageService } from './storage.service';

class PresignQueryDto {
  @IsIn(['proofs', 'documents', 'invoices', 'avatars'])
  folder!: StorageFolder;

  @IsMimeType()
  contentType!: string;

  @Transform(({ value }) => Number(value))
  @IsIn([300, 600, 900], { message: 'expiresIn must be 300, 600 or 900 seconds' })
  expiresIn = 300;
}

@ApiTags('storage')
@ApiBearerAuth()
@Controller('storage')
export class StorageController {
  constructor(private readonly storage: StorageService) {}

  @Get('presign')
  presign(@Query() query: PresignQueryDto) {
    return this.storage.presignUpload(query.folder, query.contentType, query.expiresIn);
  }
}
