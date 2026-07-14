import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { OptimizeHandler } from './handlers/optimize.handler.js';
import { ConvertHandler } from './handlers/convert.handler.js';
import { GenerateThumbnailHandler } from './handlers/generate-thumbnail.handler.js';
import type { JobHandler, JobMessage } from './handlers/job.handler.js';

@Injectable()
export class ProcessingService {
  private readonly logger = new Logger(ProcessingService.name);
  private readonly handlers = new Map<string, JobHandler>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly optimizeHandler: OptimizeHandler,
    private readonly convertHandler: ConvertHandler,
    private readonly generateThumbnailHandler: GenerateThumbnailHandler,
  ) {
    this.handlers.set('OPTIMIZE', this.optimizeHandler);
    this.handlers.set('CONVERT', this.convertHandler);
    this.handlers.set('GENERATE_THUMBNAIL', this.generateThumbnailHandler);
  }

  async processJob(message: JobMessage): Promise<void> {
    const { jobId, jobType } = message;
    this.logger.log(`Processing job ${jobId} [${jobType}]`);

    const handler = this.handlers.get(jobType);
    if (!handler) {
      this.logger.error(`Unknown job type: ${jobType}`);
      await this.failJob(jobId, `Unknown job type: ${jobType}`);
      return;
    }

    try {
      await this.prisma.job.update({
        where: { id: jobId },
        data: { status: 'RUNNING' },
      });

      await this.prisma.model3D.update({
        where: { id: message.modelId },
        data: { status: 'PROCESSING' },
      });

      await handler.handle(message);

      await this.prisma.job.update({
        where: { id: jobId },
        data: { status: 'DONE' },
      });

      await this.prisma.model3D.update({
        where: { id: message.modelId },
        data: { status: 'READY' },
      });

      this.logger.log(`Job ${jobId} completed successfully`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Job ${jobId} failed: ${errorMessage}`);
      await this.failJob(jobId, errorMessage);
    }
  }

  private async failJob(jobId: string, errorMessage: string): Promise<void> {
    try {
      const job = await this.prisma.job.findUnique({
        where: { id: jobId },
        select: { modelId: true },
      });

      if (!job) {
        this.logger.error(`Job ${jobId} not found during failure handling`);
        return;
      }

      await this.prisma.job.update({
        where: { id: jobId },
        data: {
          status: 'FAILED',
          errorMessage,
        },
      });

      await this.prisma.model3D.update({
        where: { id: job.modelId },
        data: { status: 'ERROR' },
      });
    } catch (error) {
      this.logger.error(`Failed to update job ${jobId} status: ${error}`);
    }
  }
}
