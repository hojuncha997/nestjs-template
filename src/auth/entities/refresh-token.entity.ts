// src/auth/entities/refresh-token.entity.ts
// 리프레시 토큰 엔티티

import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, Index } from 'typeorm';
import { Member } from '../../members/entities/member.entity';
@Entity()
@Index(['token', 'revoked']) // 복합 인덱스 추가
export class RefreshToken {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Index()
  token: string;

  @Column({ default: false })
  keepLoggedIn: boolean;

  @Column()
  @Index()  // memberId에 대한 인덱스 추가
  memberId: number;

  @ManyToOne(() => Member, member => member.refreshTokens, { 
    onDelete: 'CASCADE',
    eager: false
  })
  @JoinColumn({ name: 'memberId', referencedColumnName: 'id' })
  member: Member;

  @Column({ nullable: true })
  deviceInfo: string;

  @Column({ nullable: true })
  ipAddress: string;

  @Column()
  expiresAt: Date;

  @Column({ default: false })
  revoked: boolean;

  @Column({ nullable: true })
  revokedAt: Date;

  @Column({ nullable: true })
  revokedReason: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ default: 0 })
  tokenVersion: number;
}