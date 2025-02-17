// src/auth/strategies/jwt.strategy.ts
// JWT 인증 전략
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) { // PassportStrategy 클래스를 상속받아 JWT 인증 전략을 구현. JwtAuthGuard에서 전략을 찾을 때 사용됨
  // export class JwtStrategy extends PassportStrategy(Strategy, 'custom-jwt') { 원래는 이렇게 명시해 주고, 
  // JwtAuthGuard에서도 export class JwtAuthGuard extends AuthGuard('custom-jwt') { 이렇게 명시해 주어야 한다. 그렇지 않으면 자동으로 전략 이름에서 추측하여 추출한다.



  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // 요청 헤더에서 Bearer 토큰 추출
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