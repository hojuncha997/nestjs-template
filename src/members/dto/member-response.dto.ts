// src/members/dto/member-response.dto.ts
// 멤버 응답 DTO: 멤버의 모든 공개 가능한 정보를 포함하는 응답 객체

import { MemberStatus, AuthProvider, Language, Theme, Role } from "@common/enums";
export class MemberResponseDto {
    uuid: string;              // 외부 노출용 식별자
    email: string;             // 이메일
    tokenVersion: number;      // 토큰 버전
    name?: string;             // 이름 (선택)
    nickname?: string;         // 닉네임 (선택)
    phoneNumber?: string;      // 전화번호 (선택)
    provider: AuthProvider;          // 인증 제공자 (kakao/google/email)
    providerId?: string;      // 인증 제공자 ID
    emailVerified: boolean;    // 이메일 인증 여부
    profileImage?: string;     // 프로필 이미지 URL (선택)
    status: MemberStatus;         // 계정 상태
    lastLoginAt?: Date;        // 마지막 로그인 시간

    // 약관 동의 정보
    termsAgreed: boolean;      // 이용약관 동의
    termsAgreedAt?: Date;      // 이용약관 동의 시간
    marketingAgreed: boolean;  // 마케팅 수신 동의
    marketingAgreedAt?: Date;  // 마케팅 수신 동의 시간
    privacyAgreed: boolean;    // 개인정보 수집 동의
    privacyAgreedAt?: Date;    // 개인정보 수집 동의 시간

   

    // 알림 설정
    notificationSettings: {
        email: boolean;        // 이메일 알림
        push: boolean;         // 푸시 알림
        sms: boolean;          // SMS 알림
        marketing: boolean;    // 마케팅 알림
        inApp: boolean;        // 추가
    };

    // 사용자 설정
    preferences: {
        language: Language;      // 언어 설정
        timezone: string;      // 시간대 설정
        theme: Theme;         // 테마 설정
    };

    // 포인트 및 레벨 정보
    points: {
        total: number;            // 총 포인트
        purchase: number;    // 구매 포인트
        reward: number;      // 리워드 포인트
    };
    levelInfo: {
        level: number;            // 현재 레벨
        experience: number;       // 경험치
    };
    role: Role;            // 사용자 역할 (ADMIN/USER/MANAGER)

    // 시스템 정보
    createdAt: Date;         // 계정 생성 시간
    updatedAt: Date;         // 정보 수정 시간

    id: number;
    loginAttempts: number;
    twoFactorEnabled: boolean;
    ageVerified: boolean;
    refreshTokens: any[]; // 또는 적절한 타입 정의
} 