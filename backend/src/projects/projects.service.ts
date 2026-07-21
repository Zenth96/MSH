import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { StorageService } from '../storage/storage.service.js';
import { CreateProjectDto } from './dto/create-project.dto.js';
import { UpdateProjectDto } from './dto/update-project.dto.js';

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async findAll(userId: string) {
    return this.prisma.project.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { models: true } } },
    });
  }

  async create(userId: string, dto: CreateProjectDto) {
    return this.prisma.project.create({
      data: {
        name: dto.name,
        description: dto.description,
        userId,
      },
    });
  }

  async findOne(id: string, userId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id, userId },
      include: { models: true },
    });
    if (!project) throw new NotFoundException(`Project ${id} not found`);
    return project;
  }

  async update(id: string, userId: string, dto: UpdateProjectDto) {
    await this.findOne(id, userId);
    return this.prisma.project.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string, userId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id, userId },
      include: { models: true },
    });
    if (!project) throw new NotFoundException(`Project ${id} not found`);

    for (const model of project.models) {
      try {
        await this.storage.delete(model.storageKey);
      } catch (err) {
        this.logger.warn(`Failed to delete model file ${model.storageKey}: ${err}`);
      }
      if (model.thumbnailKey) {
        try {
          await this.storage.delete(model.thumbnailKey);
        } catch (err) {
          this.logger.warn(`Failed to delete thumbnail ${model.thumbnailKey}: ${err}`);
        }
      }
    }

    return this.prisma.project.delete({ where: { id } });
  }
}
