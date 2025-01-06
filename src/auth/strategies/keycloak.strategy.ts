// src/auth/strategies/keycloak.strategy.ts
// Keycloak 인증 전략
// 현재는 사용하지 않음. 추후 키클락 사용시 사용 -auth.module.ts에서 사용

// import { Injectable } from '@nestjs/common';
// import { PassportStrategy } from '@nestjs/passport';
// import { Strategy } from 'passport-keycloak-bearer';

// @Injectable()
// export class KeycloakStrategy extends PassportStrategy(Strategy, 'keycloak') {
//   constructor() {
//     super({
//       realm: process.env.KEYCLOAK_REALM,
//       'auth-server-url': process.env.KEYCLOAK_AUTH_SERVER_URL,
//       clientId: process.env.KEYCLOAK_CLIENT_ID,
//     });
//   }

//   async validate(token: string, done: Function) {
//     // 토큰 검증 로직
//     return done(null, token);
//   }
// } 