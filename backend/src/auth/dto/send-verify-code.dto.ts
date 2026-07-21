import { IsEmail } from 'class-validator';

export class SendVerifyCodeDto {
  @IsEmail()
  email!: string;
}
