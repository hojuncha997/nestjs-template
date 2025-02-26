// src/app.module.ts
// 애플리케이션 모듈

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { MembersModule } from './members/members.module';
import { CategoryModule } from './category/category.module';
// Nestjs의 ConfigModule을 사용하여 환경 변수를 로드하는 방법. 즉 런타임 설정을 위한 것
import databaseConfig from './config/database.config';
// import dataSource from 'dataSource'; 이건 typeorm 마이그레이션만을 위해 사용

import { getTypeOrmConfig } from './config/typeorm.config';
import { PostsModule } from './posts/posts.module';
import { GuestbookModule } from './guestbook/guestbook.module';

@Module({
  imports: [
    // 환경 변수 설정
    ConfigModule.forRoot({
      envFilePath: ['.env.local', '.env'],
      isGlobal: true,
      load: [databaseConfig],
    }),
    // TypeORM 설정
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],  // ConfigService를 의존성 주입
      useFactory: getTypeOrmConfig, // TypeORM 설정 함수
    }),
    // 멤버 모듈
    MembersModule,
    // 인증 모듈
    AuthModule,
    // 게시글 모듈
    PostsModule,
    // 방명록 모듈
    GuestbookModule,
    // 카테고리 모듈
    CategoryModule,
  ],
})
export class AppModule {}
