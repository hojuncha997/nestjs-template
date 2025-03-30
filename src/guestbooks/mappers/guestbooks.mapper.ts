import { Injectable } from '@nestjs/common';
import { Guestbook } from '../entities/guestbook.entity';
import { CreateGuestbookDto } from '../dtos/create-guestbook.dto';
import { GuestbookDetailResponseDto } from '../dtos/guestbook-detail-response.dto';
import { GuestbookStatus } from '@common/enums/guestbook-status.enum';
import { UpdateGuestbookDto } from '../dtos/update-guestbook.dto';
import { GuestbookListResponseDto } from '../dtos/guestbook-list-response.dto';
import { GuestbookCategory } from '@category/entities/guestbook-category.entity';
@Injectable()
export class GuestbooksMapper {
    public extractTextFromContent(content: Record<string, any>): string {
        let text = '';
        
        const extractText = (node: any) => {
            if (node.text) {
                text += node.text + ' ';
            }
            if (node.content && Array.isArray(node.content)) {
                node.content.forEach(extractText);
            }
        };

        if (content.content && Array.isArray(content.content)) {
            content.content.forEach(extractText);
        }

        return text
            .replace(/[\r\n\t]+/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    public generateExcerpt(content: Record<string, any>, maxLength: number = 200): string {
        const fullText = this.extractTextFromContent(content);
        if (fullText.length <= maxLength) {
            return fullText;
        }
        
        const truncated = fullText.substring(0, maxLength);
        const lastSpace = truncated.lastIndexOf(' ');
        
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

    toEntity(dto: CreateGuestbookDto): Guestbook {
        const entity = new Guestbook();
        
        entity.title = dto.title;
        entity.content = dto.content;

        if (dto.title) {
            entity.slug = this.generateSlugFromTitle(dto.title);
        } else if (dto.slug) {
            entity.slug = dto.slug;
        }

        if (dto.categorySlug) {
            const category = new GuestbookCategory();
            category.slug = dto.categorySlug;
            entity.category = category;
        }
        if (dto.tags) entity.tags = dto.tags;
        if (dto.thumbnail) entity.thumbnail = dto.thumbnail;

        entity.status = dto.status || GuestbookStatus.PUBLISHED;
        entity.isFeatured = dto.isFeatured || false;
        entity.publishedAt = dto.status === GuestbookStatus.PUBLISHED ? new Date() : null;

        return entity;
    }

    toDto(entity: Guestbook): GuestbookDetailResponseDto {
        const dto = new GuestbookDetailResponseDto();
        
        dto.public_id = entity.public_id;
        dto.title = entity.title;
        dto.content = entity.content;
        dto.current_author_name = entity.current_author_name;
        dto.author_uuid = entity.author?.uuid;
        if (entity.category) {
            dto.categorySlug = entity.category.slug;
        }
        dto.slug = entity.slug;
        dto.tags = entity.tags;
        dto.thumbnail = entity.thumbnail;
        dto.status = entity.status;
        dto.isFeatured = entity.isFeatured;
        dto.isSecret = entity.isSecret;

        dto.createdAt = entity.createdAt;
        dto.updatedAt = entity.updatedAt;
        dto.publishedAt = entity.publishedAt;

        if (entity.stats) {
            dto.viewCount = entity.stats.viewCount;
            dto.likeCount = entity.stats.likeCount;
            dto.commentCount = entity.stats.commentCount;
            dto.viewTimeInSeconds = entity.stats.viewTimeInSeconds;
        }

        if (entity.meta) {
            dto.description = entity.meta.description;
            dto.excerpt = entity.meta.excerpt;
            dto.readingTime = entity.meta.readingTime;
            dto.coverImageAlt = entity.meta.coverImageAlt;
            dto.metaDescription = entity.meta.metaDescription;
        }

        return dto;
    }

    toGuestbookDetailDtoList(entities: Guestbook[]): GuestbookDetailResponseDto[] {
        return entities.map(entity => this.toDto(entity));
    }

    updateEntity(entity: Guestbook, dto: UpdateGuestbookDto): Guestbook {
        if (dto.title !== undefined && dto.slug === undefined) {
            entity.slug = this.generateSlugFromTitle(dto.title);
        }

        if (dto.title !== undefined) entity.title = dto.title;
        if (dto.content !== undefined) entity.content = dto.content;
        if (dto.categorySlug !== undefined) {
            const category = new GuestbookCategory();
            category.slug = dto.categorySlug;
            entity.category = category;
        }
        if (dto.slug !== undefined) entity.slug = dto.slug;
        if (dto.tags !== undefined) entity.tags = dto.tags;
        if (dto.thumbnail !== undefined) entity.thumbnail = dto.thumbnail;
        if (dto.isFeatured !== undefined) entity.isFeatured = dto.isFeatured;
        if (dto.status !== undefined) entity.status = dto.status;
        if (dto.isSecret !== undefined) entity.isSecret = dto.isSecret;

        return entity;
    }

    toListDto(entity: Guestbook): GuestbookListResponseDto {
        const dto = new GuestbookListResponseDto();
        
        dto.public_id = entity.public_id;
        dto.title = entity.title;
        dto.excerpt = entity.meta?.excerpt || this.generateExcerpt(entity.content);
        dto.current_author_name = entity.current_author_name;
        dto.categorySlug = entity.category ? entity.category.slug : '';
        dto.slug = entity.slug;
        dto.tags = entity.tags;
        dto.thumbnail = entity.thumbnail;
        dto.status = entity.status;
        dto.isFeatured = entity.isFeatured;
        dto.isSecret = entity.isSecret;

        dto.createdAt = entity.createdAt;
        dto.updatedAt = entity.updatedAt;
        dto.publishedAt = entity.publishedAt;

        if (entity.stats) {
            dto.viewCount = entity.stats.viewCount;
            dto.likeCount = entity.stats.likeCount;
            dto.commentCount = entity.stats.commentCount;
        }

        dto.description = entity.meta?.description || '';
        dto.readingTime = entity.meta?.readingTime || Math.ceil(this.extractTextFromContent(entity.content).split(' ').length / 200);
        dto.coverImageAlt = entity.meta?.coverImageAlt || '';
        dto.metaDescription = entity.meta?.metaDescription || this.generateExcerpt(entity.content, 160);

        return dto;
    }

    toListDtoList(entities: Guestbook[]): GuestbookListResponseDto[] {
        return entities.map(entity => this.toListDto(entity));
    }
} 