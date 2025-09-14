import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../entities/notification.entity';
import { NotificationType } from '@common/enums';
import { Member } from '@members/entities/member.entity';

/**
 * 알림 생성을 위한 DTO
 * 
 * @property recipientId - 알림 받을 사용자 ID
 * @property type - 알림 타입 (COMMENT, REPLY, MENTION, LIKE 등)
 * @property title - 알림 제목 (예: "새로운 댓글")
 * @property content - 알림 내용 (예: "Alice님이 댓글을 남겼습니다")
 * @property referenceType - 참조 엔터티 타입 (POST, GUESTBOOK, PROJECT, COMMENT)
 * @property referenceId - 참조 엔터티 ID
 * @property referenceUrl - 클릭 시 이동할 URL (선택사항)
 * @property actorId - 알림을 발생시킨 사용자 ID (선택사항)
 */
export interface CreateNotificationDto {
  recipientId: number;
  type: NotificationType;
  title: string;
  content: string;
  referenceType: string;
  referenceId: number;
  referenceUrl?: string;
  actorId?: number;
}

/**
 * 알림 관리 서비스
 * 
 * 주요 기능:
 * - 알림 생성
 * - 읽지 않은 알림 조회
 * - 알림 읽음 처리
 * - 알림 삭제
 * 
 * 폴링 방식으로 프론트엔드에서 주기적으로 호출됨
 */
@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {}

  /**
   * 새로운 알림 생성
   * 
   * 댓글, 멘션, 좋아요 등의 이벤트 발생 시 호출됨
   * 예: PostCommentService.createComment()에서 호출
   * 
   * @param dto - 알림 생성 정보
   * @returns 생성된 알림 엔터티
   */
  async createNotification(dto: CreateNotificationDto): Promise<Notification> {
    // 알림 엔터티 생성
    const notification = this.notificationRepository.create(dto);
    
    // DB에 저장
    return await this.notificationRepository.save(notification);
  }

  /**
   * 읽지 않은 알림 목록 조회
   * 
   * 프론트엔드에서 15초마다 폴링하여 호출
   * 헤더의 알림 뱃지 표시용
   * 
   * @param userId - 조회할 사용자 ID
   * @returns 읽지 않은 알림 목록과 개수
   */
  async getUnreadNotifications(userId: number) {
    // 읽지 않은 알림만 최신순으로 조회
    const notifications = await this.notificationRepository.find({
      where: {
        recipientId: userId,
        isRead: false,
      },
      relations: ['actor'], // 알림을 발생시킨 사용자 정보 포함
      order: {
        createdAt: 'DESC', // 최신 알림이 먼저
      },
      take: 50, // 성능을 위해 최대 50개까지만
    });

    return {
      count: notifications.length, // 뱃지에 표시할 숫자
      notifications: notifications.map(this.formatNotification), // 포맷팅된 알림 목록
    };
  }

  /**
   * 전체 알림 목록 조회 (페이지네이션)
   * 
   * 알림 목록 모달/페이지에서 사용
   * 읽은 알림과 읽지 않은 알림 모두 포함
   * 
   * @param userId - 조회할 사용자 ID
   * @param page - 페이지 번호 (기본값: 1)
   * @param limit - 페이지당 항목 수 (기본값: 20)
   * @returns 페이지네이션된 알림 목록
   */
  async getAllNotifications(userId: number, page: number = 1, limit: number = 20) {
    // findAndCount로 전체 개수와 데이터를 동시에 조회
    const [notifications, total] = await this.notificationRepository.findAndCount({
      where: {
        recipientId: userId,
      },
      relations: ['actor'],
      order: {
        createdAt: 'DESC',
      },
      take: limit,
      skip: (page - 1) * limit, // 페이지네이션 오프셋
    });

    return {
      notifications: notifications.map(this.formatNotification),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * 특정 알림을 읽음 처리
   * 
   * 사용자가 알림을 클릭했을 때 호출
   * 
   * @param notificationId - 읽음 처리할 알림 ID
   * @param userId - 사용자 ID (권한 체크용)
   * @throws NotFoundException - 알림을 찾을 수 없는 경우
   */
  async markAsRead(notificationId: number, userId: number): Promise<void> {
    // 권한 체크: 본인의 알림인지 확인
    const notification = await this.notificationRepository.findOne({
      where: {
        id: notificationId,
        recipientId: userId,
      },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    // 읽음 처리
    notification.isRead = true;
    await this.notificationRepository.save(notification);
  }

  /**
   * 모든 알림을 읽음 처리
   * 
   * "모두 읽음" 버튼 클릭 시 사용
   * 
   * @param userId - 사용자 ID
   */
  async markAllAsRead(userId: number): Promise<void> {
    // 해당 사용자의 모든 읽지 않은 알림을 한번에 업데이트
    await this.notificationRepository.update(
      {
        recipientId: userId,
        isRead: false,
      },
      {
        isRead: true,
      }
    );
  }

  /**
   * 특정 알림 삭제
   * 
   * @param notificationId - 삭제할 알림 ID
   * @param userId - 사용자 ID (권한 체크용)
   * @throws NotFoundException - 알림을 찾을 수 없는 경우
   */
  async deleteNotification(notificationId: number, userId: number): Promise<void> {
    // 권한 체크를 포함한 삭제
    const result = await this.notificationRepository.delete({
      id: notificationId,
      recipientId: userId,
    });

    if (result.affected === 0) {
      throw new NotFoundException('Notification not found');
    }
  }

  /**
   * 읽지 않은 알림 개수만 조회
   * 
   * 단순히 뱃지 숫자만 필요할 때 사용 (가벼운 쿼리)
   * 
   * @param userId - 사용자 ID
   * @returns 읽지 않은 알림 개수
   */
  async getUnreadCount(userId: number): Promise<number> {
    return await this.notificationRepository.count({
      where: {
        recipientId: userId,
        isRead: false,
      },
    });
  }

  /**
   * 알림 데이터 포맷팅
   * 
   * 민감한 정보를 제외하고 필요한 정보만 클라이언트에 전송
   * 
   * @param notification - 알림 엔터티
   * @returns 포맷팅된 알림 객체
   */
  private formatNotification(notification: Notification) {
    return {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      content: notification.content,
      referenceType: notification.referenceType,
      referenceId: notification.referenceId,
      referenceUrl: notification.referenceUrl,
      isRead: notification.isRead,
      createdAt: notification.createdAt,
      // 액터 정보는 닉네임과 프로필 이미지만 포함
      actor: notification.actor ? {
        uuid: notification.actor.uuid,
        nickname: notification.actor.nickname,
        profileImage: notification.actor.profileImage,
      } : null,
    };
  }
}