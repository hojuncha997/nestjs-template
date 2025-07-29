/**
* src/members/entities/member.entity.ts
* 멤버 엔티티: 데이터베이스의 members 테이블과 매핑되는 엔티티 클래스
* 회원의 기본 정보, 인증 정보, 포인트, 레벨 등을 관리
* 엔티티에서는 데이터 구조와 제약에만 집중한다.
* MinLength 등의 'class-validator'의 데코레이터는 dto에서 적용한다.
*/

import { v4 as uuidv4 } from 'uuid';
import {
   Entity,
   PrimaryGeneratedColumn,
   Column,
   CreateDateColumn,
   UpdateDateColumn,
   DeleteDateColumn,
   OneToMany,
   Index
} from 'typeorm';

import { 
   AuthProvider, 
   Role, 
   Notification, 
   Language, 
   Theme,
   MemberStatus
} from '@common/enums';

import { RefreshToken } from '@auth/entities/refresh-token.entity';

@Entity('members')

// 소셜 로그인 관련 복합 인덱스
@Index('idx_member_provider_provider_id', ['provider', 'providerId'])
export class Member {
   @PrimaryGeneratedColumn()
   id: number;  // 내부 사용 기본키

   // 외부 노출용 식별자
   @Column('uuid', { 
       unique: true // 유니크 설정이 돼 있어서 자동으로 인덱스 생성됨
   })
   uuid: string = uuidv4();  // 외부 노출용 식별자

   /**
    * 인증 관련 필드
    */
   @Column({ 
    //    name: 'email',
       unique: true // 유니크 설정이 돼 있어서 자동으로 인덱스 생성됨
   })
   email: string;

     // 해시된 이메일 인덱스 (로그인, 검색에 주로 사용)
    @Index('idx_member_hashed_email')
   @Column({
       name: 'hashed_email',
       nullable: true,
       select: false,
   })
   hashedEmail?: string;

    //    name: 'email_verified',
   @Column({ 
    //    name: 'password',
       nullable: true,
       select: false  // 기본 쿼리에서 비밀번호 필드 수집 제외. 
       // 포함시키려면 select: {password: true}처럼 명시적으로 password 필드 요청
   })
   password?: string;

   @Column({ 
    //    name: 'password_changed_at',
       type: 'timestamp', 
       nullable: true 
   })
   passwordChangedAt?: Date;  // 비밀번호 변경 시간

   /**
    * 비밀번호 재설정 관련
    */
   @Column({ 
    //    name: 'password_reset_token',
       nullable: true, 
       select: false 
   })
   passwordResetToken?: string;

   @Column({ 
    //    name: 'password_reset_token_expires_at',
       type: 'timestamp', 
       nullable: true 
   })
   passwordResetTokenExpiresAt?: Date;

   @Column({
    //    name: 'provider',
       type: 'enum',
       enum: AuthProvider  // 겍체를 전달해줘도 내부적으로는 문자열 배열로 처리됨
   })
   provider: AuthProvider;

   @Column({ 
    //    name: 'provider_id',
       nullable: true 
   })
   providerId?: string;



    /**
    * 소셜 로그인 관련: 아래 구조로 들어간다. 
    * {
  "GOOGLE": {
    "id": "123456789",
    "email": "user@gmail.com",
    "name": "John Doe",
    "profileUrl": "https://lh3.googleusercontent.com/..."
  },
  "KAKAO": {
    "id": "987654321", 
    "email": "user@kakao.com",
    "name": "홍길동"
  }
}
    */
   @Column({ 
    //    name: 'social_profiles',
       type: 'jsonb', 
       nullable: true 
   })
   socialProfiles?: {
    // [key: string]: {
       [K in AuthProvider]?: {  // AuthProvider enum의 값들만 키로 사용 가능
           id: string;
           email?: string;
           name?: string;
           profileUrl?: string;
       };
   };

   /**
    * 보안 관련
    * "단번에 모든 사용자 토큰 무효화"가 필요한 상황에서 사용
    *  예를 들어 비밀번호 변경 시 모든 토큰을 무효화하는 경우
    *  또는 회원 탈퇴 시 모든 토큰을 무효화하는 경우
    *  또는 관리자가 특정 사용자의 모든 세션을 강제 로그아웃 시키는 경우
    *  토큰 탈가 의심되는 경우
    */
   @Column({ 
    //    name: 'token_version',
       default: 0 
   })
   tokenVersion: number;  // 토큰 무효화를 위한 버전 관리

   @Column({ 
    //    name: 'login_attempts',
       default: 0 
   })
   loginAttempts: number;  // 로그인 시도 횟수

   @Column({ 
    //    name: 'lockout_until',
       type: 'timestamp', 
       nullable: true 
   })
   lockoutUntil?: Date;   // 계정 잠금 시간

   /**
    * 2단계 인증 관련
    */
   // 2단계 인증 활성화 여부
   @Column({ 
    //    name: 'two_factor_enabled',
       default: false 
   })
   twoFactorEnabled: boolean;

   // 2단계 인증 비밀번호
   @Column({ 
    //    name: 'two_factor_secret',
       nullable: true, 
       select: false 
   })
   twoFactorSecret?: string;

   /**
    * 약관 동의 관련
    */
   @Column({ 
    //    name: 'terms_agreed',
       type: 'boolean', 
       default: true
   })
   termsAgreed: boolean;

   @Column({ 
    //    name: 'terms_agreed_at',
       type: 'timestamp', 
       nullable: true 
   })
   termsAgreedAt?: Date;

