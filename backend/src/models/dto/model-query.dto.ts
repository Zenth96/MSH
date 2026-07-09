import { IsOptional, IsString, IsUUID } from 'class-validator';
import { ModelStatus } from '../../generated/prisma/enums.js';

export class ModelQueryDto {
  @IsString()
  @IsUUID()
  @IsOptional()
  projectId?: string;

  @IsString()
  @IsOptional()
  status?: ModelStatus;
}
