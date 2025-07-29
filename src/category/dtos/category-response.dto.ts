// src/category/dtos/category-response.dto.ts
// 카테고리 응답 DTO

export class CategoryResponseDto {
    id: number;
    name: string;
    slug: string;
    description: string;
    isActive: boolean;
    path?: string;
    children?: CategoryResponseDto[];
} 