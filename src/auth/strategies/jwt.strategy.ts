// src/auth/strategies/jwt.strategy.ts
// JWT 인증 전략
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: 'your-secret-key', // 실제 환경에서는 환경변수로 관리 필요
    });
  }

  async validate(payload: any) {
    return {
      uuid: payload.sub,
      email: payload.email,
      tokenVersion: payload.tokenVersion,
      role: payload.role
    };
  }
} 