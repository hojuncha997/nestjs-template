import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { ProjectStats } from './entities/project-stats.entity';

@Injectable()
export class ProjectStatsRepository extends Repository<ProjectStats> {
    constructor(private dataSource: DataSource) {
        super(ProjectStats, dataSource.createEntityManager());
    }

    async findByProjectId(projectId: string): Promise<ProjectStats | null> {
        return this.findOne({
            where: { project: { public_id: projectId } }
        });
    }

    async incrementViewCount(projectId: string): Promise<void> {
        await this.increment({ project: { public_id: projectId } }, 'viewCount', 1);
    }

    async incrementLikeCount(projectId: string): Promise<void> {
        await this.increment({ project: { public_id: projectId } }, 'likeCount', 1);
    }

    async decrementLikeCount(projectId: string): Promise<void> {
        await this.decrement({ project: { public_id: projectId } }, 'likeCount', 1);
    }
} 