import { Module } from '@nestjs/common';
import { ProcessingService } from './processing.service.js';

@Module({
  providers: [ProcessingService],
})
export class ProcessingModule {}
