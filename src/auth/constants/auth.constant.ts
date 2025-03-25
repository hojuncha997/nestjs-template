import { AuthProviderUrl } from '@auth/enums/auth-provider.enum';

/**
 * 토큰 관련 상수
 */
export const TOKEN_CONSTANTS = {
  ACCESS_TOKEN: {
    EXPIRES_IN: '15m',
    COOKIE_NAME: 'access_token'
  },
  REFRESH_TOKEN: {
    EXPIRES_IN: '7d',
    COOKIE_NAME: 'refresh_token',
    COOKIE_MAX_AGE: 7 * 24 * 60 * 60 * 1000 // 7일
  }
} as const;

/**
 * 쿠키 설정 옵션
 */
export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const
} as const;

/**
 * 기본 사용자 설정
 */
export const DEFAULT_USER_PREFERENCES = {
  language: 'ko',
  timezone: 'Asia/Seoul',
  theme: 'light',
  notifications: {
    email: true,
    push: true
  }
} as const;

/**
 * 소셜 인증 설정
 */
export const SOCIAL_AUTH_CONFIG = {
  GOOGLE: {
    SCOPE: [
      'email',
      'profile'
    ],
    ACCESS_TYPE: 'offline',
    PROMPT: 'consent',
    AUTH_URL: AuthProviderUrl.GOOGLE
  },
  KAKAO: {
    AUTH_URL: AuthProviderUrl.KAKAO
  },
  NAVER: {
    AUTH_URL: AuthProviderUrl.NAVER
  }
} as const;

/**
 * 인증 관련 경로
 */
export const AUTH_ROUTES = {
  LOGIN: '/auth/login',
  LOGOUT: '/auth/logout',
  REFRESH: '/auth/refresh',
  SOCIAL: {
    GOOGLE: '/auth/google',
    KAKAO: '/auth/kakao',
    NAVER: '/auth/naver'
  }
} as const; 