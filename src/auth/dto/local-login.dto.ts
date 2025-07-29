// local-login.dto.ts
//경로: src/auth/dto/local-login.dto.ts

import { ClientType } from '@common/enums/client-type.enum';
import { IsEmail, IsString, MinLength, IsEnum, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
// 클래스 검증 데코레이터 (pnpm add class-validator class-transformer)
// NestJS 앱에서 이 검증을 활성화하려면 main.ts에서 ValidationPipe를 추가해야 한다.

export class LocalLoginDto {
  @ApiProperty({
    example: 'user@example.com',
    description: '사용자 이메일',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'password123',
    description: '비밀번호 (최소 8자)',
  })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({
    enum: ClientType,
    description: '클라이언트 타입 (web 또는 mobile)',
    example: ClientType.WEB,
  })
  @IsEnum(ClientType)
  clientType: ClientType; // 클라이언트 타입 : web, mobile

  @ApiProperty({
    example: true,
    description: '로그인 상태 유지 여부',
  })
  @IsBoolean()
  keepLoggedIn: boolean;
} 