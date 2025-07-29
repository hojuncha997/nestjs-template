/**
 * 인증 관련 에러 메시지
 */
export const AUTH_ERROR_MESSAGES = {
  REFRESH_TOKEN: {
    EXPIRED: '리프레시 토큰이 만료되었습니다.',
    INVALID: '유효하지 않은 리프레시 토큰입니다.',
    REQUIRED: '리프레시 토큰이 필요합니다.',
    REVOKED: '이미 무효화된 토큰입니다.'
  },
  LOGIN: {
    INVALID_CREDENTIALS: '이메일 또는 비밀번호가 올바르지 않습니다.',
    ACCOUNT_LOCKED: '계정이 잠겼습니다. 잠시 후 다시 시도해주세요.',
    MISSING_CREDENTIALS: '이메일과 비밀번호를 모두 입력해주세요.',
    SOCIAL_LOGIN_REQUIRED: '소셜 로그인으로 가입한 계정입니다. 소셜 로그인을 사용해주세요.'
  },
  SOCIAL: {
    INVALID_PROVIDER: 'Invalid provider: ',
    EMAIL_EXISTS: '이미 가입된 이메일입니다.',
    LOGIN_FAILED: '소셜 로그인 실패',
    TOKEN_ERROR: 'Google token error: '
  },
  USER: {
    NOT_FOUND: '사용자를 찾을 수 없습니다.',
    INVALID_TOKEN_OWNERSHIP: 'Invalid token ownership'
  }
} as const; 