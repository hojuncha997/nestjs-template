import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { ProjectMeta } from './entities/project-meta.entity';

@Injectable()
export class ProjectMetaRepository extends Repository<ProjectMeta> {
    constructor(private dataSource: DataSource) {
        super(ProjectMeta, dataSource.createEntityManager());
    }

    async findByProjectId(projectId: string): Promise<ProjectMeta | null> {
        return this.findOne({
            where: { project: { public_id: projectId } }
        });
    }

    async updateMetaData(projectId: string, metaData: Partial<ProjectMeta>): Promise<void> {
        await this.update({ project: { public_id: projectId } }, metaData);
    }
} 