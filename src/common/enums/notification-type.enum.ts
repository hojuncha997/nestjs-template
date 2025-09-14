export enum NotificationType {
  COMMENT = 'comment',           // 댓글 달림
  REPLY = 'reply',              // 내 댓글에 답글
  MENTION = 'mention',          // 멘션됨 (@username)
  LIKE = 'like',               // 좋아요
  POST_PUBLISHED = 'post_published' // 새 글 발행
}