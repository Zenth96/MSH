import { IsString, MinLength, IsOptional } from 'class-validator';
import { ProjectStatus } from '../../generated/prisma/enums.js';

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
