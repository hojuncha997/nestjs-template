// src/auth/auth.controller.ts

import { 
  Controller,
  Get,
  Post, 
  UseGuards, 
  Body,
  Req, 
  UseInterceptors,
  UnauthorizedException,
  Res,
  Headers,
  HttpStatus,
  Query,
  Param,
  BadRequestException,
  ConflictException,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from '@auth/services/auth.service';
import { LocalAuthGuard } from '@auth/guards/local-auth.guard';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';
import { AuthResponseInterceptor } from '@common/interceptors/auth-response.interceptor';
// import { Cookies } from '@common/decorators/cookies.decorator';
import { Cookies } from '../decorators/auth/cookies.decorator';
import { LocalLoginDto, SocialLoginDto } from './dto';
import { ApiTags, ApiHeader, ApiOperation, ApiResponse, ApiCookieAuth, ApiBearerAuth } from '@nestjs/swagger';
import { ClientType, AuthProvider,} from '@common/enums';
import { MembersService } from '@members/members.service';
import { OptionalJwtAuthGuard } from '@auth/guards/optional-jwt-auth.guard';
import { AUTH_ERROR_MESSAGES } from '@auth/constants/auth.error-messages';

/**
 * 인증 관련 요청 처리 컨트롤러
 * 로컬 로그인, 소셜 로그인, 토큰 관리 등 인증 관련 엔드포인트 제공
 */
@ApiTags('auth')
@Controller('auth')
@UseInterceptors(AuthResponseInterceptor)
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  constructor(
    private authService: AuthService,
    private membersService: MembersService
  ) {}

  /**
   * 로컬 로그인 처리
   * @param req Request 객체
   * @param response Response 객체
   * @param loginDto 로그인 요청 데이터
   */
  @Post('/local/login')
  @UseGuards(LocalAuthGuard)
 @ApiOperation({ summary: '로컬 로그인' })
 @ApiResponse({ 
   status: 200, 
    description: '로그인 성공. 웹 클라이언트의 경우 refresh_token은 httpOnly 쿠키로 전송',
   schema: {
     properties: {
       access_token: { type: 'string' },
       refresh_token: { 
         type: 'string',
         description: '모바일 클라이언트인 경우에만 JSON으로 반환' 
       }
     }
   }
 })
 @ApiResponse({ status: 401, description: '인증 실패' })
 @ApiResponse({ status: 429, description: '로그인 시도 횟수 초과' })
  async localLogin(
   @Req() req,
   @Res({ passthrough: true }) response: Response,
   @Body() loginDto: LocalLoginDto,
 ) {
  this.logger.log('loginDto!!!!!!!s:', loginDto);
  this.logger.log('req.user!!!!!!!s:', req.user);
   return this.authService.localLogin(req.user, response, loginDto.clientType, loginDto.keepLoggedIn);
 }

  /**
   * 소셜 로그인 URL 생성
   * @param provider 소셜 로그인 제공자
   */
 @Get('/social/:provider/url')
 @ApiOperation({ summary: '소셜 로그인 URL 생성' })
 @ApiResponse({ status: HttpStatus.OK, description: '소셜 로그인 URL 생성 성공' })
 @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '소셜 인증 실패' })
 async getSocialLoginUrl(@Param('provider') provider: string): Promise<{ url: string }> {
   if (!Object.values(AuthProvider).includes(provider as AuthProvider)) {
     throw new BadRequestException(`Invalid provider: ${provider}`);
   }
   const url = await this.authService.getSocialLoginUrl(provider as AuthProvider);
   return { url };
 }

  /**
   * 소셜 로그인 콜백 처리
   * @param provider 소셜 로그인 제공자
   * @param code 인증 코드
   * @param clientType 클라이언트 타입
   * @param res Response 객체
   */
 @Get('/social/:provider/callback')
 @ApiOperation({ summary: '소셜 로그인 콜백 처리' })
 async socialCallback(
  @Param('provider') provider: string,
   @Query('code') code: string,
   @Query('clientType') clientType: ClientType = ClientType.WEB,
   @Res() res: Response
 ) {
   try {
     const tokenResponse = await this.authService.getGoogleToken(code);
     const userInfo = await this.authService.getGoogleUserInfo(tokenResponse.access_token);
     
      const socialLoginDto = this.authService.standardizeSocialUserInfo(provider, userInfo);
     socialLoginDto.clientType = clientType;
      socialLoginDto.keepLoggedIn = true;

     const tokens = await this.authService.socialLogin(socialLoginDto);

     const successUrl = new URL('/auth/social/callback', process.env.CLIENT_URL);
     successUrl.searchParams.set('provider', provider);
     successUrl.searchParams.set('status', 'success');

     if (clientType === ClientType.WEB) {
       res.cookie('refresh_token', tokens.refresh_token, {
         httpOnly: true,
         secure: true,
         sameSite: 'lax',
         path: '/',
          maxAge: 7 * 24 * 60 * 60 * 1000
       });
       
       return res.redirect(successUrl.toString());
     } else {
       return res.json({
         redirect_url: successUrl.toString(),
         refresh_token: tokens.refresh_token
       });
     }
   } catch (error) {
    const errorCode = error instanceof ConflictException ? 'EMAIL_EXISTS' : 'LOGIN_FAILED';
    const errorUrl = new URL('/auth/error', process.env.CLIENT_URL);
    errorUrl.searchParams.set('code', errorCode);
    return res.redirect(errorUrl.toString());
   }
 }

  /**
   * 소셜 로그인 처리
   * @param socialLoginDto 소셜 로그인 데이터
   * @param response Response 객체
   */
 @Post('social/login')
 @ApiOperation({ summary: '소셜 로그인' })
 @ApiResponse({ 
   status: HttpStatus.OK, 
   description: '소셜 로그인 성공',
   schema: {
     properties: {
       access_token: { type: 'string' },
       refresh_token: { type: 'string' }
     }
   }
 })
 @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '소셜 인증 실패' })
 async socialLogin(
   @Body() socialLoginDto: SocialLoginDto,
   @Res({ passthrough: true }) response: Response
 ) {
   return this.authService.socialLogin(socialLoginDto);
 }

  /**
   * 액세스 토큰과 리프레시 토큰 재발급
   * @param authHeader Authorization 헤더
   * @param clientType 클라이언트 타입
   * @param cookieToken 쿠키의 리프레시 토큰
   */
