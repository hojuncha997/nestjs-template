// social-login.dto.ts
// 경로: src/auth/dto/social-login.dto.ts

import { AuthProvider } from '@common/enums/auth-provider.enum';
import { ClientType } from '@common/enums';

export class SocialLoginDto {
  email: string;
  name?: string;
  picture?: string;
  provider: AuthProvider;
  // token: string; // 프론트엔드에서 받은 토큰
  providerId: string;
  keepLoggedIn?: boolean;
  clientType?: ClientType;
}
/*
소셜 로그인 프로세스

- 사용자가 소셜 로그인 클릭
- 소셜 로그인 완료 후 프론트엔드가 token 받음
- 그 token을 서버로 전송
- 서버가 token으로 소셜 API 호출해서 socialId 획득
- socialId로 DB에서 사용자 찾아서 로그인 처리
*/