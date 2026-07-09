import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import * as path from 'node:path';
import { PrismaService } from '../prisma/prisma.service.js';
import { StorageService } from '../storage/storage.service.js';
import { CreateModelDto } from './dto/create-model.dto.js';
import { ModelQueryDto } from './dto/model-query.dto.js';

@Injectable()
export class ModelsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async findAll(userId: string, query?: ModelQueryDto) {
    return this.prisma.model3D.findMany({
      where: {
        userId,
        ...(query?.projectId && { projectId: query.projectId }),
        ...(query?.status && { status: query.status }),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    const model = await this.prisma.model3D.findFirst({
      where: { id, userId },
    });
    if (!model) throw new NotFoundException(`Model ${id} not found`);
    return model;
  }

  async upload(file: Express.Multer.File, dto: CreateModelDto, userId: string) {
    const ext = (path.extname(file.originalname).toLowerCase().replace('.', '') || 'unknown');
    const storageKey = `models/${dto.projectId}/${randomUUID()}.${ext}`;

    await this.storage.upload(file.buffer, storageKey, file.mimetype);

    return this.prisma.model3D.create({
      data: {
        name: dto.name,
        fileName: file.originalname,
        fileSize: file.buffer.length,
        format: ext,
        storageKey,
        status: 'READY',
        projectId: dto.projectId,
        userId,
      },
    });
  }

  async download(id: string, userId: string) {
    const model = await this.findOne(id, userId);
    return this.storage.download(model.storageKey);
  }

  async getThumbnail(id: string, userId: string) {
    const model = await this.findOne(id, userId);
    if (!model.thumbnailKey) {
      throw new NotFoundException(`Thumbnail for model ${id} not found`);
    }
    return this.storage.download(model.thumbnailKey);
  }

  async remove(id: string, userId: string) {
    const model = await this.findOne(id, userId);
    await this.storage.delete(model.storageKey);
    if (model.thumbnailKey) {
      await this.storage.delete(model.thumbnailKey);
    }
    return this.prisma.model3D.delete({ where: { id } });
  }
}
