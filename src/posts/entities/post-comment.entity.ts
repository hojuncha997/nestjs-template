import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index
} from 'typeorm';
import { Post } from './post.entity';
import { Member } from '@members/entities/member.entity';

@Entity('post_comments')
@Index('idx_post_comments_post_id', ['post'])
@Index('idx_post_comments_member_id', ['member'])
@Index('idx_post_comments_parent_id', ['parentComment'])
export class PostComment {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Post, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post: Post;

  @Column({ name: 'post_id' })
  postId: number;

  @ManyToOne(() => Member, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'member_id' })
  member: Member;

  @Column({ name: 'member_id' })
  memberId: number;

  @Column({ type: 'text' })
  content: string;

  @ManyToOne(() => PostComment, comment => comment.replies, { nullable: true })
  @JoinColumn({ name: 'parent_comment_id' })
  parentComment: PostComment;

  @Column({ name: 'parent_comment_id', nullable: true })
  parentCommentId: number;

  @OneToMany(() => PostComment, comment => comment.parentComment)
  replies: PostComment[];

  @Column({ default: 0 })
  likeCount: number;

  @Column({ default: false })
  isEdited: boolean;

  @Column({ name: 'is_deleted', default: false })
  isDeleted: boolean;

  /**
   * 비밀 댓글 여부
   * 
   * true인 경우 다음 사용자만 내용을 볼 수 있음:
   * 1. 댓글 작성자 본인
   * 2. 포스트 작성자
   * 3. 관리자 (ADMIN 권한)
   * 4. 부모 댓글 작성자 (답글인 경우에만 해당)
   * 
   * 비밀 댓글의 답글도 독립적으로 비밀 설정 가능
   */
  @Column({ name: 'is_secret', default: false })
  isSecret: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;
}