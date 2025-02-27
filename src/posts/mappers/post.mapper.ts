// src/posts/mappers/post.mapper.ts

import { Injectable } from '@nestjs/common';
import { Post } from '../entities/post.entity';
import { CreatePostDto } from '../dtos/create-post.dto';
import { PostDetailResponseDto } from '../dtos/post-detail-response.dto'
import { PostStatus } from '@common/enums/post-status.enum';
import { UpdatePostDto } from '../dtos/update-post.dto';
import { CurationType } from '@common/enums/curation-type.enum';
import { PostListResponseDto } from '../dtos/post-list-response.dto';
import { PostCategory } from '@category/entities/post-category.entity';

@Injectable()
export class PostMapper {
    // private 메서드들을 public으로 변경 (PostsService에서 사용해야 함)
    public extractTextFromContent(content: Record<string, any>): string {
        let text = '';
        
        // content가 배열인 경우 재귀적으로 처리
        const extractText = (node: any) => {
            if (node.text) {
                // 텍스트 노드의 내용을 추가할 때 공백으로 구분
                text += node.text + ' ';
            }
            if (node.content && Array.isArray(node.content)) {
                node.content.forEach(extractText);
            }
        };

        if (content.content && Array.isArray(content.content)) {
            content.content.forEach(extractText);
        }

        // 연속된 공백을 하나의 공백으로 변환하고 앞뒤 공백 제거
        return text
            .replace(/[\r\n\t]+/g, ' ')  // 개행, 탭을 공백으로
            .replace(/\s+/g, ' ')        // 연속된 공백을 하나로
            .trim();
    }

    public generateExcerpt(content: Record<string, any>, maxLength: number = 200): string {
        const fullText = this.extractTextFromContent(content);
        if (fullText.length <= maxLength) {
            return fullText;
        }
        
        // maxLength까지 자르고 마지막 공백에서 자르기
        const truncated = fullText.substring(0, maxLength);
        const lastSpace = truncated.lastIndexOf(' ');
        
        // 마지막 공백이 없거나 너무 앞쪽이면 그냥 maxLength에서 자르기
        return lastSpace === -1 || lastSpace < maxLength - 20 
            ? truncated + '...' 
            : truncated.substring(0, lastSpace) + '...';
    }

    private generateSlugFromTitle(title: string): string {
        return title
            .trim()
            .replace(/\s+/g, '-')
            .replace(/[^\w\-가-힣]/g, '')
            .toLowerCase()
            .replace(/-+/g, '-')
            .replace(/^-+|-+$/g, '')
            .substring(0, 100);
    }

    toEntity(dto: CreatePostDto): Post {
        const entity = new Post();
        
        entity.title = dto.title;
        entity.content = dto.content;

        // 슬러그 생성 로직을 함수 사용으로 변경
        if (dto.title) {
            entity.slug = this.generateSlugFromTitle(dto.title);
        } else if (dto.slug) {
            entity.slug = dto.slug;
        }

        // 선택적 필드들
        if (dto.categoryId) {
            const category = new PostCategory();
            category.id = dto.categoryId;
            entity.category = category;
        }
        if (dto.tags) entity.tags = dto.tags;
        if (dto.thumbnail) entity.thumbnail = dto.thumbnail;

        // 기본값이 있는 필드들
        entity.status = dto.status || PostStatus.PUBLISHED;
        entity.isFeatured = dto.isFeatured || false;
        entity.publishedAt = dto.status === PostStatus.PUBLISHED ? new Date() : null;

        // 큐레이션 정보 설정
        // if (dto.curation) {
        //     entity.curation = {
        //         isCurated: dto.curation.isCurated || false,
        //         curatedAt: dto.curation.curatedAt,
        //         curatedBy: dto.curation.curatedBy,
        //         curationOrder: dto.curation.curationOrder || 0,
        //         curationType: dto.curation.curationType || [],
        //         curationNote: dto.curation.curationNote,
        //         curationStartDate: dto.curation.curationStartDate,
        //         curationEndDate: dto.curation.curationEndDate
        //     };
        // }

        return entity;
    }

