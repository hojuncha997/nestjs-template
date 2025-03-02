import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AuthService } from '@auth/services/auth.service';
import { MembersService } from '@members//members.service';
import { ClientType } from '@common/enums/client-type.enum';

@Injectable()
export class TokenRefreshMiddleware implements NestMiddleware {
  private readonly logger = new Logger(TokenRefreshMiddleware.name);
  constructor(
    private readonly authService: AuthService,
    private readonly membersService: MembersService
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // 1. 액세스 토큰이 없고 리프레시 토큰이 있는 경우에만 처리
    const accessToken = req.headers.authorization;
    const refreshToken = req.cookies['refresh_token'];

    if (!accessToken && refreshToken) {
      try {
        // 2. 리프레시 토큰으로 새 토큰 발급
        const tokens = await this.authService.refreshAccessToken(refreshToken, ClientType.WEB);
        if (tokens) {
          // 3. 요청 객체에 새로운 인증 정보 첨부
          const member = await this.membersService.findOneByUuid(tokens.sub);
          if (member) {
            req['member'] = member;
            req.headers.authorization = `Bearer ${tokens.access_token}`;
          }
        }
      } catch (error) {
        // 리프레시 실패는 무시 (public API 대응)
        this.logger.log('Token refresh failed:', error);
      }
    }

    next();
  }
}