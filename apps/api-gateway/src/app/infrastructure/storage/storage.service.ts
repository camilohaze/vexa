import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'node:crypto';

export interface PresignedUpload {
  key: string;
  uploadUrl: string;
  expiresIn: number;
  publicUrl?: string;
}

export type StorageFolder = 'proofs' | 'documents' | 'invoices' | 'avatars';

@Injectable()
export class StorageService {
  private readonly client?: S3Client;
  private readonly bucket: string;
  private readonly publicUrl?: string;

  constructor(config: ConfigService) {
    const accountId = config.get<string>('R2_ACCOUNT_ID');
    const accessKeyId = config.get<string>('R2_ACCESS_KEY_ID');
    const secretAccessKey = config.get<string>('R2_SECRET_ACCESS_KEY');
    this.bucket = config.get<string>('R2_BUCKET', 'vexa');
    this.publicUrl = config.get<string>('R2_PUBLIC_URL');

    if (accountId && accessKeyId && secretAccessKey) {
      this.client = new S3Client({
        region: 'auto',
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: { accessKeyId, secretAccessKey },
      });
    }
  }

  async presignUpload(folder: StorageFolder, contentType: string, expiresIn = 300): Promise<PresignedUpload> {
    if (!this.client) throw new ServiceUnavailableException('Storage is not configured');
    const ext = contentType.split('/')[1] ?? 'bin';
    const key = `${folder}/${new Date().toISOString().slice(0, 10)}/${randomUUID()}.${ext}`;
    const uploadUrl = await getSignedUrl(
      this.client,
      new PutObjectCommand({ Bucket: this.bucket, Key: key, ContentType: contentType }),
      { expiresIn }
    );
    return {
      key,
      uploadUrl,
      expiresIn,
      publicUrl: this.publicUrl ? `${this.publicUrl}/${key}` : undefined,
    };
  }
}
