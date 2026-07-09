import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ProjectsService } from './projects.service.js';
import { CreateProjectDto } from './dto/create-project.dto.js';
import { UpdateProjectDto } from './dto/update-project.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  findAll(@CurrentUser('sub') userId: string) {
    return this.projectsService.findAll(userId);
  }

  @Post()
  create(@CurrentUser('sub') userId: string, @Body() dto: CreateProjectDto) {
    return this.projectsService.create(userId, dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.projectsService.findOne(id, userId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projectsService.update(id, userId, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.projectsService.remove(id, userId);
  }
}
