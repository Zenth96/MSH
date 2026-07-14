import { Injectable, Logger } from '@nestjs/common';
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor() {
    const endpoint = process.env.MINIO_ENDPOINT ?? 'localhost';
    const port = process.env.MINIO_PORT ?? '9000';
    const accessKey = process.env.MINIO_ACCESS_KEY ?? 'msh';
    const secretKey = process.env.MINIO_SECRET_KEY ?? 'msh_secret';
    const useSsl = process.env.MINIO_USE_SSL === 'true';
    this.bucket = process.env.MINIO_BUCKET ?? 'msh-models';
    const scheme = useSsl ? 'https' : 'http';

    this.client = new S3Client({
      region: 'us-east-1',
      endpoint: `${scheme}://${endpoint}:${port}`,
      credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
      },
      forcePathStyle: true,
    });
  }

  async download(key: string): Promise<Buffer> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    const response = await this.client.send(command);
    const chunks: Uint8Array[] = [];
    const stream = response.Body;

    if (!stream) {
      throw new Error(`Empty response body for key: ${key}`);
    }

    for await (const chunk of stream as AsyncIterable<Uint8Array>) {
      chunks.push(chunk);
    }

    return Buffer.concat(chunks);
  }

  async upload(buffer: Buffer, key: string, contentType?: string): Promise<void> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    });

    await this.client.send(command);
    this.logger.log(`Uploaded: ${key}`);
  }
}
