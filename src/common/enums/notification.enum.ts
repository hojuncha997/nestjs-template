// notification.enum.ts
// 경로: src/common/enums/notification.enum.ts

export enum Notification {
  EMAIL = 'email',
  PUSH = 'push',  // 사용중이 아닐 때도 알려주는 알림
  SMS = 'sms',
  MARKETING = 'marketing',
  IN_APP = 'inApp'  // 사용중에만 보이는 알림(예를 들어 종 모양 아이콘)
} 