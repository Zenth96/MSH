import { IsString, MinLength, IsUUID } from 'class-validator';

export class CreateModelDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsString()
  @IsUUID()
  projectId: string;
}
