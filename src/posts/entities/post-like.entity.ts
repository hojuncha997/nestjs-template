import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
  Unique
} from 'typeorm';
import { Post } from './post.entity';
import { Member } from '@members/entities/member.entity';

@Entity('post_likes')
@Unique(['post', 'member']) // 한 사용자가 한 포스트에 한 번만 좋아요 가능
@Index('idx_post_likes_post_id', ['post'])
@Index('idx_post_likes_member_id', ['member'])
export class PostLike {
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

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}