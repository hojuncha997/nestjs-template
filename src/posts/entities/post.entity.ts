// src/posts/eitities/post.entity.ts

import { PostStatus } from '@common/enums/post-status.enum';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, BeforeInsert, Index, ManyToOne, JoinColumn } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Member } from '@members/entities/member.entity';
import { init } from '@paralleldrive/cuid2';
import { CurationType } from '@common/enums/curation-type.enum';

const createId = init({ length: 10 });

@Entity('post')
@Index(['public_id'], { unique: true })
@Index(['status'])
export class Post {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true, length: 10, nullable: true })
    public_id: string;

    @Column({ length: 100, nullable: true })
    slug: string;

    @BeforeInsert()
    generatePublicIdAndSlug() {
        this.public_id = createId();
        
        if (!this.slug && this.title) {
            this.slug = this.title
                .trim()
                .replace(/\s+/g, '-')
                .replace(/[^\w\-가-힣]/g, '')
                .toLowerCase()
                .replace(/-+/g, '-')
                .replace(/^-+|-+$/g, '')
                .substring(0, 100);
        }
    }

    @ManyToOne(() => Member, { nullable: false })
    @JoinColumn({ name: 'author_id' })
    author: Member;

    @Column({ name: 'author_display_name' })
    author_display_name: string;

    @Column({ name: 'current_author_name' })
    current_author_name: string;

    @Column({default: 'uncategorized'})
    category: string;

    @Column()
    title: string;

    @Column('json')
    content: Record<string, any>;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @Column({
        type: 'enum',
        enum: PostStatus,
        default: PostStatus.PUBLISHED
    })
    status: PostStatus;
    
    @Column({nullable: true})
    thumbnail: string;

    @Column('simple-json', { default: '[]' })
    tags: string[];

    @Column({default: 0})
    viewCount: number;

    @Column({default: 0})
    likeCount: number;

    @Column({default: 0})
    commentCount: number;

    @Column({default: false})
    isFeatured: boolean;

    @Column({default: false})
    isSecret: boolean;

    @Column({ length: 50, nullable: true })
    description: string;

    @Column({ length: 300, nullable: true })
    excerpt: string;

    @Column({ type: 'int', nullable: true })
    readingTime: number;

    @Column({ type: 'timestamp', nullable: true })
    publishedAt: Date;

    @Column({ nullable: true })
    coverImageAlt: string;

    @Column({ length: 160, nullable: true })
    metaDescription: string;

    @Column({ type: 'int', default: 0 })
    viewTimeInSeconds: number;

    @Column('json', {
        default: {
            isCurated: false,
            curatedAt: null,
            curatedBy: null,
            curationOrder: 0,
            curationType: [],
        }
    })
    curation: {
        isCurated: boolean;
        curatedAt: string | null;
        curatedBy: string | null;
        curationOrder: number;
        curationType: CurationType[];
        curationNote?: string;
        curationStartDate?: string;
        curationEndDate?: string;
    };

}
