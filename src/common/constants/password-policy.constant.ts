// src/common/constants/password-policy.constant.ts
// 비밀번호 정책 상수

export const PASSWORD_POLICY = {
  MIN_LENGTH: 8,
  MAX_LENGTH: 128,
  REQUIRE_UPPERCASE: true,
  REQUIRE_LOWERCASE: true,
  REQUIRE_NUMBER: true,
  REQUIRE_SPECIAL_CHAR: true,
  SPECIAL_CHARS: '!@#$%^&*()_+-=[]{}|;:,.<>?',
  // 정규식
  PATTERNS: {
    UPPERCASE: /[A-Z]/,
    LOWERCASE: /[a-z]/,
    NUMBER: /[0-9]/,
    SPECIAL_CHAR: /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/,
  }
} as const;

export const PASSWORD_VALIDATION_MESSAGE = {
  MIN_LENGTH: '비밀번호는 최소 8자 이상이어야 합니다.',
  MAX_LENGTH: '비밀번호는 최대 128자까지 가능합니다.',
  REQUIRE_UPPERCASE: '대문자를 최소 1자 이상 포함해야 합니다.',
  REQUIRE_LOWERCASE: '소문자를 최소 1자 이상 포함해야 합니다.',
  REQUIRE_NUMBER: '숫자를 최소 1자 이상 포함해야 합니다.',
  REQUIRE_SPECIAL_CHAR: '특수문자를 최소 1자 이상 포함해야 합니다.',
} as const; 