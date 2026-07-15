import { Module } from '@nestjs/common';
import { ProcessingService } from './processing.service.js';
import { OptimizeHandler } from './handlers/optimize.handler.js';
import { ConvertHandler } from './handlers/convert.handler.js';
import { GenerateThumbnailHandler } from './handlers/generate-thumbnail.handler.js';

@Module({
  providers: [ProcessingService, OptimizeHandler, ConvertHandler, GenerateThumbnailHandler],
  exports: [ProcessingService],
})
export class ProcessingModule {}
