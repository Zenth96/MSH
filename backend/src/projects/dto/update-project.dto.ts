import { IsString, MinLength, IsOptional } from 'class-validator';
import { ProjectStatus } from '@prisma/client';

export class UpdateProjectDto {
  @IsString()
  @MinLength(1)
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  status?: ProjectStatus;
}
