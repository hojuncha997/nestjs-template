/**
 * 인증된 회원 정보 인터페이스
 */
export interface AuthMember {
  id: number;
  uuid: string;
  email: string;
  nickname: string;
  role: string;
  preferences?: {
    language: string;
    timezone: string;
    theme: string;
  };
  status: string;
  tokenVersion: number;
}

/**
 * JWT 토큰 페이로드 인터페이스
 */
export interface JwtPayload {
  sub: string;
  role: string;
  tokenVersion: number;
  keepLoggedIn: boolean;
  // iat와 exp는 JWT 표준 클레임(Standard Claims)으로, 라이브러리가 자동으로 처리
} 