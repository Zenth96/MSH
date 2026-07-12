import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service.js';

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}

  getHello(): string {
    return 'Hello World!';
  }

  async checkHealth() {
    const checks: Record<string, string> = {};

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      checks.database = 'ok';
    } catch {
      checks.database = 'error';
    }

    const status = Object.values(checks).every((v) => v === 'ok')
      ? 'ok'
      : 'error';

    return {
      status,
      timestamp: new Date().toISOString(),
      checks,
    };
  }
}
