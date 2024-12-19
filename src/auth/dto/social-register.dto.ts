// social-register.dto.ts
// 경로: src/auth/dto/social-register.dto.ts

import { AuthProvider } from '@common/enums/auth-provider.enum';
import { IsString, IsEnum } from 'class-validator';

// 소셜 회원가입 시 사용되는 DTO
export class SocialRegisterDto {
    @IsString()
    token: string;  // 소셜 로그인 후 받은 액세스 토큰
  
    @IsEnum(AuthProvider)
    provider: AuthProvider;  // 소셜 서비스 구분자 (GOOGLE, KAKAO 등)
}

/*
소셜 회원가입 프로세스:
1. 사용자가 소셜 회원가입 버튼 클릭
2. 소셜 인증 완료 후 프론트엔드가 액세스 토큰을 받음
3. 프론트엔드가 토큰과 provider 정보를 서버로 전송
4. 서버는 받은 토큰을 사용해 해당 소셜 서비스의 API 호출
5. 소셜 API에서 사용자의 고유 ID를 받아옴
    (해당 서비스에서의 사용자의 동의에 따라 고유 아이디 말고도 이름, 이메일 등 정보를 받아올 수 있음
    그러나 기본적으로 고유 ID만 받아오는 것이 일반적)
6. 해당 소셜 ID로 새 계정을 생성하고 JWT 토큰 발급
*/