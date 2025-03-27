import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsObject, IsBoolean, IsEnum, IsNumber, IsDate } from 'class-validator';
import { Language, Theme, MemberStatus, Notification, AuthProvider } from '@common/enums';

export class MemberProfileDto {
  @ApiProperty({ description: '사용자 이메일' })
  @IsString()
  email: string;

  @ApiProperty({ description: '사용자 이름', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ description: '사용자 닉네임' })
  @IsString()
  nickname: string;

  @ApiProperty({ description: '사용자 프로필 이미지 URL', required: false })
  @IsString()
  @IsOptional()
  profileImage?: string;

  @ApiProperty({ description: '계정 상태' })
  @IsEnum(MemberStatus)
  status: MemberStatus;

  @ApiProperty({ description: '이메일 인증 여부' })
  @IsBoolean()
  emailVerified: boolean;

  @ApiProperty({ description: '이메일 인증 시간', required: false })
  @IsDate()
  @IsOptional()
  emailVerifiedAt?: Date;

  @ApiProperty({ description: '마지막 로그인 시간', required: false })
  @IsDate()
  @IsOptional()
  lastLoginAt?: Date;

  @ApiProperty({ description: '소셜 회원 여부' })
  @IsBoolean()
  isSocialMember: boolean;

  @ApiProperty({ description: '소셜 로그인 제공자', enum: AuthProvider })
  @IsEnum(AuthProvider)
  provider: AuthProvider;

  @ApiProperty({ description: '사용자 설정' })
  @IsObject()
  preferences: {
    language: Language;
    timezone: string;
    theme: Theme;
  };

  @ApiProperty({ description: '알림 설정' })
  @IsObject()
  notificationSettings: {
    [Notification.EMAIL]: boolean;
    [Notification.PUSH]: boolean;
    [Notification.SMS]: boolean;
    [Notification.MARKETING]: boolean;
    [Notification.IN_APP]: boolean;
  };

  @ApiProperty({ description: '포인트 정보' })
  @IsObject()
  points: {
    total: number;
    purchase: number;
    reward: number;
  };

  @ApiProperty({ description: '레벨 정보' })
  @IsObject()
  levelInfo: {
    level: number;
    experience: number;
  };

  @ApiProperty({ description: '마케팅 동의 여부' })
  @IsBoolean()
  marketingAgreed: boolean;

  @ApiProperty({ description: '약관 동의 여부' })
  @IsBoolean()
  termsAgreed: boolean;

  @ApiProperty({ description: '개인정보 처리방침 동의 여부' })
  @IsBoolean()
  privacyAgreed: boolean;
} 