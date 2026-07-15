import { Module } from '@nestjs/common';
import { HealthController } from './health.controller.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { StorageModule } from './storage/storage.module.js';
import { ProcessingModule } from './processing/processing.module.js';

@Module({
  controllers: [HealthController],
  imports: [PrismaModule, StorageModule, ProcessingModule],
})
export class AppModule {}
