// src/posts/eitities/post.entity.ts

import { PostStatus } from '@common/enums/post-status.enum';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, BeforeInsert, Index } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

@Entity()
@Index(['uuid'], { unique: true })  // 게시물 식별을 위한 기본 인덱스
@Index(['status'])    // 발행된 게시물 목록 조회용
export class Post {
    @PrimaryGeneratedColumn()
    id: number;

    // @Column('uuid', {unique: true})
    // // uuid: string = uuidv4();
    // uuid: string;
    // @BeforeInsert() //uuid를 base64로 변환하여 저장
    // generateUuid() {
    //     // 1. 일반 UUID 생성
    //     const fullUuid = uuidv4(); // 예: '123e4567-e89b-12d3-a456-426614174000'
    //     // 2. 하이픈 제거
    //     const plainUuid = fullUuid.replace(/-/g, ''); // '123e4567e89b12d3a456426614174000'
    //     // 3. 16진수 문자열을 바이너리 버퍼로 변환
    //     const buffer = Buffer.from(plainUuid, 'hex');
    //     // 4. 버퍼를 base64로 인코딩
    //     let base64Uuid = buffer.toString('base64'); // 'Ej5FZ+ibEtOkVkJmEBdAAA=='
    //     // 5. URL 안전하게 만들기
    //     this.uuid = base64Uuid
    //         .replace(/\+/g, '-') // '+' 문자를 '-'로 대체
    //         .replace(/\//g, '_') // '/' 문자를 '_'로 대체
    //         .replace(/=/g, '');  // 패딩 문자 '=' 제거
    // }
    // 위처럼 하면 uuid칼럼에 uuid가 아닌 형식이 들어가려고 하여 오류 발생. 그렇지 않으려면 uuid를 그냥 사용하거나 아니면 칼럼을 text타입으로 설정하면 됨
    // 그냥 uuid를 사용하려고 함

    @Column('uuid', {unique: true})
    uuid: string = uuidv4();
    @Column()
    slug: string;

    @BeforeInsert()
    generateSlug() {
        if (!this.slug) {
            // this.slug = this.title
            //     .toLowerCase()
            //     .replace(/[^a-z0-9]+/g, '-')
            //     .replace(/^-+|-+$/g, '');
            this.slug = '';
        }
    }

    @Column({default: 'uncategorized'})
    category: string;

    @Column()
    title: string;

    @Column()
    // @ManyToOne(() => Member, (member) => member.posts)
    author: string;
    // author: Member;
   
    // @Column('simple-json')
    // content: string;
    // Tiptap 에디터 사용으로 인한 json 타입 사용
    @Column('json')
    content: Record<string, any>;

    // @Column()
    // createdAt: Date;

    // @Column()
    // updatedAt: Date;

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
