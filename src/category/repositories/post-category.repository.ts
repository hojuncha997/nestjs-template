// src/category/repositories/post-category.repository.ts

import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { PostCategory } from '@category/entities/post-category.entity';

@Injectable()
export class PostCategoryRepository extends Repository<PostCategory> {
    constructor(dataSource: DataSource) {
        super(PostCategory, dataSource.createEntityManager());
    }

    async initializeCategories() {
        // 최상위 카테고리 데이터
        const rootCategories = [
            {
                slug: 'programming',
                name: 'Programming',
                description: 'Programming related posts',
                displayOrder: 1,
                isActive: true,
            },
            {
                slug: 'general',
                name: 'General',
                description: 'General topics',
                displayOrder: 2,
                isActive: true,
            },
            {
                slug: 'review',
                name: 'Review',
                description: 'Product and service reviews',
                displayOrder: 3,
                isActive: true,
            },
            {
                slug: 'travel',
                name: 'Travel',
                description: 'Travel experiences and tips',
                displayOrder: 4,
                isActive: true,
            },
            {
                slug: 'hobby',
                name: 'Hobby',
                description: 'Hobby and leisure activities',
                displayOrder: 5,
                isActive: true,
            }
        ];

        // 하위 카테고리 데이터
        const subCategories = {
            'programming': [
                {
                    slug: 'javascript',
                    name: 'JavaScript',
                    description: 'JavaScript programming',
                    displayOrder: 1,
                    isActive: true,
                },
                {
                    slug: 'python',
                    name: 'Python',
                    description: 'Python programming',
                    displayOrder: 2,
                    isActive: true,
                }
            ]
        };

        try {
            // 최상위 카테고리 생성
            for (const categoryData of rootCategories) {
                const existingCategory = await this.findOneBy({ 
                    slug: categoryData.slug  // code -> slug로 변경
                });
                if (!existingCategory) {
                    const category = this.create({
                        ...categoryData,
                        depth: 0,
                        parentId: null,
                    });
                    const savedCategory = (await this.save(category)) as PostCategory;
                    
                    // path 업데이트
                    await this.update(savedCategory.id, {
                        path: `${savedCategory.id}`
                    });

                    // 하위 카테고리가 있다면 생성
                    const subCategoryList = subCategories[categoryData.slug];  // code -> slug로 변경
                    if (subCategoryList) {
                        for (const subCategoryData of subCategoryList) {
                            const existingSubCategory = await this.findOneBy({ 
                                slug: subCategoryData.slug  // code -> slug로 변경
                            });
                            if (!existingSubCategory) {
                                const subCategory = this.create({
                                    ...subCategoryData,
                                    depth: 1,
                                    parentId: savedCategory.id,
                                });
                                const savedSubCategory = (await this.save(subCategory)) as unknown as PostCategory;
                                
                                // 하위 카테고리 path 업데이트
                                await this.update(savedSubCategory.id, {
                                    path: `${savedCategory.id}.${savedSubCategory.id}`  // '/' -> '.'
                                });
                            }
                        }
                    }
                }
            }
            return true;
        } catch (error) {
            console.error('Error initializing categories:', error);
            return false;
        }
    }
}