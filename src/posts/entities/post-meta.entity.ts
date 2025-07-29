// src/posts/entities/post-meta.entity.ts
import { Entity, PrimaryColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { Post } from './post.entity';

@Entity('post_meta')
export class PostMeta {
    @PrimaryColumn({ name: 'post_id' })
    postId: number;

    @OneToOne(() => Post, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'post_id' })
    post: Post;

    @Column({ length: 50, nullable: true })
    description: string;

    @Column({ length: 300, nullable: true })
    excerpt: string;

    @Column({ type: 'int', nullable: true })
    readingTime: number;

    @Column({ nullable: true })
    coverImageAlt: string;

    @Column({ length: 160, nullable: true })
    metaDescription: string;
}