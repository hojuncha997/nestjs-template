import { DataSource } from 'typeorm';
import { ProjectCategoryRepository } from '../repositories/project-category.repository';

export async function seedProjectCategories(dataSource: DataSource) {
    const projectCategoryRepository = new ProjectCategoryRepository(dataSource);
    return await projectCategoryRepository.initializeCategories();
} 