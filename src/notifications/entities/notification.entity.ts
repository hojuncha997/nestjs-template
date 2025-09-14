import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index
} from 'typeorm';
import { Member } from '@members/entities/member.entity';
import { NotificationType } from '@common/enums';

@Entity('notifications')
@Index('idx_notifications_recipient_id', ['recipient'])
@Index('idx_notifications_is_read', ['isRead'])
@Index('idx_notifications_created_at', ['createdAt'])
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Member, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'recipient_id' })
  recipient: Member;

  @Column({ name: 'recipient_id' })
  recipientId: number;

  @Column({ type: 'enum', enum: NotificationType })
  type: NotificationType;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ name: 'reference_type', length: 50 })
  referenceType: string; // 'POST', 'GUESTBOOK', 'PROJECT', 'COMMENT'

  @Column({ name: 'reference_id' })
  referenceId: number;

  @Column({ name: 'reference_url', length: 500, nullable: true })
  referenceUrl?: string;

  @Column({ name: 'actor_id', nullable: true })
  actorId?: number; // 알림을 발생시킨 사용자 ID

  @ManyToOne(() => Member, { nullable: true })
  @JoinColumn({ name: 'actor_id' })
  actor?: Member;

  @Column({ name: 'is_read', default: false })
  isRead: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}