   /**
    * 개인정보 처리방침 동의 관련
    */
   @Column({ 
    //    name: 'privacy_agreed',
       default: false 
   })
   privacyAgreed: boolean;

   @Column({ 
    //    name: 'privacy_agreed_at',
       type: 'timestamp', 
       nullable: true 
   })
   privacyAgreedAt?: Date;

   /**
    * 연령 동의 관련
    */
   @Column({ 
    //    name: 'age_verified',
       default: false 
   })
   ageVerified: boolean;

    @Column({ 
        // name: 'age_verified_at',
        type: 'timestamp', 
        nullable: true 
    })
    ageVerifiedAt?: Date;

   /**
    * 선택적 정보들
    */
   @Column({ 
       name: 'name',
       nullable: true 
   })
   name?: string;

   @Column({ 
       name: 'nickname',
       nullable: true 
   })
   nickname?: string;
   
   @Column({ 
       name: 'phone_number',
       nullable: true 
   })
   phoneNumber?: string;

   /**
    * 이메일 인증 관련
    */
   @Column({
    //    name: 'email_verified',
       default: false 
   })
   emailVerified: boolean;

   @Column({
    //    name: 'email_verified_at',
       type: 'timestamp', 
       nullable: true 
   })
   emailVerifiedAt?: Date;  // 이메일 인증 시간

   @Column({ 
    //    name: 'verification_token',
       nullable: true, 
       select: false  // 기본 쿼리에서 제외됨
   })
   verificationToken?: string;

   @Column({ 
    //    name: 'verification_token_expires_at',
       type: 'timestamp', 
       nullable: true 
   })
   verificationTokenExpiresAt?: Date;  // 인증 토큰 만료 시간

   @Column({ 
    //    name: 'profile_image',
       nullable: true 
   })
   profileImage?: string;

   @Column({
    //    name: 'last_login_at',
       type: 'timestamp', 
       nullable: true 
   })
   lastLoginAt?: Date;

   /**
    * 계정 비활성화/탈퇴 관련
    */
   @Column({ 
    //    name: 'deactivated_at',
       type: 'timestamp', 
       nullable: true 
   })
   deactivatedAt?: Date;  // 계정 비활성화 시점

   /**
    * 마케팅 관련
    */
   @Column({
    // name: 'marketing_agreed',
    default: false })
   marketingAgreed: boolean;

   @Column({ 
    //    name: 'marketing_agreed_at',
       type: 'timestamp', 
       nullable: true 
   })
   marketingAgreedAt?: Date;

   /**
    * 알림 설정
    * 계산된 속성명(Computed Property): 변수/함수/enum 등의 변수 수 있는 값을 객체 'key'로 쓸 때만 [](대괄호)로 감싸야 함
    */
   @Column('jsonb', {
    //    name: 'notification_settings',
       default: {
           [Notification.EMAIL]: false,  // 이메일 인증 전까지는 false로 시작
           [Notification.PUSH]: false,
           [Notification.SMS]: false,
           [Notification.MARKETING]: false,
           [Notification.IN_APP]: true
       }
   })
   notificationSettings: {
       [Notification.EMAIL]: boolean;
       [Notification.PUSH]: boolean;
       [Notification.SMS]: boolean;
       [Notification.MARKETING]: boolean;
       [Notification.IN_APP]: boolean;
   };

   /**
    * 회원 상태 관리
    */
    // 상태 + 생성일자 복합 인덱스 (회원 통계, 필터링에 유용)
   @Index('idx_member_status_created_at', ['status', 'createdAt'])
   @Column({
    //    name: 'member_status',
       type: 'enum',
       enum: MemberStatus,
       default: MemberStatus.ACTIVE  // 기본은 ACTIVE, 이메일 인증이 필요한 경우 PENDING으로 변경
   })
   status: MemberStatus;

   /**
    * 사용자 설정
    */
   @Column('jsonb', {
    //    name: 'preferences',
       default: {
           language: Language.KO,
           timezone: 'UTC',
           theme: Theme.LIGHT
       }
   })
   preferences: {
       language: Language;
       timezone: string;
       theme: Theme;
   };

   /**
    * 역할 관련 (ADMIN, USER, MANAGER 등)
    */
   @Column({
       name: 'role',
       type: 'enum',
       enum: Role,
       default: Role.USER
   })
   role: Role;

   @CreateDateColumn({
    // name: 'created_at',
    type: 'timestamp'
   })
   createdAt: Date;

   @UpdateDateColumn({
    // name: 'updated_at',
    type: 'timestamp'
   })
   updatedAt: Date;

   @DeleteDateColumn({
    // name: 'deleted_at',
    type: 'timestamp',
    nullable: true
   })
   deletedAt?: Date;

   /**
    * 포인트 정보를 담는 타입
    */
   @Column('jsonb', {
    //    name: 'points',
       default: {
           total: 0,          // 전체 포인트
           purchase: 0,       // 구매 포인트
           reward: 0          // 리워드 포인트
       }
   })
   points: {
       total: number;
       purchase: number;
       reward: number;
   };

   /**
    * 레벨 정보를 담는 타입
    */
   @Column('jsonb', {
    //    name: 'level_info',
       default: {
           level: 1,
           experience: 0
       }
   })
   levelInfo: {
       level: number;
       experience: number;
   };

   @OneToMany(() => RefreshToken, refreshToken => refreshToken.member)
   refreshTokens: RefreshToken[];

}