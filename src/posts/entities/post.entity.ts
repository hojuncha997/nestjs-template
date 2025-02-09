// src/posts/eitities/post.entity.ts

import { PostStatus } from '@common/enums/post-status.enum';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, BeforeInsert, Index, ManyToOne, JoinColumn } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Member } from '@members/entities/member.entity';
import { init } from '@paralleldrive/cuid2';

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
}
