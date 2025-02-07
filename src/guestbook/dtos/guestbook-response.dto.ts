// src/posts/dto/guestbook-response.dto.ts

import { GuestbookStatus } from '@common/enums/guestbook-status.enum';
import { Expose } from 'class-transformer';
export class GuestbookResponseDto {
    // id: number;
    @Expose()
    public_id: string;
    
    // author: string;

    @Expose()
    title: string;

    @Expose()
    content: Record<string, any>;

    @Expose()
    author_display_name: string;  // 작성자 표시명만 노출

    @Expose()
    current_author_name: string;  // 현재 작성자 표시명

    @Expose()
    isSecret: boolean;

    @Expose()
    category: string;

    @Expose()
    slug: string;

    @Expose()
    tags: string[];

    @Expose()
    thumbnail?: string;

    @Expose()
    status: GuestbookStatus;

    @Expose()
    isFeatured: boolean;
    
    // 메타 데이터
    @Expose()
    createdAt: Date;
    @Expose()
    updatedAt: Date;
    @Expose()
    viewCount: number;
    @Expose()
    likeCount: number;
    @Expose()
    commentCount: number;

    
}