import { Controller, Get, Query } from '@nestjs/common';
import { CategoryService } from '../services/category.service';
import { PostCategory } from '../entities/post-category.entity';
import { CategoryResponseDto } from '../dtos/category-response.dto';
import { CategoryMapper } from '../mappers/category.mapper';
import { CategoryListResponseDto } from '../dtos/category-list-response.dto';

@Controller('categories')
export class CategoryController {
    constructor(
        private readonly categoryService: CategoryService,
        private readonly categoryMapper: CategoryMapper
    ) {}

    @Get('posts')
    async getPostCategories(
        @Query('parent') parentSlug?: string,
        @Query('includeInactive') includeInactive?: boolean
    ): Promise<CategoryListResponseDto> {
        const categories = await this.categoryService.getPostCategories({
            parentSlug,
            includeInactive: includeInactive || false
        });

        return {
            data: this.categoryMapper.toDtoList(categories),
            meta: {
                total: categories.length
            }
        };
    }

    // 나중에 프로젝트 카테고리 엔드포인트 추가 가능
    // @Get('projects')
    // async getProjectCategories() { ... }
}
