import { Injectable, UnauthorizedException, BadRequestException, ConflictException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { ClientType, AuthProvider, AuthProviderUrl } from '@common/enums/';
import { AuthRepository } from '../repositories/auth.repository';
import { MembersService } from '@members/members.service';
import { Member } from '@members/entities/member.entity';
import { SocialLoginDto } from '@auth/dto';
import { EmailUtil } from '@common/utils/email-util.util';
import { AuthUser, JwtPayload } from '../interfaces/auth.interface';
import { RefreshTokenExpiredException, InvalidRefreshTokenException } from '../exceptions/auth.exception';

/**
 * 인증 관련 기능 처리 서비스
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly membersService: MembersService,
  ) {}

  /**
   * 로컬 로그인 처리
   * @param member 로그인할 회원 정보
   * @param response Express Response 객체
   * @param clientType 클라이언트 타입 (웹, 모바일 등)
   * @param keepLoggedIn 로그인 상태 유지 여부
   * @return 액세스 토큰과 리프레시 토큰 포함한 로그인 결과
   */
  async localLogin(member: Member, response: Response, clientType: ClientType, keepLoggedIn: boolean) {

    this.logger.log('member from localLogin:', member);
    const user: AuthUser = {
      id: member.id,
      uuid: member.uuid,
      email: member.email,
      nickname: member.nickname,
      role: member.role,
      preferences: member.preferences || {
        language: 'ko',
        timezone: 'Asia/Seoul',
        theme: 'light'
      },
      status: member.status,
      tokenVersion: member.tokenVersion || 0,
    };

    this.logger.log('user from localLogin:', user);

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

  /**
   * 사용자 로그인 처리 및 토큰 생성
   * @param user 인증된 사용자 정보
   * @param clientType 클라이언트 타입
   * @param keepLoggedIn 로그인 상태 유지 여부
   * @return 생성된 액세스 토큰과 리프레시 토큰
   * @private
   */
  private async login(user: AuthUser, clientType: ClientType, keepLoggedIn:boolean) {
    this.logger.log('authService login 호출됨');
    
    const payload: JwtPayload = { 
      sub: user.uuid,
      role: user.role,
      tokenVersion: user.tokenVersion,
      keepLoggedIn: keepLoggedIn,
    };
    
    this.logger.log('Login attempt for user:', { id: user.id, uuid: user.uuid });
    
    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: '15m',
    });
    
    // 생성된 토큰 디코드해서 확인
    const decodedToken = await this.jwtService.decode(accessToken);
    this.logger.log('생성된 토큰의 decoded 내용:', decodedToken);
    
    const refreshToken = await this.jwtService.signAsync(payload, {
      expiresIn: keepLoggedIn ? '7d' : '24h',  // keepLoggedIn에 따라 만료 시간 설정
    });

    this.logger.log('Generated tokens. RefreshToken:', refreshToken.substring(0, 20) + '...');
    
    try {
      await this.authRepository.saveRefreshToken(user.id, refreshToken, keepLoggedIn);
      this.logger.log('Refresh token saved successfully');
    } catch (error) {
      this.logger.error('Error saving refresh token:', error);
      throw error;
    }

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      keepLoggedIn: keepLoggedIn,
    };
  }

  /**
   * 리프레시 토큰으로 새로운 액세스 토큰 발급
   * @param refreshToken 유효한 리프레시 토큰
   * @param clientType 클라이언트 타입
   * @throws InvalidRefreshTokenException 유효하지 않은 리프레시 토큰
   * @throws UnauthorizedException 토큰 소유권 불일치
   * @return 새로운 액세스 토큰과 리프레시 토큰
   */
  async refreshAccessToken(refreshToken: string, clientType: ClientType): Promise<any> {
    this.logger.log('Refresh token received:', refreshToken);
    
    // 토큰 검증
    const payload = await this.jwtService.verifyAsync(refreshToken);
    this.logger.log('Token verified:', payload);
    
    // DB에서 리프레시 토큰 조회
    const tokenData = await this.authRepository.findByRefreshToken(refreshToken);
    this.logger.log('Token data from DB:', tokenData);
    
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
      email: EmailUtil.decryptEmail(tokenData.member.email),
      nickname: tokenData.member.nickname,
      role: tokenData.member.role,
      preferences: tokenData.member.preferences,
      status: tokenData.member.status,
      tokenVersion: tokenData.tokenVersion
    };

    return this.login(user, clientType, tokenData.keepLoggedIn);
  }

  /**
   * 특정 리프레시 토큰으로 로그아웃
   * @param refreshToken 무효화할 리프레시 토큰
   * @param userUuid 사용자 UUID
   * @throws InvalidRefreshTokenException 유효하지 않은 토큰 또는 사용자 불일치
   */
  async logout(refreshToken: string, userUuid: string) {
    const tokenData = await this.authRepository.findByRefreshToken(refreshToken);
    
    if (!tokenData || tokenData.member.uuid !== userUuid) {
      throw new InvalidRefreshTokenException();
    }

    // 리프레시 토큰만 revoke
    await this.authRepository.revokeRefreshToken(refreshToken);
  }

  /**
   * 사용자의 모든 디바이스 로그아웃
   * @param userUuid 사용자 UUID
   * @throws UnauthorizedException 사용자 미존재
   */
  async logoutAll(userUuid: string) {
    const member = await this.authRepository.findByUuid(userUuid);
    if (!member) {
      throw new UnauthorizedException('사용자를 찾을 수 없습니다.');
    }

    // MembersService를 통해 토큰 버전 증가
    await this.membersService.incrementTokenVersion(member.id);
    await this.authRepository.revokeAllRefreshTokens(member.id);
  }

  /**
   * 이메일과 비밀번호로 사용자 검증
   * @param email 사용자 이메일
   * @param password 사용자 비밀번호
   * @throws BadRequestException 이메일 또는 비밀번호 누락
   * @throws UnauthorizedException 인증 실패 또는 계정 잠금
   * @return 검증된 사용자 정보
   */
  async validateMember(email: string, password: string): Promise<AuthUser | null> {
    this.logger.log('validateMember 호출됨');
    this.logger.log('email:', email);
    this.logger.log('password:', password);
    if (!email || !password) {
      throw new BadRequestException('이메일과 비밀번호를 모두 입력해주세요.');
    }

    // 이메일 해시값으로 사용자 조회
    const hashedEmail = EmailUtil.hashEmail(email);
    this.logger.log('해시된 이메일:', hashedEmail); // 디버깅 추가
    
    const user = await this.membersService.findByHashedEmail(hashedEmail);
    this.logger.log('DB 조회 결과 raw:', user); // 디버깅 추가
    
    if (!user || !user.password) {
        throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
    }

    // 계정 잠금 확인
    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
      throw new UnauthorizedException('계정이 잠겼습니다. 잠시 후 다시 시도해주세요.');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      this.logger.log('비밀번호 불일치');
      await this.membersService.incrementLoginAttempts(email);
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
    } else {
      this.logger.log('비밀번호 일치: ', isPasswordValid);
    }

    // 이메일 복호화하여 원본 이메일 획득
    const decryptedEmail = EmailUtil.decryptEmail(user.email);
    await this.membersService.resetLoginAttempts(decryptedEmail);
    
    const authUser = {
      id: user.id,
      uuid: user.uuid,
      email: decryptedEmail, // 복호화된 이메일 사용
      nickname: user.nickname,
      role: user.role || 'USER',
      preferences: user.preferences || {
        language: 'ko',
        timezone: 'Asia/Seoul',
        theme: 'light'
      },
      status: user.status,
      tokenVersion: user.tokenVersion || 0,
    };
    
    this.logger.log('반환되는 AuthUser:', authUser);
    return authUser;
  }

  /**
   * UUID로 회원 조회
   * @param uuid 조회할 회원의 UUID
   * @return 조회된 회원 정보
   */
  async findMemberByUuid(uuid: string) {
    return this.membersService.findOneByUuid(uuid);
  }

  /**
   * 소셜 로그인 제공자의 인증 URL 생성
   * @param provider 소셜 로그인 제공자 (예: GOOGLE)
   * @throws BadRequestException 지원하지 않는 제공자
   * @return 소셜 로그인 인증 URL
   */
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
    
    this.logger.log('url from getSocialLoginUrl:', url);
    return url;
  }

  /**
   * 소셜 로그인 처리
   * @param socialLoginDto 소셜 로그인 정보 DTO
   * @throws ConflictException 이메일 중복
   * @return 로그인 결과 (액세스 토큰, 리프레시 토큰)
   */
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
        nickname: socialMember.nickname,
        role: socialMember.role,
        preferences: socialMember.preferences,
        status: socialMember.status,
        tokenVersion: socialMember.tokenVersion
      };

      return this.login(user, socialLoginDto.clientType, socialLoginDto.keepLoggedIn);
    } catch (error) {
      this.logger.error('Social login error:', error);
      throw error;
    }
  }

  /**
   * Google OAuth2 인증 코드로 액세스 토큰 요청
   * @param code Google OAuth2 인증 코드
   * @throws Error Google 토큰 요청 실패
   * @return Google OAuth2 토큰 응답
   */
  async getGoogleToken(code: string) {
    
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
    this.logger.log('Response data:', responseData);

    if (!response.ok) {
      throw new Error(`Google token error: ${responseData}`);
    }

    return JSON.parse(responseData);
  }

  /**
   * Google 액세스 토큰으로 사용자 정보 조회
   * @param accessToken Google 액세스 토큰
   * @return Google 사용자 프로필 정보
   */
  async getGoogleUserInfo(accessToken: string) {
    // Google 사용자 정보 획득 로직
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return response.json();
  }

  /**
   * 소셜 로그인 제공자별 사용자 정보 표준화
   * @param provider 소셜 로그인 제공자
   * @param userInfo 제공자로부터 받은 사용자 정보
   * @throws Error 지원하지 않는 제공자
   * @return 표준화된 소셜 로그인 DTO
   */
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

  /**
   * 이메일과 비밀번호로 사용자 검증
   * 소셜 로그인 사용자는 로그인 제한
   * @param email 사용자 이메일
   * @param password 사용자 비밀번호
   * @throws UnauthorizedException 소셜 로그인 사용자의 이메일/비밀번호 로그인 시도
   * @return 검증된 사용자 정보 또는 null
   */
  async validateUser(email: string, password: string): Promise<any> {
    const hashedEmail = EmailUtil.hashEmail(email);
    const member = await this.membersService.findByHashedEmail(hashedEmail);
    this.logger.log('member from validateUser:', member);
    
    // 소셜 로그인 사용자인 경우 (비밀번호가 없는 경우)
    if (member && !member.password) {
      this.logger.log('소셜 로그인 사용자입니다. 이메일/비밀번호 로그인을 사용할 수 없습니다.');
      throw new UnauthorizedException('소셜 로그인으로 가입한 계정입니다. 소셜 로그인을 사용해주세요.');
    }
    
    if (member && await this.validatePassword(password, member.password)) {
      // 이메일 복호화 후 member 객체 반환
      const decryptedEmail = EmailUtil.decryptEmail(member.email);
      return {
        ...member,
        email: decryptedEmail
      };
    }
    return null;
  }

  /**
   * 비밀번호 검증
   * @param password 검증할 비밀번호
   * @param hashedPassword 저장된 해시된 비밀번호
   * @return 비밀번호 일치 여부
   * @private
   */
  private async validatePassword(password: string, hashedPassword: string): Promise<boolean> {
    this.logger.log('validatePassword 호출됨');
    this.logger.log('password:', password ? '존재함' : '없음');
    this.logger.log('hashedPassword:', hashedPassword ? '존재함' : '없음');
    const result = await bcrypt.compare(password, hashedPassword);
    this.logger.log('result from validatePassword:', result);
    return result;
  }
} 
