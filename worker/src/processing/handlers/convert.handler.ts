import { Injectable, Logger } from '@nestjs/common';
import { Document, NodeIO } from '@gltf-transform/core';
import { resample, prune } from '@gltf-transform/functions';
import { StorageService } from '../../storage/storage.service.js';
import type { JobHandler, JobMessage } from './job.handler.js';

const TEXT_FORMATS = new Set(['gltf', 'obj']);

@Injectable()
export class ConvertHandler implements JobHandler {
  private readonly logger = new Logger(ConvertHandler.name);

  constructor(private readonly storage: StorageService) {}

  async handle(message: JobMessage): Promise<void> {
    this.logger.log(`CONVERT: Downloading ${message.storageKey}`);
    const buffer = await this.storage.download(message.storageKey);

    const io = new NodeIO();
    const format = message.format.toLowerCase();

    this.logger.log(`CONVERT: Converting ${message.fileName} (${format} -> glb)`);

    let doc: Document;
    if (TEXT_FORMATS.has(format)) {
      doc = await io.read(buffer.toString('utf-8'));
    } else {
      doc = await io.readBinary(buffer);
    }

    await doc.transform(
      resample(),
      prune(),
    );

    const converted = await io.writeBinary(doc);

    const convertedKey = message.storageKey.replace(/\.[^.]+$/, '.glb');

    await this.storage.upload(Buffer.from(converted), convertedKey, 'model/gltf-binary');

    this.logger.log(`CONVERT: Uploaded converted model to ${convertedKey}`);
  }
}
