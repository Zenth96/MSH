import { IsEnum } from 'class-validator';
import { Role } from '../role.enum.js';

export class UpdateRoleDto {
  @IsEnum(Role)
  role: Role;
}
