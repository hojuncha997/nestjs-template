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
       'member.id',
       'member.uuid',
       'member.email',
       'member.role',
       'member.preferences'
     ])
     .getOne();
 }

 async saveRefreshToken(memberId: number, token: string): Promise<void> {
   console.log('Starting saveRefreshToken process for member:', memberId);
   
   await this.refreshTokenRepository.manager.transaction(async transactionalEntityManager => {
     // 먼저 member가 존재하는지 확인 (수정된 부분)
     const member = await transactionalEntityManager.getRepository(Member).findOneBy({
       id: memberId
     });
     console.log('Found member:', {
       exists: !!member,
       id: member?.id,
       email: member?.email
     });

     if (!member) {
       throw new Error(`Member not found with id: ${memberId}`);
     }

     // 기존 토큰 revoke
     const updateResult = await transactionalEntityManager.update(RefreshToken, 
       { memberId, revoked: false },
       { 
         revoked: true,
         revokedAt: new Date(),
         revokedReason: 'NEW_TOKEN_ISSUED'
       }
     );
     console.log('Revoked existing tokens:', updateResult.affected);

     // 새 토큰 저장
     const tokenEntity = new RefreshToken();
     tokenEntity.token = token;
     tokenEntity.memberId = memberId;
     tokenEntity.member = member;
     tokenEntity.tokenVersion = member.tokenVersion;
     tokenEntity.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

     const saved = await transactionalEntityManager.save(RefreshToken, tokenEntity);
     console.log('New token saved with ID:', saved.id);

     // 저장 확인 (직접 조회)
     const verify = await transactionalEntityManager.getRepository(RefreshToken).findOne({
       where: { id: saved.id },
       relations: {
         member: true
       }
     });

     // 추가 디버깅 로그
     console.log('Raw saved token:', saved);
     console.log('Raw verified token:', verify);
     
     console.log('Token verification:', {
       exists: !!verify,
       id: verify?.id,
       memberId: verify?.memberId,
       memberExists: !!verify?.member,
       memberInfo: verify?.member ? {
         id: verify.member.id,
         email: verify.member.email
       } : null
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
     { memberId, revoked: false },
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