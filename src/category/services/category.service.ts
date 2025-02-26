import { Injectable } from '@nestjs/common';
import { PostCategoryRepository } from '../repositories/post-category.repository';
import { PostCategory } from '../entities/post-category.entity';

@Injectable()
export class CategoryService {
    constructor(
        private postCategoryRepository: PostCategoryRepository
    ) {}

    async getPostCategories(): Promise<PostCategory[]> {
        return this.postCategoryRepository.find({
            where: { isActive: true },
            order: { displayOrder: 'ASC' },
            relations: ['children']
        });
    }
} 