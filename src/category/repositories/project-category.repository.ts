import { Injectable } from '@nestjs/common';
import { DataSource, Repository, DeepPartial } from 'typeorm';
import { ProjectCategory } from '@category/entities/project-category.entity';

interface CategoryData {
    slug: string;
    name: string;
    description?: string;
    displayOrder: number;
    isActive: boolean;
    children?: CategoryData[];
}

@Injectable()
export class ProjectCategoryRepository extends Repository<ProjectCategory> {
    private readonly MAX_DEPTH = 3;

    constructor(dataSource: DataSource) {
        super(ProjectCategory, dataSource.createEntityManager());
    }

    private async createCategoryIfNotExists(
        categoryData: CategoryData,
        parentId: number | null = null,
        depth: number = 0
    ): Promise<ProjectCategory | null> {
        const existing = await this.findOne({
            where: { slug: categoryData.slug }
        });

        if (existing) {
            // 기존 카테고리가 있다면 depth와 display_order 업데이트
            if (existing.depth !== depth || existing.displayOrder !== categoryData.displayOrder) {
                await this.update(existing.id, { 
                    depth,
                    displayOrder: categoryData.displayOrder 
                });
                existing.depth = depth;
                existing.displayOrder = categoryData.displayOrder;
            }
            return existing;
        }

        const { children, ...categoryFields } = categoryData;
        
        const category = this.create({
            ...categoryFields,
            parentId,
            depth
        });

        const savedCategory = await this.save(category);

        // path 생성 로직
        let path = `${categoryData.displayOrder}`;
        if (parentId) {
            const parent = await this.findOne({ where: { id: parentId } });
            if (parent && parent.path) {
                path = `${parent.path}/${categoryData.displayOrder}`;
            }
        }

        // path 업데이트
        await this.update(savedCategory.id, { path });
        
        return savedCategory;
    }

    private async createCategoriesWithDepth(
        categories: CategoryData[],
        parentId: number | null,
        currentDepth: number
    ): Promise<void> {
        if (currentDepth >= this.MAX_DEPTH) {
            console.warn(`Maximum depth (${this.MAX_DEPTH}) reached. Skipping deeper categories.`);
            return;
        }

        for (const categoryData of categories) {
            const category = await this.createCategoryIfNotExists(
                categoryData,
                parentId,
                currentDepth
            );

            if (category && categoryData.children) {
                await this.createCategoriesWithDepth(
                    categoryData.children,
                    category.id,
                    currentDepth + 1
                );
            }
        }
    }

    async initializeCategories() {
        // 카테고리 데이터
        const categories = [
            {
                slug: 'personal',
                name: '개인',
                description: '개인 프로젝트',
                displayOrder: 1,
                isActive: true,
                children: [
                    {
                        slug: 'personal-cms',
                        name: '개인 블로그',
                        description: '블로그 프로젝트',
                        displayOrder: 1,
                        isActive: true,
                        children: [
                            {
                                slug: 'personal-cms-frontend',
                                name: '프론트엔드',
                                description: '블로그 프론트엔드',
                                displayOrder: 1,
                                isActive: true
                            },
                            {
                                slug: 'personal-cms-backend',
                                name: '백엔드',
                                description: '블로그 백엔드',
                                displayOrder: 2,
                                isActive: true
                            }
                        ]
                    }
                ]
            },
            {
                slug: 'company',
                name: '회사',
                description: '회사 관련 프로젝트',
                displayOrder: 2,
                isActive: true,
                children: [
                    {
                        slug: 'markany',
                        name: '마크애니',
                        description: '마크애니 관련 프로젝트',
                        displayOrder: 1,
                        isActive: true,
                        children: [

                            {
                                slug: 'cargo-license-trade-platform',
                                name: '화물차 면허거래플랫폼',
                                description: '화물차 면허거래플랫폼 관련',
                                displayOrder: 3,
                                isActive: true,
                            },
                            {
                                slug: 'sub-company-infra',
                                name: '자회사 개발환경 구축',
                                description: '자회사 개발환경 구축 프로젝트',
                                displayOrder: 2,
                                isActive: true,
                                // children: []
                            },
                            {
                                slug: 'gs-auth',
                                name: 'GS 인증',
                                description: 'GS 인증',
                                displayOrder: 1,
                                isActive: true
                            },
                            
                        ]
                    },
                    
                ]
            }
        ];

        try {
            await this.createCategoriesWithDepth(categories, null, 0);
            return true;
        } catch (error) {
            console.error('Error initializing categories:', error);
            return false;
        }
    }

    async findAllCategories(includeInactive: boolean = false): Promise<ProjectCategory[]> {
        return this.createQueryBuilder('category')
            .leftJoinAndSelect('category.children', 'children')
            .leftJoinAndSelect('children.children', 'grandChildren')
            .where(includeInactive ? '1=1' : 'category.isActive = :isActive', { isActive: true })
            .andWhere('category.parentId IS NULL')
            .orderBy('category.displayOrder', 'ASC')
            .addOrderBy('children.displayOrder', 'ASC')
            .addOrderBy('grandChildren.displayOrder', 'ASC')
            .getMany();
    }

    async getProjectCategories({ parentSlug, includeInactive = false }: {
        parentSlug?: string;
        includeInactive?: boolean;
    }): Promise<ProjectCategory[]> {
        const queryBuilder = this.createQueryBuilder('category');

        if (parentSlug) {
            const parent = await this.findOne({ where: { slug: parentSlug } });
            if (parent) {
                queryBuilder
                    .where('category.path LIKE :pathPattern', { 
                        pathPattern: `${parent.path}/%` 
                    });
            }
        } else {
            queryBuilder
                .leftJoinAndSelect('category.children', 'children')
                .leftJoinAndSelect('children.children', 'grandChildren')
                .where('category.parentId IS NULL');
        }

        if (!includeInactive) {
            queryBuilder.andWhere('category.isActive = :isActive', { isActive: true });
        }

        queryBuilder
            .orderBy('category.displayOrder', 'ASC')
            .addOrderBy('children.displayOrder', 'ASC')
            .addOrderBy('grandChildren.displayOrder', 'ASC');

        return queryBuilder.getMany();
    }
} 