import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { ClientType } from '@common/enums/client-type.enum';
import { AuthRepository } from '../repositories/auth.repository';
import { MembersService } from '@members/members.service';
import { Member } from '@members/entities/member.entity';

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
}

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly membersService: MembersService,
  ) {}

  async localLogin(member: Member, response: Response, clientType: ClientType) {
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
      tokenVersion: member.tokenVersion || 0,
    };

    const tokens = await this.login(user, clientType);
    
    return tokens;
  }

  private setRefreshTokenCookie(response: Response, token: string): void {
    response.cookie('refresh_token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7일
    });
  }

  private async login(user: AuthUser, clientType: ClientType) {
    const payload: JwtPayload = { 
      email: user.email, 
      sub: user.uuid,
      role: user.role,
      preferences: user.preferences,
      tokenVersion: user.tokenVersion,
    };
    
    console.log('Login attempt for user:', { id: user.id, email: user.email });
    
    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: '15m',
    });
    const refreshToken = await this.jwtService.signAsync(payload, {
      expiresIn: '7d',
    });

    console.log('Generated tokens. RefreshToken:', refreshToken.substring(0, 20) + '...');
    
    try {
      await this.authRepository.saveRefreshToken(user.id, refreshToken);
      console.log('Refresh token saved successfully');
    } catch (error) {
      console.error('Error saving refresh token:', error);
      throw error;
    }

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  async refreshAccessToken(refreshToken: string, clientType: ClientType) {
    console.log('Refresh token received:', refreshToken);
    
    // 토큰 유효성 검증
    try {
      const verified = await this.jwtService.verifyAsync(refreshToken);
      console.log('Token verified:', verified);
    } catch (e) {
      console.error('Token verification failed:', e);
      const tokenData = await this.authRepository.findByRefreshToken(refreshToken);
      if (tokenData) {
        await this.authRepository.revokeAllRefreshTokens(tokenData.member.id);
      }
      throw new RefreshTokenExpiredException();
    }

    const tokenData = await this.authRepository.findByRefreshToken(refreshToken);
    console.log('Token data from DB:', tokenData);
    
    if (!tokenData || tokenData.revoked) {
      throw new InvalidRefreshTokenException();
    }

    const payload: JwtPayload = { 
      email: tokenData.member.email, 
      sub: tokenData.member.uuid,
      role: tokenData.member.role,
      preferences: tokenData.member.preferences,
      tokenVersion: tokenData.member.tokenVersion,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: '15m',
    });
    const newRefreshToken = await this.jwtService.signAsync(payload, {
      expiresIn: '7d',
    });

    // 기존 토큰 무효화하고 새 토큰 저장
    await this.authRepository.revokeRefreshToken(refreshToken);
    await this.authRepository.saveRefreshToken(tokenData.member.id, newRefreshToken);

    return {
      access_token: accessToken,
      refresh_token: newRefreshToken,
    };
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
      tokenVersion: user.tokenVersion || 0,
    };
    
    console.log('반환되는 AuthUser:', authUser);
    return authUser;
  }

  async findMemberByUuid(uuid: string) {
    // return this.authRepository.findByUuid(uuid);
    return this.membersService.findOneByUuid(uuid);
  }
} 
