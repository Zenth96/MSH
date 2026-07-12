import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module.js';
import { ProcessingModule } from './processing/processing.module.js';

@Module({
  imports: [
    PrismaModule,
    ProcessingModule,
  ],
})
export class AppModule {}
