import { Injectable, UnauthorizedException, BadRequestException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { ClientType, AuthProvider, AuthProviderUrl } from '@common/enums/';
import { AuthRepository } from '../repositories/auth.repository';
import { MembersService } from '@members/members.service';
import { Member } from '@members/entities/member.entity';
// import { SocialLoginDto } from '@members/dto/social-login.dto';
import { SocialLoginDto } from '@auth/dto';
// import axios from 'axios';

export class RefreshTokenExpiredException extends UnauthorizedException {
  constructor() {
    super('리프레시 토큰이 만료되었습니다.');
  }
}

export class InvalidRefreshTokenException extends UnauthorizedException {
  constructor() {
    super('유효하지 않은 리프레시 토큰입니다.');
  }
}

interface AuthUser {
  id: number;
  uuid: string;
  email: string;
  role: string;
  tokenVersion: number;
  preferences: {
    language: string;
    timezone: string;
    theme: string;
  };
  status: string;
}

interface JwtPayload {
  email: string;
  sub: string;    // uuid
  role: string;
  preferences: {
    language: string;
    timezone: string;
    theme: string;
  };
  tokenVersion: number;
  keepLoggedIn: boolean;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly membersService: MembersService,
  ) {}

  async localLogin(member: Member, response: Response, clientType: ClientType, keepLoggedIn: boolean) {
    const user: AuthUser = {
      id: member.id,
      uuid: member.uuid,
      email: member.email,
      role: member.role || 'USER',
      preferences: member.preferences || {
        language: 'ko',
        timezone: 'Asia/Seoul',
        theme: 'light'
      },
      status: member.status,
      tokenVersion: member.tokenVersion || 0,
    };

    const tokens = await this.login(user, clientType, keepLoggedIn);
    
    return tokens;
  }

  // private setRefreshTokenCookie(response: Response, token: string): void {
  //   response.cookie('refresh_token', token, {
  //     httpOnly: true,
  //     secure: true,
  //     sameSite: 'lax',
  //     path: '/',
  //     maxAge: 7 * 24 * 60 * 60 * 1000, // 7일
  //   });
  // }

  private async login(user: AuthUser, clientType: ClientType, keepLoggedIn:boolean) {
    const payload: JwtPayload = { 
      email: user.email, 
      sub: user.uuid,
      role: user.role,
      preferences: user.preferences,
      tokenVersion: user.tokenVersion,
      keepLoggedIn: keepLoggedIn, // 추가
    };
    
    console.log('Login attempt for user:', { id: user.id, email: user.email });
    
    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: '15m',
    });
    const refreshToken = await this.jwtService.signAsync(payload, {
      
      // expiresIn: '7d',\
      expiresIn: keepLoggedIn ? '7d' : '24h',  // keepLoggedIn에 따라 만료 시간 설정    });
    });

    console.log('Generated tokens. RefreshToken:', refreshToken.substring(0, 20) + '...');
    
    try {
      await this.authRepository.saveRefreshToken(user.id, refreshToken, keepLoggedIn);
      console.log('Refresh token saved successfully');
    } catch (error) {
      console.error('Error saving refresh token:', error);
      throw error;
    }

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      keepLoggedIn: keepLoggedIn,
    };
  }

  async refreshAccessToken(refreshToken: string, clientType: ClientType): Promise<any> {
    console.log('Refresh token received:', refreshToken);
    
    // 토큰 검증
    const payload = await this.jwtService.verifyAsync(refreshToken);
    console.log('Token verified:', payload);
    
    // DB에서 리프레시 토큰 조회
    const tokenData = await this.authRepository.findByRefreshToken(refreshToken);
    console.log('Token data from DB:', tokenData);
    
    if (!tokenData || tokenData.revoked) {
      throw new InvalidRefreshTokenException();
    }

    // 토큰의 사용자 정보와 DB의 사용자 정보가 일치하는지 확인
    if (payload.sub !== tokenData.member.uuid) {
      throw new UnauthorizedException('Invalid token ownership');
    }

    // 새 토큰 발급 시 tokenData.member의 정보 사용
    const user: AuthUser = {
      id: tokenData.member.id,
      uuid: tokenData.member.uuid,
      email: tokenData.member.email,
      role: tokenData.member.role,
      preferences: tokenData.member.preferences,
      status: tokenData.member.status,
      tokenVersion: tokenData.tokenVersion
    };

    return this.login(user, clientType, tokenData.keepLoggedIn);
  }

  async logout(refreshToken: string, userUuid: string) {
    const tokenData = await this.authRepository.findByRefreshToken(refreshToken);
    
    if (!tokenData || tokenData.member.uuid !== userUuid) {
      throw new InvalidRefreshTokenException();
    }

    // 리프레시 토큰만 revoke
    await this.authRepository.revokeRefreshToken(refreshToken);
  }

  async logoutAll(userUuid: string) {
    const member = await this.authRepository.findByUuid(userUuid);
    if (!member) {
      throw new UnauthorizedException('사용자를 찾을 수 없습니다.');
    }

    // MembersService를 통해 토큰 버전 증가
    await this.membersService.incrementTokenVersion(member.id);
    await this.authRepository.revokeAllRefreshTokens(member.id);
  }

  async validateMember(email: string, password: string): Promise<AuthUser | null> {
    const user = await this.authRepository.findByEmail(email);
    console.log('DB에서 조회된 사용자 정보:', user);
    
    if (!user) return null;

    // 계정 잠금 확인
    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
      throw new UnauthorizedException('계정이 잠겼습니다. 잠시 후 다시 시도해주세요.');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      await this.membersService.incrementLoginAttempts(email);
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
    }

    await this.membersService.resetLoginAttempts(email);
    
    const authUser = {
      id: user.id,
      uuid: user.uuid,
      email: user.email,
      role: user.role || 'USER',
      preferences: user.preferences || {
        language: 'ko',
        timezone: 'Asia/Seoul',
        theme: 'light'
      },
      status: user.status ,
      tokenVersion: user.tokenVersion || 0,
    };
    
    console.log('반환되는 AuthUser:', authUser);
    return authUser;
  }

  async findMemberByUuid(uuid: string) {
    // return this.authRepository.findByUuid(uuid);
    return this.membersService.findOneByUuid(uuid);
  }

  async getSocialLoginUrl(provider: AuthProvider): Promise<string> {
    const providerKey = provider.toUpperCase();
    let url = AuthProviderUrl[providerKey];
    
    if (!url) {
      throw new BadRequestException(`URL not found for provider: ${provider}`);
    }

    switch (provider) {
      case AuthProvider.GOOGLE:


        const params = new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID,
          redirect_uri: process.env.GOOGLE_REDIRECT_URI,
          response_type: 'code', // 필수 파라미터
          // scope: 'openid email profile https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
          scope: 'openid profile email',
          access_type: 'offline',
          prompt: 'consent'
        });
        url = `${url}?${params.toString()}`;
        break;


      default:
        throw new BadRequestException(`Unsupported provider: ${provider}`);
    }
    
    console.log('url from getSocialLoginUrl:', url);
    return url;
  }

  async socialLogin(socialLoginDto: SocialLoginDto): Promise<any> {
    try {
      // 1. 소셜 로그인으로 이미 가입했는지 먼저 확인
      let socialMember = await this.membersService.findByProviderAndProviderId(
        socialLoginDto.provider,
        socialLoginDto.providerId
      );
  
      // 2. 없으면 이메일 중복 체크
      if (!socialMember) {
        const localMember = await this.membersService.findByEmail(socialLoginDto.email);
        
        if(localMember) {
          throw new ConflictException('이미 가입된 이메일입니다.');
        }
  
        // 3. 신규 가입
        socialMember = await this.membersService.createSocialMember(socialLoginDto);
      }
  
      const user: AuthUser = {
        id: socialMember.id,
        uuid: socialMember.uuid,
        email: socialMember.email,
        role: socialMember.role,
        preferences: socialMember.preferences,
        status: socialMember.status,
        tokenVersion: socialMember.tokenVersion
      };

      return this.login(user, socialLoginDto.clientType, socialLoginDto.keepLoggedIn);
    } catch (error) {
      console.error('Social login error:', error);
      throw error;
    }
  }

  async getGoogleToken(code: string) {
    // console.log('code from getGoogleToken:', code);
    // console.log('process.env.GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID);
    // console.log('process.env.GOOGLE_REDIRECT_URI:', process.env.GOOGLE_REDIRECT_URI);
    
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    });

    const responseData = await response.text(); // 또는 response.json()
    console.log('Response data:', responseData);

    if (!response.ok) {
      throw new Error(`Google token error: ${responseData}`);
    }

    return JSON.parse(responseData);
  }

  // async getGoogleToken(code: string) {
  //   console.log('code from getGoogleToken:', code); // code from getGoogleToken: 4/0AanRRrsr9NgIdU57bWPsXp17pt4I8f4tmsxWhjxDghB50dohPL59Mj1AwAUOoWu8SGz0jA
  //   // Google OAuth2 토큰 획득 로직
  //   const response = await fetch('https://oauth2.googleapis.com/token', {
  //     method: 'POST',
  //     headers: {
  //       'Content-Type': 'application/x-www-form-urlencoded',
  //     },
  //     body: new URLSearchParams({
  //       code,
  //       client_id: process.env.GOOGLE_CLIENT_ID,
  //       client_secret: process.env.GOOGLE_CLIENT_SECRET,
  //       redirect_uri: process.env.GOOGLE_REDIRECT_URI,
  //       grant_type: 'authorization_code',
  //     }),
  //   });
  //   console.log('response from getGoogleToken@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@:', response);
  //   return response.json();
  // }

  async getGoogleUserInfo(accessToken: string) {
    // Google 사용자 정보 획득 로직
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return response.json();
  }

  standardizeUserInfo(provider: string, userInfo: any): SocialLoginDto {
    switch (provider) {
      case 'google':
        return {
          email: userInfo.email,
          name: userInfo.name,
          picture: userInfo.picture,
          provider: AuthProvider.GOOGLE,
          providerId: userInfo.id,
          clientType: ClientType.WEB,
          keepLoggedIn: false
        };
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }
} 
