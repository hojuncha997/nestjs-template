// src/auth/guards/keycloak-auth.guard.ts
// Keycloak 인증 가드
// 현재는 사용하지 않음. 추후 키클락 사용시 사용
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class KeycloakAuthGuard extends AuthGuard('keycloak') {} 