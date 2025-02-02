// src/posts/dto/post-response.dto.ts

import { PostStatus } from '@common/enums/post-status.enum';

export class PostResponseDto {
    // id: number;
    uuid: string;
    title: string;
    content: Record<string, any>;
    author: string;
    category: string;
    slug: string;
    tags: string[];
    thumbnail?: string;
    status: PostStatus;
    isFeatured: boolean;
    
    // 메타 데이터
    createdAt: Date;
    updatedAt: Date;
    viewCount: number;
    likeCount: number;
    commentCount: number;
}