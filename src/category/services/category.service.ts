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
        const whereConditions: any = {};
        
        if (!includeInactive) {
            whereConditions.isActive = true;
        }

        if (parentSlug) {
            const parentCategory = await this.postCategoryRepository.findOne({
                where: { slug: parentSlug }
            });

            if (parentCategory) {
                whereConditions.path = Like(`${parentCategory.path}/%`);
            }
        } else {
            whereConditions.parent = null;
        }

        return this.postCategoryRepository.find({
            where: whereConditions,
            relations: ['children'],
            order: {
                id: 'ASC'
            }
        });
    }

    async getProjectCategories({ parentSlug, includeInactive = false }: {
        parentSlug?: string;
        includeInactive?: boolean;
    }): Promise<ProjectCategory[]> {
        const whereConditions: any = {};
        
        if (!includeInactive) {
            whereConditions.isActive = true;
        }

        if (parentSlug) {
            const parentCategory = await this.projectCategoryRepository.findOne({
                where: { slug: parentSlug }
            });

            if (parentCategory) {
                whereConditions.path = Like(`${parentCategory.path}/%`);
            }
        } else {
            whereConditions.parent = null;
        }

        return this.projectCategoryRepository.find({
            where: whereConditions,
            relations: ['children'],
            order: {
                id: 'ASC'
            }
        });
    }
} 