import { Injectable } from '@nestjs/common';
import { DataSource, Repository, DeepPartial } from 'typeorm';
import { GuestbookCategory } from '@category/entities/guestbook-category.entity';

interface CategoryData {
    slug: string;
    name: string;
    description?: string;
    displayOrder: number;
    isActive: boolean;
    children?: CategoryData[];
}

@Injectable()
export class GuestbookCategoryRepository extends Repository<GuestbookCategory> {
    private readonly MAX_DEPTH = 3;

    constructor(dataSource: DataSource) {
        super(GuestbookCategory, dataSource.createEntityManager());
    }

    private async createCategoryIfNotExists(
        categoryData: CategoryData,
        parentId: number | null = null,
        depth: number = 0
    ): Promise<GuestbookCategory | null> {
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
            // {
            //     slug: 'guestbook',
            //     name: '방명록',
            //     description: '방명록 카테고리',
            //     displayOrder: 1,
            //     isActive: true,
            //     children: [
                    {
                        slug: 'general',
                        name: '일반',
                        description: '일반적인 방명록',
                        displayOrder: 1,
                        isActive: true
                    },
                    {
                        slug: 'inquiry',
                        name: '문의',
                        description: '문의 방명록',
                        displayOrder: 2,
                        isActive: true
                    },
                    {
                        slug: 'praise',
                        name: '칭찬',
                        description: '칭찬 방명록',
                        displayOrder: 3,
                        isActive: true
                    },
                    {
                        slug: 'suggestion',
                        name: '제안',
                        description: '제안 방명록',
                        displayOrder: 4,
                        isActive: true
                    }
                // ]
            // }
        ];

        try {
            await this.createCategoriesWithDepth(categories, null, 0);
            return true;
        } catch (error) {
            console.error('Error initializing categories:', error);
            return false;
        }
    }

    async findAllCategories(includeInactive: boolean = false): Promise<GuestbookCategory[]> {
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

    async getGuestbookCategories({ parentSlug, includeInactive = false }: {
        parentSlug?: string;
        includeInactive?: boolean;
    }): Promise<GuestbookCategory[]> {
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