// src/common/constants/error-messages.constant.ts
// 에러 메시지 상수

export const ERROR_MESSAGES = {
  MEMBER_NOT_FOUND: 'Member not found',
  EMAIL_ALREADY_EXISTS: 'Email already exists',
  MEMBER_STATUS: {
    ALREADY_INACTIVE: '이미 비활성화된 계정입니다.',
    ALREADY_BLOCKED: '영구 정지된 계정입니다.',
    SUSPENDED: '계정이 일시 정지되었습니다. 관리자에게 문의하세요.',
    DORMANT: '휴면 상태인 계정입니다. 본인인증 후 이용해주세요.',
    PENDING: '이메일 인증이 필요합니다.',
    WITHDRAWAL: '탈퇴 처리중인 계정입니다.'
  }
} as const; 