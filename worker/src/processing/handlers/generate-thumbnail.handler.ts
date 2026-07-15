import { Injectable, Logger } from '@nestjs/common';
import { Document, NodeIO } from '@gltf-transform/core';
import { StorageService } from '../../storage/storage.service.js';
import type { JobHandler, JobMessage } from './job.handler.js';

@Injectable()
export class GenerateThumbnailHandler implements JobHandler {
  private readonly logger = new Logger(GenerateThumbnailHandler.name);

  constructor(private readonly storage: StorageService) {}

  async handle(message: JobMessage): Promise<void> {
    this.logger.log(`THUMBNAIL: Downloading ${message.storageKey}`);
    const buffer = await this.storage.download(message.storageKey);

    const io = new NodeIO();
    const doc = await io.readBinary(buffer);

    this.logger.log(`THUMBNAIL: Generating thumbnail for ${message.fileName}`);

    const thumbnail = this.extractFirstTexture(doc) ?? this.createPlaceholder();

    const thumbnailKey = message.storageKey.replace(/\.[^.]+$/, '_thumb.png');

    await this.storage.upload(thumbnail, thumbnailKey, 'image/png');

    this.logger.log(`THUMBNAIL: Uploaded thumbnail to ${thumbnailKey}`);
  }

  private extractFirstTexture(doc: Document): Buffer | null {
    const textures = doc.getRoot().listTextures();
    if (textures.length === 0) return null;

    const texture = textures[0];
    const image = texture.getImage();
    if (!image) return null;

    return Buffer.from(image);
  }

  private createPlaceholder(): Buffer {
    const width = 128;
    const height = 128;

    const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

    const ihdrData = Buffer.alloc(13);
    ihdrData.writeUInt32BE(width, 0);
    ihdrData.writeUInt32BE(height, 4);
    ihdrData[8] = 8;
    ihdrData[9] = 2;
    ihdrData[10] = 0;
    ihdrData[11] = 0;
    ihdrData[12] = 0;

    const ihdr = this.createChunk('IHDR', ihdrData);

    const rawData: number[] = [];
    for (let y = 0; y < height; y++) {
      rawData.push(0);
      for (let x = 0; x < width; x++) {
        rawData.push(60);
        rawData.push(60);
        rawData.push(70);
      }
    }
    const idat = this.createChunk('IDAT', Buffer.from(new Uint8Array(rawData)));

    const iend = this.createChunk('IEND', Buffer.alloc(0));

    return Buffer.concat([signature, ihdr, idat, iend]);
  }

  private createChunk(type: string, data: Buffer): Buffer {
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length, 0);

    const typeBuffer = Buffer.from(type, 'ascii');
    const crcData = Buffer.concat([typeBuffer, data]);

    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(this.crc32(crcData), 0);

    return Buffer.concat([length, typeBuffer, data, crc]);
  }

  private crc32(buf: Buffer): number {
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      crc ^= buf[i];
      for (let j = 0; j < 8; j++) {
        if (crc & 1) {
          crc = (crc >>> 1) ^ 0xedb88320;
        } else {
          crc = crc >>> 1;
        }
      }
    }
    return (crc ^ 0xffffffff) >>> 0;
  }
}
