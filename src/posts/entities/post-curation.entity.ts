// src/posts/entities/post-curation.entity.ts
import { Entity, PrimaryColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { Post } from './post.entity';
import { CurationType } from '@common/enums/curation-type.enum';

@Entity('post_curation')
export class PostCuration {
    @PrimaryColumn({ name: 'post_id' })
    postId: number;

    @OneToOne(() => Post, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'post_id' })
    post: Post;

    @Column({ default: false })
    isCurated: boolean;

    @Column({ type: 'timestamp', nullable: true })
    curatedAt: Date;

    @Column({ nullable: true })
    curatedBy: string;

    @Column({ type: 'int', default: 0 })
    curationOrder: number;

    @Column('simple-array', { default: [] })
    curationType: CurationType[];

    @Column({ nullable: true })
    curationNote: string;

    @Column({ type: 'timestamp', nullable: true })
    curationStartDate: Date;

    @Column({ type: 'timestamp', nullable: true })
    curationEndDate: Date;
}