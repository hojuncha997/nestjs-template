import { Controller, Get } from '@nestjs/common';
import { CategoryService } from '../services/category.service';
import { PostCategory } from '../entities/post-category.entity';

@Controller('categories')
export class CategoryController {
    constructor(private readonly categoryService: CategoryService) {}

    @Get('posts')
    async getPostCategories(): Promise<PostCategory[]> {
        return this.categoryService.getPostCategories();
    }

    // 나중에 프로젝트 카테고리 엔드포인트 추가 가능
    // @Get('projects')
    // async getProjectCategories() { ... }
}
