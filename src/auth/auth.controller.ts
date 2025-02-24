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

@ApiTags('auth')
@Controller('auth')
@UseInterceptors(AuthResponseInterceptor)
export class AuthController {
 constructor(private authService: AuthService, private membersService: MembersService) {}

 @Post('/local/login')  // 로컬 로그인 요청
 @UseGuards(LocalAuthGuard) // 로컬 인증 전략 사용
 @ApiOperation({ summary: '로컬 로그인' })
 @ApiResponse({ 
   status: 200, 
   description: '로그인 성공. 웹 클라이언트의 경우 refresh_token은 httpOnly 쿠키로 전송됨',
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
 async login(
   @Req() req,
   @Res({ passthrough: true }) response: Response,
   @Body() loginDto: LocalLoginDto,
 ) {
  console.log('loginDto!!!!!!!s:', loginDto);
  console.log('req.user!!!!!!!s:', req.user);
   return this.authService.localLogin(req.user, response, loginDto.clientType, loginDto.keepLoggedIn);
 }

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


 // 소셜 로그인 콜백 처리
 @Get('social/:provider/callback')
 @ApiOperation({ summary: '소셜 로그인 콜백 처리' })
 async socialCallback(
  //  @Param('provider') provider: AuthProvider,
  @Param('provider') provider: string,
   @Query('code') code: string,
   @Query('clientType') clientType: ClientType = ClientType.WEB,
   @Res() res: Response
 ) {
   try {
     // 1. 소셜 로그인 토큰 획득
     const tokenResponse = await this.authService.getGoogleToken(code);
     
     // 2. 사용자 정보 획득
     const userInfo = await this.authService.getGoogleUserInfo(tokenResponse.access_token);
     
     // 3. 표준화된 사용자 정보로 변환 및 로그인/회원가입 처리
     const socialLoginDto = this.authService.standardizeUserInfo(provider, userInfo);
     socialLoginDto.clientType = clientType;
     socialLoginDto.keepLoggedIn = true; // 소셜 로그인은 기본적으로 로그인 유지

     const tokens = await this.authService.socialLogin(socialLoginDto);

     // 4. 클라이언트 타입에 따른 처리
     const successUrl = new URL(`/auth/${provider}/callback`, process.env.FRONTEND_URL);
    //  successUrl.searchParams.set('provider', provider);

     if (clientType === ClientType.WEB) {
       // 데스크톱: httpOnly 쿠키에 리프레시 토큰 설정
       res.cookie('refresh_token', tokens.refresh_token, {
         httpOnly: true,
         secure: true,
         sameSite: 'lax',
         path: '/',
         maxAge: 7 * 24 * 60 * 60 * 1000 // 7일
       });
       
       return res.redirect(successUrl.toString());
     } else {
       // 모바일: JSON 응답에 리프레시 토큰 포함
       return res.json({
         redirect_url: successUrl.toString(),
         refresh_token: tokens.refresh_token
       });
     }

   } catch (error) {
    //  console.error('Social callback error:', error);
    //  const errorUrl = new URL('/auth/error', process.env.FRONTEND_URL);
    //  errorUrl.searchParams.set('message', '소셜 로그인 실패');
    //  return res.redirect(errorUrl.toString());
    const errorCode = error instanceof ConflictException ? 'EMAIL_EXISTS' : 'LOGIN_FAILED';
    const errorUrl = new URL('/auth/error', process.env.FRONTEND_URL);
    errorUrl.searchParams.set('code', errorCode);
    return res.redirect(errorUrl.toString());
   }
 }

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



@Post('refresh')
@ApiOperation({ summary: '액세스 토큰 재발급' })
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
  // 커스텀 헤더. 리프레시 시 직접 헤더에 넣어서 보내줘야 함.
  @Headers('X-Client-Type') clientType: ClientType,
  @Cookies('refresh_token') cookieToken: string,
) {

  console.log('---------from auth controller: async refresh-----------------');
  console.log('authHeader:', authHeader);
  console.log('clientType:', clientType);
  console.log('cookieToken:', cookieToken);
  console.log('-------------------------------------------------------------');
  let refreshToken = cookieToken;
  
  if (!refreshToken && authHeader) {// 쿠키에 없으면 헤더에서 찾음
    const [bearer, token] = authHeader.split(' ');
    if (bearer === 'Bearer' && token) {
      refreshToken = token;
    }
  }

  if (!refreshToken) {
    throw new UnauthorizedException('리프레시 토큰이 필요합니다.');
  }

  const result = await this.authService.refreshAccessToken(refreshToken, clientType);
  // console.log('result:', result);
  return result;
}

 @Post('logout')
//  @UseGuards(JwtAuthGuard)
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
   // 쿠키는 무조건 삭제
   res.clearCookie('refresh_token', {
       httpOnly: true,
       secure: process.env.NODE_ENV === 'production',
       sameSite: 'lax'
   });

   // 토큰이 있든 없든 성공 응답
   const logoutResponse = { message: '로그아웃되었습니다.' };
   console.log('logoutResponse:', logoutResponse);
   return logoutResponse;
 }

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

 // 리프레시 토큰으로 액세스 토큰 발급
 @Post('access-token')
 async getAccessToken(
  //  @Headers('Authorization') authHeader: string,
  //  @Headers('refresh_token') refresh_token: string,
  //  @Req() request: Request,
  @Cookies('refresh_token') refresh_token: string,
   @Query('clientType') clientType: ClientType = ClientType.WEB
 ) {
  console.log(" access-token 발급 요청 받음")
  console.log("refresh_token: ", refresh_token)

  
   if (!refresh_token) {
     throw new UnauthorizedException('유효한 리프레시 토큰이 필요합니다.');
   }

  const tokens = await this.authService.refreshAccessToken(refresh_token, clientType);
  console.log("tokens: ", tokens)
  //  return {
  //   refresh_token: tokens.refresh_token,
  //   access_token: tokens.access_token
  //  };

  return tokens;
 }



  // // 리프레시 토큰으로 액세스 토큰 발급
  // @Post('access-token')
  // async getAccessToken(
  //   @Body('refresh_token') refreshToken: string,
  //   @Query('clientType') clientType: ClientType = ClientType.WEB
  // ) {
  //   const tokens = await this.authService.refreshAccessToken(refreshToken, clientType);
  //   return {
  //     access_token: tokens.access_token
  //   };
  // }
}