import { IsEnum, IsOptional, IsString } from 'class-validator';
import { Role } from '../role.enum.js';

export class UserQueryDto {
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @IsOptional()
  @IsString()
  search?: string;
}
