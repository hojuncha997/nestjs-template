// src/posts/dto/post-response.dto.ts

import { PostStatus } from '@common/enums/post-status.enum';
import { Expose } from 'class-transformer';

export class PostResponseDto {
    @Expose()
    public_id: string;
    
    @Expose()
    title: string;

    @Expose()
    content: Record<string, any>;

    @Expose()
    author_display_name: string;

    @Expose()
    current_author_name: string;

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

    @Expose()
    isSecret: boolean;
}