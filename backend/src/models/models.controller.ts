import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ModelsService } from './models.service.js';
import { CreateModelDto } from './dto/create-model.dto.js';
import { ModelQueryDto } from './dto/model-query.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

@Controller('models')
@UseGuards(JwtAuthGuard)
export class ModelsController {
  constructor(private readonly modelsService: ModelsService) {}

  @Get()
  findAll(@CurrentUser('sub') userId: string, @Query() query?: ModelQueryDto) {
    return this.modelsService.findAll(userId, query);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateModelDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.modelsService.upload(file, dto, userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.modelsService.findOne(id, userId);
  }

  @Get(':id/download')
  download(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.modelsService.download(id, userId);
  }

  @Get(':id/thumbnail')
  getThumbnail(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.modelsService.getThumbnail(id, userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.modelsService.remove(id, userId);
  }
}
