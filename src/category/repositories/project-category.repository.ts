import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { ProjectCategory } from '../entities/project-category.entity';

@Injectable()
export class ProjectCategoryRepository extends Repository<ProjectCategory> {
    constructor(private dataSource: DataSource) {
        super(ProjectCategory, dataSource.createEntityManager());
    }

    async findBySlug(slug: string): Promise<ProjectCategory | null> {
        return this.findOne({
            where: { slug }
        });
    }

    async findAllActive(): Promise<ProjectCategory[]> {
        return this.find({
            where: { isActive: true }
        });
    }

    async findWithChildren(slug: string): Promise<ProjectCategory | null> {
        return this.findOne({
            where: { slug },
            relations: ['children']
        });
    }
} 