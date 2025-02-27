import { Injectable } from '@nestjs/common';
import { PostCategoryRepository } from '../repositories/post-category.repository';
import { PostCategory } from '../entities/post-category.entity';
import { In } from 'typeorm';

@Injectable()
export class CategoryService {
    constructor(
        private readonly postCategoryRepository: PostCategoryRepository
    ) {}

    async getPostCategories({
        parentSlug,
        includeInactive = false
    }: {
        parentSlug?: string;
        includeInactive?: boolean;
    }): Promise<PostCategory[]> {
        const queryBuilder = this.postCategoryRepository
            .createQueryBuilder('category')
            .leftJoinAndSelect('category.children', 'children')
            .orderBy('category.displayOrder', 'ASC')
            .addOrderBy('children.displayOrder', 'ASC');

        if (!includeInactive) {
            queryBuilder.andWhere('category.isActive = :isActive', { isActive: true });
        }

        if (parentSlug) {
            const parent = await this.postCategoryRepository.findOne({
                where: { slug: parentSlug }
            });

            if (parent) {
                queryBuilder.andWhere('category.path LIKE :path', {
                    path: `${parent.path}%`
                });
            }
        } else {
            // 최상위 카테고리만 조회
            queryBuilder.andWhere('category.parentId IS NULL');
        }

        return queryBuilder.getMany();
    }

    async getFullPath(category: PostCategory): Promise<string> {
        if (!category.path) {
            return category.name;
        }

        const categoryIds = category.path.split('.').map(id => parseInt(id));
        const categories = await this.postCategoryRepository.findBy({
            id: In(categoryIds)
        });
        return categories.map(cat => cat.name).join(' > ');
    }
} 