// src/members/dto/create-member.dto.ts
// 멤버 생성 DTO: 새로운 회원 가입 시 필요한 데이터 정의
// 필수 정보만을 포함하여 회원가입의 진입 장벽을 낮춤

import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, IsBoolean, IsEnum } from 'class-validator';
import { AuthProvider } from '@common/enums';

export class CreateMemberDto {
  @ApiProperty({
    example: 'user@example.com',
    description: '사용자 이메일 (로그인 ID로 사용)',
    required: true,
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'Password123!',
    description: '비밀번호 (최소 8자)',
    required: true,
  })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({
    example: true,
    description: '이용약관 동의',
    required: true,
  })
  @IsBoolean()
  termsAgreed: boolean;

  @ApiProperty({
    example: true,
    description: '개인정보 처리방침 동의',
    required: true,
  })
  @IsBoolean()
  privacyAgreed: boolean;

  @ApiProperty({
    example: false,
    description: '마케팅 수신 동의 (선택)',
    required: false,
    default: false,
  })
  @IsBoolean()
  marketingAgreed: boolean = false;

  @ApiProperty({
    example: 'email',
    description: '인증 제공자',
    enum: AuthProvider,
    default: AuthProvider.LOCAL,
  })
  @IsEnum(AuthProvider)
  provider: AuthProvider = AuthProvider.LOCAL;
} 