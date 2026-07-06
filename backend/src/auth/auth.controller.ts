import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  refresh(@Body('refreshToken') refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token required');
    }
    return this.authService.refresh(refreshToken);
  }

  @Get('me')
  getMe(@Headers('authorization') auth: string) {
    if (!auth) {
      throw new UnauthorizedException('Authorization header required');
    }
    const token = auth.replace('Bearer ', '');
    return this.authService.getMe(
      this.authService['jwtService'].verify<{ sub: string }>(token).sub,
    );
  }
}
