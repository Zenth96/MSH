import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Role } from './role.enum.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { UpdateRoleDto } from './dto/update-role.dto.js';
import { UserQueryDto } from './dto/user-query.dto.js';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: UserQueryDto) {
    const where: any = {};
    if (query.role) where.role = query.role;
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    return this.prisma.user.findMany({ where, orderBy: { createdAt: 'desc' } });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findOne(id);
    return this.prisma.user.update({ where: { id }, data: dto });
  }

  async updateRole(id: string, dto: UpdateRoleDto, requesterId: string) {
    const user = await this.findOne(id);
    if (requesterId === id && dto.role !== Role.ADMIN) {
      throw new ForbiddenException('Cannot demote yourself');
    }
    return this.prisma.user.update({ where: { id }, data: { role: dto.role } });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.user.delete({ where: { id } });
  }
}
