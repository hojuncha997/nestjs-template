// src/posts/dto/guestbook-response.dto.ts

import { GuestbookStatus } from '@common/enums/guestbook-status.enum';

export class GuestbookResponseDto {
    // id: number;
    uuid: string;
    title: string;
    content: Record<string, any>;
    author: string;
    isSecret: boolean;
    category: string;
    slug: string;
    tags: string[];
    thumbnail?: string;
    status: GuestbookStatus;
    isFeatured: boolean;
    
    // 메타 데이터
    createdAt: Date;
    updatedAt: Date;
    viewCount: number;
    likeCount: number;
    commentCount: number;
}