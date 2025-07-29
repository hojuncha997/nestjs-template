export enum TokenRevokeReason {
  USER_LOGOUT = 'USER_LOGOUT',                 // 사용자가 직접 로그아웃
  USER_LOGOUT_ALL = 'USER_LOGOUT_ALL',         // 사용자가 모든 디바이스 로그아웃
  NEW_TOKEN_ISSUED = 'NEW_TOKEN_ISSUED',       // 새로운 토큰 발급으로 인한 revoke
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',             // 토큰 만료
  SECURITY_CONCERN = 'SECURITY_CONCERN',       // 보안 문제로 인한 revoke
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',       // 비밀번호 변경으로 인한 revoke
  ADMIN_ACTION = 'ADMIN_ACTION'                // 관리자 조치로 인한 revoke
} 