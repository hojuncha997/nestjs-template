import { Injectable } from '@nestjs/common';
import { MembersService } from '../members/members.service';
import { LocalLoginDto } from './dto/local-login.dto';

@Injectable()
export class AuthService {
  constructor(private readonly membersService: MembersService) {}

  async login(loginDto: LocalLoginDto) {
    // 로그인 로직 구현
    return { message: '로그인 성공' };
  }

  async logout(userId: number) {
    // 로그아웃 로직 구현
  }
}