@Post('refresh')
  @ApiOperation({ summary: '액세스 토큰과 리프레시 토큰 재발급' })
@ApiResponse({ status: 200, description: '토큰 재발급 성공' })
@ApiResponse({ status: 401, description: '유효하지 않은 리프레시 토큰' })
@ApiHeader({
  name: 'Authorization',
  description: 'Bearer <refresh_token> 형식으로 전송 (모바일)',
  required: false,
})
@ApiHeader({
  name: 'X-Client-Type',
  description: '클라이언트 타입',
  required: false,
})
@ApiCookieAuth('refresh_token') 
async refresh(
  @Headers('Authorization') authHeader: string,
  @Headers('X-Client-Type') clientType: ClientType,
  @Cookies('refresh_token') cookieToken: string,
) {
  let refreshToken = cookieToken;
  
    if (!refreshToken && authHeader) {
    const [bearer, token] = authHeader.split(' ');
    if (bearer === 'Bearer' && token) {
      refreshToken = token;
    }
  }

  if (!refreshToken) {
      throw new UnauthorizedException(AUTH_ERROR_MESSAGES.REFRESH_TOKEN.REQUIRED);
    }

    return this.authService.refreshAccessToken(refreshToken, clientType);
  }

  /**
   * 액세스 토큰만 재발급
   * @param authHeader Authorization 헤더
   * @param cookieToken 쿠키의 리프레시 토큰
   */
  @Post('access-token')
  @ApiOperation({ summary: '액세스 토큰만 재발급' })
  @ApiResponse({ status: 200, description: '액세스 토큰 재발급 성공' })
  @ApiResponse({ status: 401, description: '유효하지 않은 리프레시 토큰' })
  @ApiHeader({
    name: 'Authorization',
    description: 'Bearer <refresh_token> 형식으로 전송 (모바일)',
    required: false,
  })
  @ApiCookieAuth('refresh_token')
  async refreshAccessTokenOnly(
    @Headers('Authorization') authHeader: string,
    @Cookies('refresh_token') cookieToken: string,
  ) {
    let refreshToken = cookieToken;
    
    if (!refreshToken && authHeader) {
      const [bearer, token] = authHeader.split(' ');
      if (bearer === 'Bearer' && token) {
        refreshToken = token;
      }
    }

    if (!refreshToken) {
      throw new UnauthorizedException(AUTH_ERROR_MESSAGES.REFRESH_TOKEN.REQUIRED);
    }

    return this.authService.refreshAccessTokenOnly(refreshToken);
  }

  /**
   * 로그아웃 처리
   * @param req Request 객체
   * @param cookieToken 쿠키의 리프레시 토큰
   * @param bodyToken 요청 본문의 리프레시 토큰
   * @param res Response 객체
   */
 @Post('logout')
 @UseGuards(OptionalJwtAuthGuard)
 @ApiOperation({ summary: '로그아웃' })
 @ApiResponse({ status: 200, description: '로그아웃 성공' })
 @ApiResponse({ status: 401, description: '인증되지 않은 요청' })
 @ApiBearerAuth()
 @ApiCookieAuth('refresh_token')
 async logout(
   @Req() req,
   @Cookies('refresh_token') cookieToken: string,
   @Body('refresh_token') bodyToken: string,
   @Res({ passthrough: true }) res: Response,
 ) {
   try {
     const refreshToken = cookieToken || bodyToken;
     const userUuid = req.user?.uuid;

     if (refreshToken && userUuid) {
        await this.authService.logout(refreshToken, userUuid);
     }
   } catch (error) {
     this.logger.error('토큰 파기 실패:', error);
   } finally {
     res.clearCookie('refresh_token', {
       httpOnly: true,
       secure: process.env.NODE_ENV === 'production',
       sameSite: 'lax'
     });
   }

    return { message: '로그아웃되었습니다.' };
 }

  /**
   * 모든 디바이스 로그아웃
   * @param req Request 객체
   */
 @Post('logout/all')
 @UseGuards(JwtAuthGuard)
 @ApiOperation({ summary: '모든 디바이스에서 로그아웃' })
 @ApiResponse({ status: 200, description: '모든 디바이스 로그아웃 성공' })
 @ApiResponse({ status: 401, description: '인증되지 않은 요청' })
 @ApiBearerAuth()
 async logoutAll(@Req() req) {
   await this.authService.logoutAll(req.user.uuid);
   return { message: '모든 디바이스에서 로그아웃되었습니다.' };
 }
}