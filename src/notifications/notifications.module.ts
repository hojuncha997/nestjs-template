import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { NotificationService } from './services/notification.service';
import { NotificationController } from './controllers/notification.controller';
import { MembersModule } from '../members/members.module';

/**
 * 알림 모듈
 * 
 * 폴링 기반 알림 시스템을 제공
 * 
 * 주요 구성요소:
 * - Notification 엔터티: 알림 데이터 저장
 * - NotificationService: 알림 비즈니스 로직
 * - NotificationController: REST API 엔드포인트
 * 
 * 다른 모듈에서 NotificationService를 사용하려면:
 * 1. NotificationsModule을 해당 모듈의 imports에 추가
 * 2. NotificationService를 주입받아 사용
 * 
 * @example
 * // posts.module.ts
 * imports: [NotificationsModule]
 * 
 * // post-comment.service.ts
 * constructor(
 *   private notificationService: NotificationService
 * ) {}
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Notification]),
    MembersModule, // JwtAuthGuard가 MembersService를 필요로 하므로 추가
  ],
  controllers: [NotificationController],
  providers: [NotificationService],
  exports: [NotificationService], // 다른 모듈에서 사용할 수 있도록 export
})
export class NotificationsModule {}