    toDto(entity: Post): PostDetailResponseDto {
        const dto = new PostDetailResponseDto();
        
        // 기본 필드
        dto.public_id = entity.public_id;
        dto.title = entity.title;
        dto.content = entity.content;
        dto.author_display_name = entity.author_display_name;
        dto.current_author_name = entity.current_author_name;
        if (entity.category) {
            dto.category = entity.category.slug;
        }
        dto.slug = entity.slug;
        dto.tags = entity.tags;
        dto.thumbnail = entity.thumbnail;
        dto.status = entity.status;
        dto.isFeatured = entity.isFeatured;
        dto.isSecret = entity.isSecret;
        dto.isAuthor = false;

        // 날짜 관련
        dto.createdAt = entity.createdAt;
        dto.updatedAt = entity.updatedAt;
        dto.publishedAt = entity.publishedAt;

        // 통계 데이터
        if (entity.stats) {
            dto.viewCount = entity.stats.viewCount;
            dto.likeCount = entity.stats.likeCount;
            dto.commentCount = entity.stats.commentCount;
            dto.viewTimeInSeconds = entity.stats.viewTimeInSeconds;
        }

        // 메타 데이터
        if (entity.meta) {
            dto.description = entity.meta.description;
            dto.excerpt = entity.meta.excerpt;
            dto.readingTime = entity.meta.readingTime;
            dto.coverImageAlt = entity.meta.coverImageAlt;
            dto.metaDescription = entity.meta.metaDescription;
        }

        // 큐레이션 정보
        // if (entity.curation) {
        //     dto.curation = entity.curation;
        // }

        return dto;
    }

    toPostDetailDtoList(entities: Post[]): PostDetailResponseDto[] {
        return entities.map(entity => this.toDto(entity));
    }

    updateEntity(entity: Post, dto: UpdatePostDto): Post {
        // 타이틀이 변경되었고 새로운 슬러그가 제공되지 않은 경우 슬러그 자동 생성
        if (dto.title !== undefined && dto.slug === undefined) {
            entity.slug = this.generateSlugFromTitle(dto.title);
        }

        // 존재하는 필드만 업데이트
        if (dto.title !== undefined) entity.title = dto.title;
        if (dto.content !== undefined) entity.content = dto.content;
        if (dto.categoryId !== undefined) {
            const category = new PostCategory();
            category.id = dto.categoryId;
            entity.category = category;
        }
        if (dto.slug !== undefined) entity.slug = dto.slug;
        if (dto.tags !== undefined) entity.tags = dto.tags;
        if (dto.thumbnail !== undefined) entity.thumbnail = dto.thumbnail;
        if (dto.isFeatured !== undefined) entity.isFeatured = dto.isFeatured;
        if (dto.status !== undefined) entity.status = dto.status;
        if (dto.isSecret !== undefined) entity.isSecret = dto.isSecret;
        // if (dto.curation !== undefined) {
        //     entity.curation = {
        //         ...entity.curation,
        //         ...dto.curation
        //     };
        // }

        return entity;
    }

    toListDto(entity: Post): PostListResponseDto {
        const dto = new PostListResponseDto();
        
        // 기본 필드
        dto.public_id = entity.public_id;
        dto.title = entity.title;
        dto.excerpt = entity.meta?.excerpt || this.generateExcerpt(entity.content);
        dto.author_display_name = entity.author_display_name;
        dto.current_author_name = entity.current_author_name;
        dto.category = entity.category ? entity.category.slug : '';
        dto.slug = entity.slug;
        dto.tags = entity.tags;
        dto.thumbnail = entity.thumbnail;
        dto.status = entity.status;
        dto.isFeatured = entity.isFeatured;
        dto.isSecret = entity.isSecret;

        // 날짜 관련
        dto.createdAt = entity.createdAt;
        dto.updatedAt = entity.updatedAt;
        dto.publishedAt = entity.publishedAt;

        // 통계 데이터
        if (entity.stats) {
            dto.viewCount = entity.stats.viewCount;
            dto.likeCount = entity.stats.likeCount;
            dto.commentCount = entity.stats.commentCount;
        }

        // 메타 데이터
        dto.description = entity.meta?.description || '';
        dto.readingTime = entity.meta?.readingTime || Math.ceil(this.extractTextFromContent(entity.content).split(' ').length / 200);
        dto.coverImageAlt = entity.meta?.coverImageAlt || '';
        dto.metaDescription = entity.meta?.metaDescription || this.generateExcerpt(entity.content, 160);

        // 큐레이션 정보
        // if (entity.curation) {
        //     dto.curation = {
        //         isCurated: entity.curation.isCurated,
        //         curatedAt: entity.curation.curatedAt,
        //         curatedBy: entity.curation.curatedBy,
        //         curationOrder: entity.curation.curationOrder,
        //         curationType: entity.curation.curationType
        //     };
        // }

        return dto;
    }

    toListDtoList(entities: Post[]): PostListResponseDto[] {
        return entities.map(entity => this.toListDto(entity));
    }
}