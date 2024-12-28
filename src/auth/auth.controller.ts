import { 
  Controller, 
  Post, 
  UseGuards, 
  Body,
  Req, 
  UseInterceptors,
  UnauthorizedException,
  Res,
  Headers,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from '@auth/services/auth.service';
import { LocalAuthGuard } from '@auth/guards/local-auth.guard';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';
import { AuthResponseInterceptor } from '@common/interceptors/auth-response.interceptor';
import { Cookies } from '@common/decorators/cookies.decorator';
import { LocalLoginDto, SocialLoginDto } from './dto';
import { ApiTags, ApiHeader, ApiOperation, ApiResponse, ApiCookieAuth, ApiBearerAuth } from '@nestjs/swagger';
import { ClientType } from '@common/enums';
@ApiTags('auth')
@Controller('auth')
@UseInterceptors(AuthResponseInterceptor)
export class AuthController {
 constructor(private authService: AuthService) {}

 @Post('/local/login')
 @UseGuards(LocalAuthGuard)
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
   return this.authService.signIn(req.user, response, loginDto.clientType);
 }

 @Post('social/login')
 @ApiOperation({ summary: '소셜 로그인' })
 @ApiResponse({ status: 200, description: '소셜 로그인 성공' })
 @ApiResponse({ status: 401, description: '소셜 인증 실패' })
 async socialLogin(@Body() socialLoginDto: SocialLoginDto) {
   // return this.authService.socialLogin(socialLoginDto);

 }

//  @Post('refresh')
//  @ApiOperation({ summary: '액세스 토큰 재발급' })
//  @ApiResponse({ 
//    status: 200, 
//    description: '토큰 재발급 성공'
//  })
//  @ApiResponse({ status: 401, description: '유효하지 않은 리프레시 토큰' })
//  @ApiCookieAuth('refresh_token')
//  async refresh(
//    @Cookies('refresh_token') cookieToken: string,
  
//  ) {
//    const refreshToken = cookieToken || refreshTokenDto.refresh_token;
//    if (!refreshToken) {
//      throw new UnauthorizedException('리프레시 토큰이 필요합니다.');
//    }

//    return this.authService.refreshAccessToken(refreshToken, refreshTokenDto.clientType);
//  }

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

  console.log('--------------------------------');
  console.log('authHeader:', authHeader);
  console.log('clientType:', clientType);
  console.log('cookieToken:', cookieToken);
  console.log('--------------------------------');

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

  return this.authService.refreshAccessToken(refreshToken, clientType);
}

 @Post('logout')
 @UseGuards(JwtAuthGuard)
 @ApiOperation({ summary: '로그아웃' })
 @ApiResponse({ status: 200, description: '로그아웃 성공' })
 @ApiResponse({ status: 401, description: '인증되지 않은 요청' })
 @ApiBearerAuth()
 @ApiCookieAuth('refresh_token')
 async logout(
   @Req() req,
   @Cookies('refresh_token') cookieToken: string,
   @Body('refresh_token') bodyToken: string,
 ) {
   const refreshToken = cookieToken || bodyToken;
   if (!refreshToken) {
     throw new UnauthorizedException('리프레시 토큰이 필요합니다.');
   }

   await this.authService.logout(refreshToken, req.user.uuid);
   return { message: '로그아웃되었습니다.' };
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
}