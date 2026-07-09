import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateProjectDto } from './dto/create-project.dto.js';
import { UpdateProjectDto } from './dto/update-project.dto.js';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.project.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
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
    await this.findOne(id, userId);
    return this.prisma.project.delete({ where: { id } });
  }
}
