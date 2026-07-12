import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { PrismaModule } from './prisma/prisma.module.js';
import { ProcessingModule } from './processing/processing.module.js';

@Module({
  controllers: [HealthController],
  imports: [
    PrismaModule,
    ProcessingModule,
  ],
})
export class AppModule {}
