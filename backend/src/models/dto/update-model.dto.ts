import { IsOptional, IsString, MinLength, IsUUID } from 'class-validator';

export class UpdateModelDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsString()
  @IsUUID()
  projectId?: string;
}
