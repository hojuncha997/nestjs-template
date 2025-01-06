// src/config/typeorm.config.ts
// TypeORM 설정 파일

/**
 * 
 * 데이터베이스 연결과 ORM 동작을 위한 세부 설정
 * database.config.ts의 기본 연결 정보를 확장하여 TypeORM에 필요한 추가 설정을 제공
 * 
 * 주요 설정:
 * - 엔티티 자동 감지 및 로드
 * - 스키마 동기화 (개발 환경에서만 활성화)
 * - 네이밍 전략 (스네이크 케이스)
 * - 환경별 로깅 설정
 * - SSL 보안 설정 (운영 환경)
 */

import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Member } from '../members/entities/member.entity';
import { RefreshToken } from '../auth/entities/refresh-token.entity';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

// TypeORM 관련 설정만 관리
export const getTypeOrmConfig = async (
    configService: ConfigService,
): Promise<TypeOrmModuleOptions> => {
    const dbConfig = configService.get('database');

    return {
        // 데이터베이스 설정
        ...dbConfig,
        // 엔티티 경로  
        entities: [
            __dirname + '/../**/*.entity{.ts,.js}',
            Member,
            RefreshToken,
        ],
        // 개발 환경에서만 동기화 활성화
        synchronize: process.env.NODE_ENV !== 'production',
        // 모든 테이블 이름을 스네이크 케이스로 변환
        namingStrategy: new SnakeNamingStrategy(),
        // 로깅 설정: 로컬과 개발 환경에서는 쿼리 로깅을 활성화. 운영 환경에서는 오류만 로깅
        logging: process.env.NODE_ENV === 'local' || process.env.NODE_ENV === 'development' 
            ? ['query', 'error'] 
            : ['error'],
        // TypeORM 특화 설정들
        // 엔티티 자동 로드
        autoLoadEntities: true,
        // 연결 유지
        keepConnectionAlive: true,
        // SSL 설정: 운영 환경에서는 SSL 활성화
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    };
}; 