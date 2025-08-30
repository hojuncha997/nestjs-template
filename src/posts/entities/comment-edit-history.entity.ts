import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { PostComment } from './post-comment.entity';
import { Member } from '@members/entities/member.entity';

@Entity('comment_edit_history')
export class CommentEditHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => PostComment)
  @JoinColumn({ name: 'comment_id' })
  comment: PostComment;

  @Column({ name: 'comment_id' })
  commentId: number;

  @Column({ type: 'text' })
  previousContent: string;

  @CreateDateColumn({ name: 'edited_at' })
  editedAt: Date;

  @ManyToOne(() => Member)
  @JoinColumn({ name: 'edited_by' })
  editedBy: Member;

  @Column({ name: 'edited_by' })
  editedById: number;
}