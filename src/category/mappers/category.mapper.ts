// src/category/mappers/category.mapper.ts
// 카테고리 매퍼

import { Injectable } from '@nestjs/common';
import { PostCategory } from '../entities/post-category.entity';
import { ProjectCategory } from '../entities/project-category.entity';
import { CategoryResponseDto } from '../dtos/category-response.dto';
import { GuestbookCategory } from '../entities/guestbook-category.entity';
@Injectable()
export class CategoryMapper {
    toDto(category: PostCategory | ProjectCategory | GuestbookCategory): CategoryResponseDto {
        const dto = new CategoryResponseDto();
        dto.id = category.id;
        dto.name = category.name;
        dto.slug = category.slug;
        dto.description = category.description;
        dto.isActive = category.isActive;
        dto.path = category.path;
        dto.children = category.children ? category.children.map(child => this.toDto(child)) : [];
        return dto;
    }

    toDtoList(categories: (PostCategory | ProjectCategory | GuestbookCategory)[]): CategoryResponseDto[] {
        return categories.map(category => this.toDto(category));
    }
} 