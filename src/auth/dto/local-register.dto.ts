// local-register.dto.ts 경로: src/auth/dto/local-register.dto.ts

import { IsEmail, IsString, MinLength } from 'class-validator';
// 클래스 검증 데코레이터 (pnpm add class-validator class-transformer)
// NestJS 앱에서 이 검증을 활성화하려면 main.ts에서 ValidationPipe를 추가해야 한다.

// 로컬 회원가입 시 사용되는 DTO(사용자가 직접 이메일과 비밀번호를 입력하는 경우)
export class LocalRegisterDto {
  @IsEmail()
  email: string;
  
  @IsString()
  @MinLength(8)
  password: string;
}