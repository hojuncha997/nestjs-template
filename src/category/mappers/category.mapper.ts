// src/category/mappers/category.mapper.ts
// 카테고리 매퍼

import { Injectable } from '@nestjs/common';
import { PostCategory } from '../entities/post-category.entity';
import { CategoryResponseDto } from '../dtos/category-response.dto';

@Injectable()
export class CategoryMapper {
    toDto(entity: PostCategory): CategoryResponseDto {
        const dto = new CategoryResponseDto();
        dto.id = entity.id;
        dto.slug = entity.slug;
        dto.name = entity.name;
        dto.description = entity.description;
        dto.depth = entity.depth;
        dto.displayOrder = entity.displayOrder;
        dto.isActive = entity.isActive;

        if (entity.children?.length > 0) {
            dto.children = entity.children.map(child => this.toDto(child));
        }

        return dto;
    }

    toDtoList(entities: PostCategory[]): CategoryResponseDto[] {
        return entities.map(entity => this.toDto(entity));
    }
} 