// src/category/category.module.ts
// 카테고리 모듈

import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostCategory } from './entities/post-category.entity';
import { ProjectCategory } from './entities/project-category.entity';
import { PostCategoryRepository } from './repositories/post-category.repository';
import { ProjectCategoryRepository } from './repositories/project-category.repository';
import { CategoryController } from './controllers/category.controller';
import { CategoryService } from './services/category.service';
import { CategoryMapper } from './mappers/category.mapper';

@Module({
    imports: [TypeOrmModule.forFeature([PostCategory, ProjectCategory])],
    controllers: [CategoryController],
    providers: [
        CategoryService,
        PostCategoryRepository,
        ProjectCategoryRepository,
        CategoryMapper
    ],
    exports: [
        CategoryService,
        PostCategoryRepository,
        ProjectCategoryRepository
    ]
})
export class CategoryModule implements OnModuleInit {
    constructor(
        private postCategoryRepository: PostCategoryRepository,
        private projectCategoryRepository: ProjectCategoryRepository
    ) {}

    async onModuleInit() {
        // 카테고리 초기화
        await Promise.all([
            this.postCategoryRepository.initializeCategories(),
            this.projectCategoryRepository.initializeCategories()
        ]);
    }
}
