import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { ProjectRelation } from './entities/project-relation.entity';

@Injectable()
export class ProjectRelationRepository extends Repository<ProjectRelation> {
    constructor(private dataSource: DataSource) {
        super(ProjectRelation, dataSource.createEntityManager());
    }

    async findByProjectId(projectId: string): Promise<ProjectRelation[]> {
        return this.find({
            where: { project: { public_id: projectId } }
        });
    }

    async createRelation(projectId: string, relatedProjectId: string, type: string): Promise<void> {
        const relation = new ProjectRelation();
        relation.project = { public_id: projectId } as any;
        relation.relatedProject = { public_id: relatedProjectId } as any;
        relation.type = type;
        await this.save(relation);
    }

    async removeRelation(projectId: string, relatedProjectId: string): Promise<void> {
        await this.delete({
            project: { public_id: projectId },
            relatedProject: { public_id: relatedProjectId }
        });
    }
} 