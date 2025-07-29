// auth.repository.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Member } from '@members/entities/member.entity';
import { RefreshToken } from '@auth/entities/refresh-token.entity';
import { TokenRevokeReason } from '@common/enums/token-revoke-reason.enum';

/**
 * 인증 관련 데이터 접근 레포지토리
 */
@Injectable()
export class AuthRepository {
  private readonly logger = new Logger(AuthRepository.name);
  
  constructor(
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
    @InjectRepository(Member)
    private memberRepository: Repository<Member>,
  ) {}

  /**
   * UUID로 회원 조회
   * @param uuid 회원 UUID
   * @return 조회된 회원 정보
   */
  async findByUuid(uuid: string): Promise<Member | null> {
    return this.memberRepository.findOne({ where: { uuid } });
  }

  /**
   * 리프레시 토큰으로 토큰 정보 조회
   * 유효한 토큰만 조회하며, 회원 정보도 함께 조회
   * @param token 리프레시 토큰
   * @return 토큰 정보와 연관된 회원 정보
   */
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
        'member.nickname',
        'member.role',
        'member.preferences'
      ])
      .getOne();
  }

  /**
   * 리프레시 토큰 저장
   * 기존 토큰은 무효화하고 새 토큰 발급
   * @param memberId 회원 ID
   * @param token 리프레시 토큰
   * @param keepLoggedIn 로그인 유지 여부
   */
  async saveRefreshToken(memberId: number, token: string, keepLoggedIn: boolean): Promise<void> {
    this.logger.log('Starting saveRefreshToken process for member:', memberId);
    
    await this.refreshTokenRepository.manager.transaction(async transactionalEntityManager => {
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

      // 기존 토큰 무효화
      await transactionalEntityManager
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
      tokenEntity.member = member;
      tokenEntity.tokenVersion = member.tokenVersion;
      tokenEntity.keepLoggedIn = keepLoggedIn;
      tokenEntity.expiresAt = new Date(Date.now() + (keepLoggedIn ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000));

      await transactionalEntityManager.save(RefreshToken, tokenEntity);
    });
  }

  /**
   * 리프레시 토큰 무효화
   * @param token 무효화할 토큰
   * @return 무효화 성공 여부
   */
  async revokeRefreshToken(token: string): Promise<boolean> {
    const result = await this.refreshTokenRepository.update(
      { token, revoked: false },
      { 
        revoked: true,
        revokedAt: new Date(),
        revokedReason: TokenRevokeReason.USER_LOGOUT
      }
    );
    
    return result.affected > 0;
  }

  /**
   * 회원의 모든 리프레시 토큰 무효화
   * @param memberId 회원 ID
   */
  async revokeAllRefreshTokens(memberId: number): Promise<void> {
    await this.refreshTokenRepository.update(
      { member: { id: memberId }, revoked: false },
      { 
        revoked: true,
        revokedAt: new Date(),
      }
    );
  }

  /**
   * 이메일로 회원 조회
   * @param email 회원 이메일
   * @return 조회된 회원 정보
   */
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