import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalLoginDto } from './dto/local-login.dto';
import { LocalRegisterDto } from './dto/local-register.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LocalLoginDto) {
    return this.authService.login(loginDto);
  }


  @Post('logout')
  async logout() {
    // 로그아웃 로직 구현: 토큰만 받으면 된다.
  }
}
