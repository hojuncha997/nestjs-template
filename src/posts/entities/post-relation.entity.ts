// src/posts/entities/post-relation.entity.ts
// 게시글 관계 엔티티
// 게시글과 관련된 다른 게시글을 저장하는 엔티티
// 예를 들어, 게시글 A와 게시글 B가 관련되어 있으면, 게시글 A는 게시글 B를 참조하고, 게시글 B는 게시글 A를 참조
// 이 엔티티는 게시글 간의 관계를 저장하는 데 사용(현재는 수동 설정으로 넣어준 데이터만 테이블에 저장됨)

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Post } from './post.entity';

@Entity('post_relation')
export class PostRelation {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Post, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'source_post_id' })
    sourcePost: Post;

    @ManyToOne(() => Post, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'related_post_id' })
    relatedPost: Post;

    @Column({ default: false })
    isManual: boolean;  // 수동으로 설정된 관계인지 여부

    @CreateDateColumn()
    createdAt: Date;
} 