/**
 * 인증된 사용자 정보
 */
export interface AuthUser {
  id: number;
  uuid: string;
  email: string;
  nickname: string;
  role: string;
  tokenVersion: number;
  preferences: {
    language: string;
    timezone: string;
    theme: string;
  };
  status: string;
}

/**
 * JWT 토큰 페이로드
 */
export interface JwtPayload {
  sub: string;    // uuid
  role: string;
  tokenVersion: number;
  keepLoggedIn: boolean;
} 