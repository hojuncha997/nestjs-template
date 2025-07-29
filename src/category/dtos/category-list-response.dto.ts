// src/category/dtos/category-list-response.dto.ts
// 카테고리 목록 응답 DTO

import { CategoryResponseDto } from './category-response.dto';

export class CategoryListResponseDto {
    data: CategoryResponseDto[];
    meta?: {
        total: number;
    };
} 