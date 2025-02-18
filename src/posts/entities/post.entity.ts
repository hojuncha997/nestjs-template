// src/posts/eitities/post.entity.ts

import { PostStatus } from '@common/enums/post-status.enum';
import { Entity, PrimaryGeneratedColumn, OneToOne, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, BeforeInsert, Index, ManyToOne, JoinColumn } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Member } from '@members/entities/member.entity';
import { init } from '@paralleldrive/cuid2';
import { CurationType } from '@common/enums/curation-type.enum';
import { PostStats } from './post-stats.entity';
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

    @Column({type: 'timestamp', nullable: true})
    publishedAt: Date;


    @DeleteDateColumn()
    deletedAt: Date;

    @Column({ type: 'timestamp', nullable: true })
    scheduledAt: Date;


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

    /*
    stats역시 가상의 필드이다. 실제 DB의 post 테이블에는 이 필드가 컬럼으로 존재하지 않는다.
    TypeORM이 Post 엔티티와 PopStats(post_stats) 엔티티 사이의 관계를 관리하기 위해 사용한다.
    stats => stats.post는 PostStats 쪽의 post 필드와 양방향 매핑을 이루고 있음

    코드에서는 아래와 같이 사용할 수 있다.
    --------------------------------
    // Post 엔티티에서 stats 접근
    const viewCount = post.stats?.viewCount;

    // PostStats 엔티티에서 post 접근
    const postTitle = postStats.post.title;
    
    ***TypeORM이 relations 옵션을 통해 데이터를 조회했을 때만 가능
    --------------------------------
    */
    @OneToOne(() => PostStats, stats => stats.post)
    stats: PostStats;


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


    @Column({ nullable: true })
    coverImageAlt: string;

    @Column({ length: 160, nullable: true })
    metaDescription: string;

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


    /*

    //post-stats 테이블과 연결되는 컬럼으로 별도 분리

    @Column({default: 0})
    viewCount: number;

    @Column({default: 0})
    likeCount: number;

    @Column({default: 0})
    commentCount: number;

    @Column({ type: 'int', default: 0 })
    viewTimeInSeconds: number;

    */


}
