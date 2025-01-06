// member-status.enum.ts
// 경로: src/common/enums/member-status.enum.ts

export enum MemberStatus {
    ACTIVE = 'active',          // 정상 활동
    INACTIVE = 'inactive',      // 비활성화 (회원이 직접 비활성화)
    SUSPENDED = 'suspended',    // 정지 (관리자가 제재)
    DORMANT = 'dormant',       // 휴면 (장기 미접속)
    PENDING = 'pending',        // 가입 대기 (이메일 인증 전)
    BLOCKED = 'blocked',        // 영구 정지 (심각한 위반으로 인한 영구 제재)
    WITHDRAWAL = 'withdrawal'   // 탈퇴 처리 (회원 탈퇴 진행 중 - 유예 기간)
}