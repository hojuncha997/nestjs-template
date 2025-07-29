// src/common/enums/withdrawal-reason.enum.ts
// 탈퇴 사유 열거형

export enum WithdrawalReason {
  NO_LONGER_NEEDED = 'NO_LONGER_NEEDED',
  DISSATISFIED = 'DISSATISFIED',
  PRIVACY_CONCERN = 'PRIVACY_CONCERN',
  FOUND_ALTERNATIVE = 'FOUND_ALTERNATIVE',
  OTHER = 'OTHER'
}

export const WithdrawalReasonLabel = {
  [WithdrawalReason.NO_LONGER_NEEDED]: '더 이상 필요하지 않음',
  [WithdrawalReason.DISSATISFIED]: '서비스 불만족',
  [WithdrawalReason.PRIVACY_CONCERN]: '개인정보 보호',
  [WithdrawalReason.FOUND_ALTERNATIVE]: '다른 서비스 이용',
  [WithdrawalReason.OTHER]: '기타'
} as const; 