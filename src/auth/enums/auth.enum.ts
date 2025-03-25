/**
 * 소셜 로그인 제공자
 */
export enum AuthProvider {
  GOOGLE = 'google',
  KAKAO = 'kakao',
  NAVER = 'naver'
}

/**
 * 사용자 역할
 */
export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  GUEST = 'guest'
}

/**
 * 사용자 상태
 */
export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  DELETED = 'deleted'
}

/**
 * 인증 방식
 */
export enum AuthMethod {
  LOCAL = 'local',
  SOCIAL = 'social'
}

/**
 * 토큰 타입
 */
export enum TokenType {
  ACCESS = 'access',
  REFRESH = 'refresh'
} 