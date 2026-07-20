import { IsOptional, IsString, IsUUID } from 'class-validator';
import { ModelStatus } from '@prisma/client';

export class ModelQueryDto {
  @IsString()
  @IsUUID()
  @IsOptional()
  projectId?: string;

  @IsString()
  @IsOptional()
  status?: ModelStatus;
}
