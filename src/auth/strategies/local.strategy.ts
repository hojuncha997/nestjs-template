// src/auth/strategies/local.strategy.ts
// 로컬 인증 전략
import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { AuthService } from '@auth/services/auth.service';
import { MemberStatus } from '@common/enums'

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(LocalStrategy.name);
  constructor(private authService: AuthService) {
    super({
      usernameField: 'email',
      passwordField: 'password'
    });
  }

  async validate(email: string, password: string): Promise<any> {
    this.logger.log('LocalStrategy validate - email:', email);
    this.logger.log('LocalStrategy validate - password:', password);
    
    const member = await this.authService.validateMember(email, password);
    if (!member) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
    }
    return member;
  }
} 