// src/members/entities/withdrawn-member.entity.ts
// 탈퇴한 회원의 정보를 저장하는 엔티티

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { AuthProvider } from '@common/enums';
import { Member } from './member.entity';

// 탈퇴한 회원의 정보를 저장하는 엔티티
@Entity('withdrawn_members')
export class WithdrawnMember {
 
 @PrimaryGeneratedColumn({name: 'id'})
 id: number;

 // 회원의 기본키를 참조하는 외래키
 @ManyToOne(() => Member)
 @JoinColumn({ name: 'member_id' })
 member: Member;

 // 회원의 고유 식별자(외부용)
 @Column({name: 'member_uuid'})
 memberUuid: string;

 @Column({name: 'email'})
 email: string;  // 암호화된 이메일

 @Column({name: 'hashed_email'})
 hashedEmail: string;

 @Column({
   type: 'enum',
   enum: AuthProvider
 })
 provider: AuthProvider;

 @Column({name: 'provider_id', nullable: true })
 providerId?: string;

 @Column({name: 'withdrawn_at'})
 withdrawnAt: Date;

 @Column({name: 'withdrawal_reason', type: 'jsonb', nullable: true })
 withdrawalReason?: {
   reason: string;
   detail?: string;
 };

 // 통계/분석용 데이터
 @Column({name: 'account_info', type: 'jsonb', nullable: true })
 accountInfo: {
   registeredAt: Date;  // 가입일
   lastLoginAt?: Date;  // 마지막 로그인
   emailVerified: boolean;  // 이메일 인증 여부
   marketingAgreed: boolean;  // 마케팅 동의 여부
   levelInfo: {
     level: number;
     experience: number;
   };
   points: {
     total: number;
     purchase: number;
     reward: number;
   };
 };

 @CreateDateColumn({name: 'created_at'})
 createdAt: Date;  // 탈퇴 처리된 시점
}