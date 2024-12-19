// local-login.dto.ts
//경로: src/auth/dto/local-login.dto.ts

import { IsEmail, IsString, MinLength } from 'class-validator';
// 클래스 검증 데코레이터 (pnpm add class-validator class-transformer)
// NestJS 앱에서 이 검증을 활성화하려면 main.ts에서 ValidationPipe를 추가해야 한다.

export class LocalLoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;
} 