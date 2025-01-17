// auth.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Member } from '@members/entities/member.entity';
import { RefreshToken } from '@auth/entities/refresh-token.entity';

@Injectable()
export class AuthRepository {
 constructor(
   @InjectRepository(RefreshToken)
   private refreshTokenRepository: Repository<RefreshToken>,
   @InjectRepository(Member)
   private memberRepository: Repository<Member>,
 ) {}

 async findByUuid(uuid: string): Promise<Member | null> {
   return this.memberRepository.findOne({ where: { uuid } });
 }

 async findByRefreshToken(token: string): Promise<RefreshToken | null> {
   return this.refreshTokenRepository
     .createQueryBuilder('refreshToken')
     .innerJoinAndSelect('refreshToken.member', 'member')
     .where('refreshToken.token = :token', { token })
     .andWhere('refreshToken.revoked = :revoked', { revoked: false })
     .andWhere('member.id = refreshToken.memberId')
     .andWhere('refreshToken.tokenVersion = member.tokenVersion')
     .select([
       'refreshToken.id',
       'refreshToken.token',
       'refreshToken.memberId',
       'refreshToken.deviceInfo',
       'refreshToken.ipAddress',
       'refreshToken.expiresAt',
       'refreshToken.revoked',
       'refreshToken.revokedAt',
       'refreshToken.createdAt',
       'refreshToken.keepLoggedIn',
       'refreshToken.tokenVersion',
       'member.id',
       'member.uuid',
       'member.email',
       'member.role',
       'member.preferences'
     ])
     .getOne();
 }

 async saveRefreshToken(memberId: number, token: string, keepLoggedIn: boolean): Promise<void> {
   console.log('Starting saveRefreshToken process for member:', memberId);
   
   await this.refreshTokenRepository.manager.transaction(async transactionalEntityManager => {
     // uuid로 정확한 member 찾기
     const member = await transactionalEntityManager.getRepository(Member).findOne({
       where: { id: memberId },
       select: {
         id: true,
         uuid: true,
         email: true,
         role: true,
         preferences: {
           language: true,
           timezone: true,
           theme: true
         },
         tokenVersion: true
       }
     });

     if (!member) {
       throw new Error(`Member not found with id: ${memberId}`);
     }

     console.log('Found member for refresh token:', {
       id: member.id,
       email: member.email,
       uuid: member.uuid
     });

     // 기존 토큰 revoke
     const updateResult = await transactionalEntityManager
       .createQueryBuilder()
       .update(RefreshToken)
       .set({
         revoked: true,
         revokedAt: new Date(),
         revokedReason: 'NEW_TOKEN_ISSUED'
       })
       .where('member = :memberId AND revoked = :revoked', { 
         memberId: member.id, 
         revoked: false 
       })
       .execute();

     // 새 토큰 저장
     const tokenEntity = new RefreshToken();
     tokenEntity.token = token;
     tokenEntity.member = member;  // 전체 member 객체 사용
     tokenEntity.tokenVersion = member.tokenVersion;
     tokenEntity.keepLoggedIn = keepLoggedIn;
     tokenEntity.expiresAt = new Date(Date.now() + (keepLoggedIn ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000));

     const saved = await transactionalEntityManager.save(RefreshToken, tokenEntity);

     // 저장 확인
     const verify = await transactionalEntityManager.getRepository(RefreshToken).findOne({
       where: { id: saved.id },
       relations: ['member'],
       select: {
         id: true,
         token: true,
         keepLoggedIn: true,
         member: {
           id: true,
           uuid: true,
           email: true
         }
       }
     });

     console.log('Saved refresh token verification:', {
       tokenId: verify?.id,
       memberEmail: verify?.member?.email,
       memberUuid: verify?.member?.uuid
     });
   });
 }

//  async revokeRefreshToken(token: string, reason: TokenRevokeReason): Promise<boolean> {
  async revokeRefreshToken(token: string): Promise<boolean> {
   
  const result = await this.refreshTokenRepository.update(
     { token, revoked: false },
     { 
       revoked: true,
       revokedAt: new Date(),
      //  revokedReason: reason
     }
   );
   return result.affected > 0;
 }

//  async revokeAllRefreshTokens(memberId: number, reason: TokenRevokeReason): Promise<void> {
  async revokeAllRefreshTokens(memberId: number): Promise<void> {

   await this.refreshTokenRepository.update(
     { member: { id: memberId }, revoked: false },
     { 
       revoked: true,
       revokedAt: new Date(),
      //  revokedReason: reason
     }
   );
 }

 async findByEmail(email: string): Promise<Member | null> {
   return this.memberRepository.findOne({
     where: { email },
     select: {
       id: true,
       uuid: true,
       email: true,
       password: true,
       status: true,
       emailVerified: true,
       loginAttempts: true,
       lockoutUntil: true,
       role: true,
       preferences: {
         language: true,
         timezone: true,
         theme: true
       },
       tokenVersion: true
     }
   });
 }
}