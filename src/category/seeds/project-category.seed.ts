import { DataSource } from 'typeorm';
import { ProjectCategory } from '../entities/project-category.entity';

interface CategoryData {
    name: string;
    slug: string;
    description: string;
    children?: CategoryData[];
}

export const projectCategories: CategoryData[] = [
    {
        name: '웹 개발',
        slug: 'web-development',
        description: '웹 개발 관련 프로젝트',
        children: [
            {
                name: '프론트엔드',
                slug: 'frontend',
                description: '프론트엔드 개발 프로젝트',
                children: [
                    {
                        name: 'React',
                        slug: 'react',
                        description: 'React 관련 프로젝트'
                    },
                    {
                        name: 'Vue',
                        slug: 'vue',
                        description: 'Vue.js 관련 프로젝트'
                    },
                    {
                        name: 'Angular',
                        slug: 'angular',
                        description: 'Angular 관련 프로젝트'
                    }
                ]
            },
            {
                name: '백엔드',
                slug: 'backend',
                description: '백엔드 개발 프로젝트',
                children: [
                    {
                        name: 'Node.js',
                        slug: 'nodejs',
                        description: 'Node.js 관련 프로젝트'
                    },
                    {
                        name: 'Python',
                        slug: 'python',
                        description: 'Python 관련 프로젝트'
                    },
                    {
                        name: 'Java',
                        slug: 'java',
                        description: 'Java 관련 프로젝트'
                    }
                ]
            }
        ]
    },
    {
        name: '모바일 개발',
        slug: 'mobile-development',
        description: '모바일 앱 개발 관련 프로젝트',
        children: [
            {
                name: 'iOS',
                slug: 'ios',
                description: 'iOS 앱 개발 프로젝트'
            },
            {
                name: 'Android',
                slug: 'android',
                description: 'Android 앱 개발 프로젝트'
            },
            {
                name: 'React Native',
                slug: 'react-native',
                description: 'React Native 프로젝트'
            }
        ]
    },
    {
        name: '데이터 과학',
        slug: 'data-science',
        description: '데이터 과학 관련 프로젝트',
        children: [
            {
                name: '머신러닝',
                slug: 'machine-learning',
                description: '머신러닝 프로젝트'
            },
            {
                name: '딥러닝',
                slug: 'deep-learning',
                description: '딥러닝 프로젝트'
            },
            {
                name: '데이터 분석',
                slug: 'data-analysis',
                description: '데이터 분석 프로젝트'
            }
        ]
    }
];

export async function seedProjectCategories(dataSource: DataSource) {
    const categoryRepository = dataSource.getRepository(ProjectCategory);

    for (const categoryData of projectCategories) {
        const category = await createCategory(categoryRepository, categoryData);
        if (categoryData.children) {
            for (const childData of categoryData.children) {
                const child = await createCategory(categoryRepository, childData, category);
                if (childData.children) {
                    for (const grandChildData of childData.children) {
                        await createCategory(categoryRepository, grandChildData, child);
                    }
                }
            }
        }
    }
}

async function createCategory(
    repository: any,
    data: CategoryData,
    parent?: ProjectCategory
): Promise<ProjectCategory> {
    const existingCategory = await repository.findOne({
        where: { slug: data.slug }
    });

    if (existingCategory) {
        return existingCategory;
    }

    const category = new ProjectCategory();
    category.name = data.name;
    category.slug = data.slug;
    category.description = data.description;
    category.parent = parent;
    category.isActive = true;

    return await repository.save(category);
} 