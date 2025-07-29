import { ProjectStatus } from '@common/enums/project-status.enum';
import { CurationType } from '@common/enums/curation-type.enum';
import { Expose } from 'class-transformer';

export class ProjectDetailResponseDto {
    @Expose()
    public_id: string;
    
    @Expose()
    title: string;

    @Expose()
    content: Record<string, any>;

    @Expose()
    current_author_name: string;

    @Expose()
    author_uuid: string;

    @Expose()
    categorySlug: string;
    slug: string;
    tags: string[];
    thumbnail?: string;
    status: ProjectStatus;
    isFeatured: boolean;
    
    // 메타 데이터
    createdAt: Date;
    updatedAt: Date;
    viewCount: number;
    likeCount: number;
    commentCount: number;

    @Expose()
    isSecret: boolean;

    // 새로운 필드들
    description?: string;
    excerpt?: string;
    readingTime?: number;
    publishedAt?: Date;
    coverImageAlt?: string;
    metaDescription?: string;
    viewTimeInSeconds: number;
} 