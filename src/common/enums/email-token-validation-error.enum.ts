export enum EmailTokenValidationError {
  EXPIRED = '만료된 인증 토큰입니다. 새로운 인증 메일을 발송했습니다.',
  ALREADY_VERIFIED = '이미 인증이 완료된 회원입니다.',
  INVALID_TOKEN = '유효하지 않은 인증 토큰입니다.',
}