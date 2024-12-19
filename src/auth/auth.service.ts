import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/local-login.dto';
import { RegisterDto } from './dto/local-register.dto';

@Injectable()
export class AuthService {
  constructor(private readonly usersService: UsersService) {}

  async login(loginDto: LoginDto) {
    // 로그인 로직 구현
    return { message: '로그인 성공' };
  }

  async register(registerDto: RegisterDto) {
    // 회원가입 로직 구현
  }

  async logout(userId: number) {
    // 로그아웃 로직 구현
  }
}
