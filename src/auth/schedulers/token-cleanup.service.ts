import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { RefreshToken } from '@auth/entities/refresh-token.entity';

@Injectable()
export class TokenCleanupService {
  constructor(
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
  ) {}

  @Cron('0 0 * * *') // 매일 자정에 실행
  async cleanupOldTokens() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    await this.refreshTokenRepository.createQueryBuilder()
      .delete()
      .where('(revoked = :revoked AND revokedAt < :revokedAt)', {
        revoked: true,
        revokedAt: thirtyDaysAgo
      })
      .orWhere('expiresAt < :expiresAt', {
        expiresAt: new Date()
      })
      .execute();
  }
} 