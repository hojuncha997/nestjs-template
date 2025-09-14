import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';
import { GetMember } from '@decorators/auth/get-member.decorator';
import { Member } from '@members/entities/member.entity';
import { NotificationService } from '../services/notification.service';

/**
 * 알림 컨트롤러
 * 
 * 폴링 방식의 알림 시스템을 위한 REST API 엔드포인트
 * 프론트엔드에서 15초마다 /notifications/unread를 호출하여 새 알림 확인
 */
@ApiTags('notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard) // 모든 알림 API는 인증 필요
@ApiBearerAuth()
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  /**
   * 읽지 않은 알림 조회
   * 
   * 프론트엔드 폴링의 핵심 엔드포인트
   * 15초마다 호출되어 새로운 알림 확인
   * 
   * @endpoint GET /notifications/unread
   * @returns 읽지 않은 알림 목록과 개수
   * 
   * @example
   * Response:
   * {
   *   "count": 3,
   *   "notifications": [
   *     {
   *       "id": 1,
   *       "type": "COMMENT",
   *       "title": "새로운 댓글",
   *       "content": "Alice님이 댓글을 남겼습니다",
   *       "referenceUrl": "/posts/123",
   *       "createdAt": "2024-01-15T10:30:00Z"
   *     }
   *   ]
   * }
   */
  @Get('unread')
  @ApiOperation({ 
    summary: '읽지 않은 알림 조회',
    description: '폴링용 엔드포인트. 읽지 않은 알림 목록과 개수를 반환합니다.'
  })
  @ApiResponse({ 
    status: 200, 
    description: '읽지 않은 알림 목록' 
  })
  async getUnreadNotifications(@GetMember() member: Member) {
    return await this.notificationService.getUnreadNotifications(member.id);
  }

  /**
   * 읽지 않은 알림 개수만 조회
   * 
   * 단순히 뱃지 숫자만 업데이트할 때 사용
   * 더 가벼운 쿼리로 서버 부하 감소
   * 
   * @endpoint GET /notifications/unread/count
   * @returns 읽지 않은 알림 개수
   */
  @Get('unread/count')
  @ApiOperation({ 
    summary: '읽지 않은 알림 개수 조회',
    description: '헤더 뱃지 표시용. 개수만 반환합니다.'
  })
  @ApiResponse({ 
    status: 200, 
    description: '읽지 않은 알림 개수',
    schema: {
      example: { count: 5 }
    }
  })
  async getUnreadCount(@GetMember() member: Member) {
    const count = await this.notificationService.getUnreadCount(member.id);
    return { count };
  }

  /**
   * 전체 알림 목록 조회 (페이지네이션)
   * 
   * 알림 목록 페이지/모달에서 사용
   * 읽은 알림과 읽지 않은 알림 모두 포함
   * 
   * @endpoint GET /notifications
   * @param page - 페이지 번호
   * @param limit - 페이지당 항목 수
   * @returns 페이지네이션된 알림 목록
   */
  @Get()
  @ApiOperation({ 
    summary: '전체 알림 목록 조회',
    description: '페이지네이션을 지원하는 전체 알림 목록을 조회합니다.'
  })
  @ApiResponse({ 
    status: 200, 
    description: '알림 목록' 
  })
  async getAllNotifications(
    @GetMember() member: Member,
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 20,
  ) {
    return await this.notificationService.getAllNotifications(
      member.id,
      page,
      limit
    );
  }

  /**
   * 특정 알림을 읽음 처리
   * 
   * 사용자가 알림을 클릭했을 때 호출
   * 읽음 처리 후 해당 페이지로 이동
   * 
   * @endpoint PATCH /notifications/:id/read
   * @param id - 알림 ID
   * @returns 성공 여부
   */
  @Patch(':id/read')
  @ApiOperation({ 
    summary: '알림 읽음 처리',
    description: '특정 알림을 읽음 상태로 변경합니다.'
  })
  @ApiResponse({ 
    status: 200, 
    description: '읽음 처리 완료',
    schema: {
      example: { success: true }
    }
  })
  async markAsRead(
    @Param('id', ParseIntPipe) id: number,
    @GetMember() member: Member,
  ) {
    await this.notificationService.markAsRead(id, member.id);
    return { success: true };
  }

  /**
   * 모든 알림을 읽음 처리
   * 
   * "모두 읽음" 버튼 클릭 시 사용
   * 
   * @endpoint PATCH /notifications/read-all
   * @returns 성공 여부
   */
  @Patch('read-all')
  @ApiOperation({ 
    summary: '모든 알림 읽음 처리',
    description: '사용자의 모든 읽지 않은 알림을 읽음 상태로 변경합니다.'
  })
  @ApiResponse({ 
    status: 200, 
    description: '모두 읽음 처리 완료',
    schema: {
      example: { success: true }
    }
  })
  async markAllAsRead(@GetMember() member: Member) {
    await this.notificationService.markAllAsRead(member.id);
    return { success: true };
  }

  /**
   * 특정 알림 삭제
   * 
   * 알림 목록에서 개별 삭제 시 사용
   * 
   * @endpoint DELETE /notifications/:id
   * @param id - 알림 ID
   * @returns 성공 여부
   */
  @Delete(':id')
  @ApiOperation({ 
    summary: '알림 삭제',
    description: '특정 알림을 삭제합니다.'
  })
  @ApiResponse({ 
    status: 200, 
    description: '삭제 완료',
    schema: {
      example: { success: true }
    }
  })
  async deleteNotification(
    @Param('id', ParseIntPipe) id: number,
    @GetMember() member: Member,
  ) {
    await this.notificationService.deleteNotification(id, member.id);
    return { success: true };
  }
}