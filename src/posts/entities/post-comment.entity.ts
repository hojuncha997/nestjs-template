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

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;
}