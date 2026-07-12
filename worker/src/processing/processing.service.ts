import { Injectable } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class ProcessingService {
  constructor(private readonly prisma: PrismaService) {}

  @EventPattern('model.process')
  async handleModelProcessing(@Payload() message: any) {
    console.log('[ProcessingService] Üzenet érkezett a model_processing queue-ból:');
    console.log(JSON.stringify(message, null, 2));
  }
}
