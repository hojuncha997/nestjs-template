// src/category/dtos/category-response.dto.ts
// 카테고리 응답 DTO

export class CategoryResponseDto {
    id: number;
    slug: string;
    name: string;
    description: string;
    depth: number;
    displayOrder: number;
    isActive: boolean;
    children?: CategoryResponseDto[];
} 