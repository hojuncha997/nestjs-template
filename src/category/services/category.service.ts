import { Injectable } from '@nestjs/common';
import { PostCategoryRepository } from '../repositories/post-category.repository';
import { ProjectCategoryRepository } from '../repositories/project-category.repository';
import { PostCategory } from '../entities/post-category.entity';
import { ProjectCategory } from '../entities/project-category.entity';
import { Like } from 'typeorm';

@Injectable()
export class CategoryService {
    constructor(
        private readonly postCategoryRepository: PostCategoryRepository,
        private readonly projectCategoryRepository: ProjectCategoryRepository
    ) {}

    async getPostCategories({ parentSlug, includeInactive = false }: {
        parentSlug?: string;
        includeInactive?: boolean;
    }): Promise<PostCategory[]> {
        if (parentSlug) {
            const parent = await this.postCategoryRepository.findOne({
                where: { slug: parentSlug }
            });

            if (parent) {
                return this.postCategoryRepository.createQueryBuilder('category')
                    .leftJoinAndSelect('category.children', 'children')
                    .leftJoinAndSelect('children.children', 'grandChildren')
                    .where('category.path LIKE :pathPattern', { 
                        pathPattern: `${parent.path}/%` 
                    })
                    .andWhere(includeInactive ? '1=1' : 'category.isActive = :isActive', { isActive: true })
                    .orderBy('category.displayOrder', 'ASC')
                    .addOrderBy('children.displayOrder', 'ASC')
                    .addOrderBy('grandChildren.displayOrder', 'ASC')
                    .getMany();
            }
        }

        return this.postCategoryRepository.findAllCategories(includeInactive);
    }

    async getProjectCategories({ parentSlug, includeInactive = false }: {
        parentSlug?: string;
        includeInactive?: boolean;
    }): Promise<ProjectCategory[]> {
        // 모든 카테고리를 한 번에 가져오기
        const allCategories = await this.projectCategoryRepository.find({
            where: {
                isActive: !includeInactive ? true : undefined
            },
            order: {
                displayOrder: 'ASC',
                id: 'ASC'
            }
        });

        // 카테고리 맵 생성
        const categoryMap = new Map<number, ProjectCategory>();
        allCategories.forEach(category => {
            category.children = [];
            categoryMap.set(category.id, category);
        });

        // 트리 구조 구성
        const rootCategories: ProjectCategory[] = [];
        allCategories.forEach(category => {
            if (category.parentId === null) {
                rootCategories.push(category);
            } else {
                const parent = categoryMap.get(category.parentId);
                if (parent) {
                    parent.children.push(category);
                }
            }
        });

        return rootCategories;
    }
} 