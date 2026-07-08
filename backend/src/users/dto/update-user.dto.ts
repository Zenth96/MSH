import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { Role } from '../role.enum.js';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}
