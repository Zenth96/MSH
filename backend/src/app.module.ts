import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { StorageModule } from './storage/storage.module.js';
import { UsersModule } from './users/users.module.js';
import { ModelsModule } from './models/models.module.js';
import { ProjectsModule } from './projects/projects.module.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsersModule,
    StorageModule,
    ProjectsModule,
    ModelsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})

export class AppModule {}
