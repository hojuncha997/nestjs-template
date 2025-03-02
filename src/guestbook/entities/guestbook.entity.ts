// src/posts/eitities/post.entity.ts

import { GuestbookStatus } from '@common/enums/guestbook-status.enum';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, BeforeInsert, Index, ManyToOne, JoinColumn } from 'typeorm';
import { Member } from '@members/entities/member.entity';
import { Logger } from '@nestjs/common';
// import { customAlphabet } from 'nanoid/non-secure';  // customAlphabet 사용
// import { randomBytes } from 'crypto';  // crypto 모듈 import 방식 변경
// import { nanoid } from 'nanoid';  // crypto 대신 nanoid 사용
import { init } from '@paralleldrive/cuid2';

// URL-friendly 문자 생성기 (10자리)
// const generateId = () => {
//     const bytes = randomBytes(8); // 8바이트 = 64비트의 랜덤 데이터
//     return bytes.toString('base64url').slice(0, 10); // base64url은 URL-safe한 문자만 사용
// };
// const generateId = () => nanoid(10);  // nanoid로 10자리 ID 생성
// const generateId = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 10);
const createId = init({ length: 10 });

@Entity('guestbook')
@Index(['public_id'], { unique: true })  // uuid 인덱스를 public_id로 변경
@Index(['status'])    // 발행된 게시물 목록 조회용
export class Guestbook {
    private readonly logger = new Logger(Guestbook.name);
    @PrimaryGeneratedColumn()
    id: number;

    // public_id 컬럼 길이를 10으로 변경
    @Column({ unique: true, length: 10, nullable: true })   // 임시로 nullable: true 추가
    // @Column({ unique: true, length: 10, nullable: false })
    public_id: string;

    @Column({ length: 100, nullable: true })  // 길이 제한 추가
    slug: string;

    @BeforeInsert()
    generatePublicIdAndSlug() {
        this.public_id = createId();
        
        // slug가 비어있는 경우에만 백업으로 생성
        if (!this.slug && this.title) {
            this.logger.log('BeforeInsert - Creating backup slug from title:', this.title);
            this.slug = this.title
                .trim()
                .replace(/\s+/g, '-')
                .replace(/[^\w\-가-힣]/g, '')
                .toLowerCase()
                .replace(/-+/g, '-')
                .replace(/^-+|-+$/g, '')
                .substring(0, 100);
            this.logger.log('BeforeInsert - Generated backup slug:', this.slug);
        }
    }

    @Column({default: 'uncategorized'})
    category: string;

    @Column()
    title: string;

    @Column({default: false})
    isSecret: boolean;

    @ManyToOne(() => Member)
/*
    "많은 Guestbook이 하나의 Member에 속할 수 있다"는 관계를 정의
    즉, 한 명의 사용자(Member)가 여러 개의 게시물(Guestbook)을 작성할 수 있음
    () => Member는 순환 참조 문제를 피하기 위해 사용되는 지연 로딩 문법
    
    
    @JoinColumn({ name: 'author_id' })
    
    실제 데이터베이스에서 외래 키(foreign key) 컬럼의 이름을 author_id로 지정
    이 컬럼에는 Member 테이블의 id(PK) 값이 저장됨
    이 데코레이터가 없으면 기본값으로 memberId와 같은 이름이 사용됨
    
    
    author: Member
    
    TypeScript에서 사용할 타입을 정의
    이를 통해 guestbook.author.nickname과 같이 관계된 Member의 속성에 접근 가능
*/
    // @ManyToOne(() => Member)
    @ManyToOne(() => Member, { nullable: false })
    @JoinColumn({ name: 'author_id' })
    author: Member;

    // @Column({ name: 'author_id' })
    // author_id: number;

    @Column({ name: 'author_display_name' })
    author_display_name: string;

    @Column({ name: 'current_author_name' })
    current_author_name: string;

    @Column('json')
    content: Record<string, any>;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @Column({
        type: 'varchar',  // 데이터베이스에는 varchar로 저장
        enum: GuestbookStatus,  // 애플리케이션에서는 enum으로 처리
        default: GuestbookStatus.PUBLISHED
    })
    status: GuestbookStatus;
    
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
    
    // @Column()
    // isPublished: boolean;

    // @Column()
    // isDeleted: boolean;


    // @Column()
    // isDraft: boolean;

    // @Column()
    // isScheduled: boolean;

    // @Column()
    // isArchived: boolean;

    // @Column()
    // isTrashed: boolean;

    // @Column()
    // isPrivate: boolean;

    // @Column()
    // isPublic: boolean;

    // @Column()
    // isHidden: boolean;

    // @Column()
    // isLocked: boolean;
}
