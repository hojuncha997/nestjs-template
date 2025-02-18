// src/posts/mappers/post.mapper.ts

import { Injectable } from '@nestjs/common';
import { Post } from '../entities/post.entity';
import { CreatePostDto } from '../dtos/create-post.dto';
import { PostDetailResponseDto } from '../dtos/post-detail-response.dto'
import { PostStatus } from '@common/enums/post-status.enum';
import { UpdatePostDto } from '../dtos/update-post.dto';
import { CurationType } from '@common/enums/curation-type.enum';
import { PostListResponseDto } from '../dtos/post-list-response.dto';

@Injectable()
export class PostMapper {
    private extractTextFromContent(content: Record<string, any>): string {
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

    private generateExcerpt(content: Record<string, any>, maxLength: number = 200): string {
        const fullText = this.extractTextFromContent(content);
        if (fullText.length <= maxLength) {
            return fullText;
        }
        
        // maxLength까지 자르고 마지막 공백에서 자르기
        const truncated = fullText.substring(0, maxLength);
        const lastSpace = truncated.lastIndexOf(' ');
        
        // 마지막 공백이 없거나 너무 앞쪽이면 그냥 maxLength에서 자르기
        if (lastSpace === -1 || lastSpace < maxLength - 20) {
            return truncated + '...';
        }
        
        return truncated.substring(0, lastSpace) + '...';
    }

    toEntity(dto: CreatePostDto): Post {
        const entity = new Post();
        
        // 필수 필드
        entity.title = dto.title;
        entity.content = dto.content;

        // 슬러그 생성 로직
        if (dto.title) {
            const slug = dto.title
                .trim()
                .replace(/\s+/g, '-')
                .replace(/[^\w\-가-힣]/g, '')
                .toLowerCase()
                .replace(/-+/g, '-')
                .replace(/^-+|-+$/g, '')
                .substring(0, 100);
            
            entity.slug = slug;
        } else if (dto.slug) {
            entity.slug = dto.slug;
        }

        // 선택적 필드들은 undefined 체크
        if (dto.category) {
            entity.category = dto.category;
        }
        
        if (dto.tags) {
            entity.tags = dto.tags;
        }

        if (dto.thumbnail) {
            entity.thumbnail = dto.thumbnail;
        }

        // 기본값이 있는 필드들
        entity.status = dto.status || PostStatus.PUBLISHED;
        entity.isFeatured = dto.isFeatured || false;

        // 새로운 필드들 매핑
        entity.description = dto.description;
        entity.excerpt = this.generateExcerpt(dto.content);
        entity.readingTime = Math.ceil(this.extractTextFromContent(dto.content).split(' ').length / 200); // 분당 200단어 기준
        entity.publishedAt = dto.status === PostStatus.PUBLISHED ? new Date() : null;
        entity.coverImageAlt = dto.coverImageAlt;
        entity.metaDescription = dto.metaDescription || this.generateExcerpt(dto.content, 160);
        
        // 큐레이션 정보 설정
        if (dto.curation) {
            entity.curation = {
                isCurated: dto.curation.isCurated || false,
                curatedAt: dto.curation.curatedAt,
                curatedBy: dto.curation.curatedBy,
                curationOrder: dto.curation.curationOrder || 0,
                curationType: dto.curation.curationType || [],
                curationNote: dto.curation.curationNote,
                curationStartDate: dto.curation.curationStartDate,
                curationEndDate: dto.curation.curationEndDate
            };
        }

        return entity;
    }

    toDto(entity: Post): PostDetailResponseDto {
        const postDetailResponseDto = new PostDetailResponseDto();
        
        // 기본 필드
        postDetailResponseDto.public_id = entity.public_id;
        postDetailResponseDto.title = entity.title;
        postDetailResponseDto.content = entity.content;
        postDetailResponseDto.author_display_name = entity.author_display_name;
        postDetailResponseDto.current_author_name = entity.current_author_name;
        postDetailResponseDto.isSecret = entity.isSecret;
        postDetailResponseDto.isAuthor = false; // 기본값은 false
        postDetailResponseDto.category = entity.category;
        postDetailResponseDto.slug = entity.slug;
        postDetailResponseDto.tags = entity.tags;
        postDetailResponseDto.thumbnail = entity.thumbnail;
        postDetailResponseDto.status = entity.status;
        postDetailResponseDto.isFeatured = entity.isFeatured;
        
        // 메타 필드
        postDetailResponseDto.createdAt = entity.createdAt;
        postDetailResponseDto.updatedAt = entity.updatedAt;
        postDetailResponseDto.viewCount = entity.stats ? entity.stats.viewCount : 0;
        postDetailResponseDto.likeCount = entity.stats ? entity.stats.likeCount : 0;
        postDetailResponseDto.commentCount = entity.stats ? entity.stats.commentCount : 0;
        postDetailResponseDto.viewTimeInSeconds = entity.stats ? entity.stats.viewTimeInSeconds : 0;

        // 새로운 필드들 매핑
        postDetailResponseDto.description = entity.description;
        // postDetailResponseDto.metaDescription = entity.metaDescription;
        // postDetailResponseDto.excerpt = entity.excerpt;
        postDetailResponseDto.readingTime = entity.readingTime;
        postDetailResponseDto.publishedAt = entity.publishedAt;
        postDetailResponseDto.coverImageAlt = entity.coverImageAlt;
        postDetailResponseDto.metaDescription = entity.metaDescription;
        
        // 큐레이션 정보 (간소화된 버전)
        if (entity.curation) {
            postDetailResponseDto.curation = entity.curation;
        }

        return postDetailResponseDto;
    }

    toPostDetailDtoList(entities: Post[]): PostDetailResponseDto[] {
        return entities.map(entity => this.toDto(entity));
    }

    updateEntity(entity: Post, dto: UpdatePostDto): Post {
        // 존재하는 필드만 업데이트
        if (dto.title !== undefined) entity.title = dto.title;
        if (dto.content !== undefined) {
            entity.excerpt = this.generateExcerpt(dto.content);
            entity.readingTime = Math.ceil(this.extractTextFromContent(dto.content).split(' ').length / 200);
        }
        if (dto.category !== undefined) entity.category = dto.category;
        if (dto.slug !== undefined) entity.slug = dto.slug;
        if (dto.tags !== undefined) entity.tags = dto.tags;
        if (dto.thumbnail !== undefined) entity.thumbnail = dto.thumbnail;
        if (dto.isFeatured !== undefined) entity.isFeatured = dto.isFeatured;
        if (dto.status !== undefined) entity.status = dto.status;
        if (dto.isSecret !== undefined) entity.isSecret = dto.isSecret;
        if (dto.description !== undefined) entity.description = dto.description;
        if (dto.coverImageAlt !== undefined) entity.coverImageAlt = dto.coverImageAlt;
        if (dto.metaDescription !== undefined) entity.metaDescription = dto.metaDescription;
        if (dto.curation !== undefined) {
            entity.curation = {
                ...entity.curation,
                ...dto.curation
            };
        }

        return entity;
    }

    toListDto(entity: Post): PostListResponseDto {
        const dto = new PostListResponseDto();
        
        // 기본 필드
        dto.public_id = entity.public_id;
        dto.title = entity.title;
        dto.excerpt = entity.excerpt;  // content 대신 excerpt 사용
        dto.author_display_name = entity.author_display_name;
        dto.current_author_name = entity.current_author_name;
        dto.category = entity.category;
        dto.slug = entity.slug;
        dto.tags = entity.tags;
        dto.thumbnail = entity.thumbnail;
        dto.status = entity.status;
        dto.isFeatured = entity.isFeatured;
        
        // 메타 데이터
        dto.createdAt = entity.createdAt;
        dto.updatedAt = entity.updatedAt;
        dto.viewCount = entity.stats ? entity.stats.viewCount : 0;
        dto.likeCount = entity.stats ? entity.stats.likeCount : 0;
        dto.commentCount = entity.stats ? entity.stats.commentCount : 0;
        dto.isSecret = entity.isSecret;

        // 새로운 필드들
        dto.description = entity.description;
        dto.readingTime = entity.readingTime;
        dto.publishedAt = entity.publishedAt;
        dto.coverImageAlt = entity.coverImageAlt;
        dto.metaDescription = entity.metaDescription;
        
        // 큐레이션 정보 (간소화된 버전)
        if (entity.curation) {
            dto.curation = {
                isCurated: entity.curation.isCurated,
                curatedAt: entity.curation.curatedAt,
                curatedBy: entity.curation.curatedBy,
                curationOrder: entity.curation.curationOrder,
                curationType: entity.curation.curationType
            };
        }

        return dto;
    }

    toListDtoList(entities: Post[]): PostListResponseDto[] {
        return entities.map(entity => this.toListDto(entity));
    }
}