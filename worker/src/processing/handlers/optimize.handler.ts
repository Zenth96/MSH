import { Injectable, Logger } from '@nestjs/common';
import { Document, NodeIO } from '@gltf-transform/core';
import { dedup, prune, quantize, flatten } from '@gltf-transform/functions';
import { StorageService } from '../../storage/storage.service.js';
import type { JobHandler, JobMessage } from './job.handler.js';

@Injectable()
export class OptimizeHandler implements JobHandler {
  private readonly logger = new Logger(OptimizeHandler.name);

  constructor(private readonly storage: StorageService) {}

  async handle(message: JobMessage): Promise<void> {
    this.logger.log(`OPTIMIZE: Downloading ${message.storageKey}`);
    const buffer = await this.storage.download(message.storageKey);

    const io = new NodeIO();
    const doc = await io.readBinary(buffer);

    this.logger.log(`OPTIMIZE: Processing ${message.fileName}`);

    await doc.transform(
      dedup(),
      prune(),
      quantize(),
      flatten(),
    );

    const optimized = await io.writeBinary(doc);

    const ext = message.format === 'gltf' ? 'gltf' : 'glb';
    const optimizedKey = message.storageKey.replace(/\.[^.]+$/, `_optimized.${ext}`);

    await this.storage.upload(Buffer.from(optimized), optimizedKey, 'model/gltf-binary');

    this.logger.log(`OPTIMIZE: Uploaded optimized model to ${optimizedKey}`);
  }
}
