import { Controller, Get, Query } from '@nestjs/common';
import { CategoryService } from '../services/category.service';
import { PostCategory } from '../entities/post-category.entity';
import { CategoryResponseDto } from '../dtos/category-response.dto';
import { CategoryMapper } from '../mappers/category.mapper';
import { CategoryListResponseDto } from '../dtos/category-list-response.dto';
import { GuestbookCategory } from '@category/entities/guestbook-category.entity';


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

    @Get('projects')
    async getProjectCategories(
        @Query('parent') parentSlug?: string,
        @Query('includeInactive') includeInactive?: boolean
    ): Promise<CategoryListResponseDto> {
        const categories = await this.categoryService.getProjectCategories({
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

    @Get('guestbooks')
    async getGuestbookCategories(
        @Query('parent') parentSlug?: string,
        @Query('includeInactive') includeInactive?: boolean
    ): Promise<CategoryListResponseDto> {
        const categories = await this.categoryService.getGuestbookCategories({
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
}
