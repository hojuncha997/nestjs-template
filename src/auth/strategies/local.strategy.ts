// src/auth/strategies/local.strategy.ts
// 로컬 인증 전략
import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '@auth/services/auth.service';
import { MemberStatus } from '@common/enums'

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({ usernameField: 'email' });
  }

  async validate(email: string, password: string): Promise<any> {
    const member = await this.authService.validateMember(email, password);
    if (!member) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
    }

    if(member.status === MemberStatus.PENDING) {
      throw new UnauthorizedException('이메일 승인을 완료해주세요.');
    }

    return member;
  }
} 