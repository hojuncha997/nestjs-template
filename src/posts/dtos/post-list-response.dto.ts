import { PostStatus } from '@common/enums/post-status.enum';
import { CurationType } from '@common/enums/curation-type.enum';
import { Expose } from 'class-transformer';

export class PostListResponseDto {
    @Expose()
    public_id: string;
    
    @Expose()
    title: string;

    @Expose()
    excerpt: string;  // content 대신 excerpt만 포함

    @Expose()
    current_author_name: string;

    @Expose()
    categorySlug: string;
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

    // 새로운 필드들 (content 관련)
    description?: string;
    readingTime?: number;
    publishedAt?: Date;
    coverImageAlt?: string;
    metaDescription?: string;
    
    // 큐레이션 정보
    curation?: {
        isCurated: boolean;
        curationOrder: number;
    };

    isCurated: boolean;
    curationOrder?: number;  // 목록에서는 최소한의 정보만
} 