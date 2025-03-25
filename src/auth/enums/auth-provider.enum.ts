/**
 * 소셜 로그인 제공자
 */
export enum AuthProvider {
  LOCAL = 'email',
  GOOGLE = 'google',
  KAKAO = 'kakao',
  NAVER = 'naver'
}

/**
 * 소셜 로그인 제공자 URL
 */
export enum AuthProviderUrl {
  GOOGLE = 'https://accounts.google.com/o/oauth2/auth',
  KAKAO = 'https://kauth.kakao.com/oauth/authorize',
  NAVER = 'https://nid.naver.com/oauth2.0/authorize'
}

/**
 * 토큰 타입
 */
export enum TokenType {
  ACCESS = 'access',
  REFRESH = 'refresh'
} 