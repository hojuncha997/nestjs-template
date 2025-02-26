// src/category/category.module.ts
// 카테고리 모듈

import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostCategory } from './entities/post-category.entity';
import { PostCategoryRepository } from './repositories/post-category.repository';
import { CategoryController } from './controllers/category.controller';
import { CategoryService } from './services/category.service';

@Module({
    imports: [TypeOrmModule.forFeature([PostCategory])],
    controllers: [CategoryController],
    providers: [PostCategoryRepository, CategoryService],
    exports: [PostCategoryRepository],
})
export class CategoryModule implements OnModuleInit {
    constructor(private postCategoryRepository: PostCategoryRepository) {}

    async onModuleInit() {
        // 카테고리 초기화 (app.module.ts 에서 호출)
        await this.postCategoryRepository.initializeCategories();
    }
}
