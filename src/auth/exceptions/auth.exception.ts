import { UnauthorizedException } from '@nestjs/common';

/**
 * 리프레시 토큰 만료 예외
 */
export class RefreshTokenExpiredException extends UnauthorizedException {
  constructor() {
    super('리프레시 토큰이 만료되었습니다.');
  }
}

/**
 * 유효하지 않은 리프레시 토큰 예외
 */
export class InvalidRefreshTokenException extends UnauthorizedException {
  constructor() {
    super('유효하지 않은 리프레시 토큰입니다.');
  }
} 