import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './entities/project.entity';
import { ProjectStats } from './entities/project-stats.entity';
import { ProjectStatus } from '@common/enums/project-status.enum';

@Injectable()
export class ProjectsRepository extends Repository<Project> {
    private readonly logger = new Logger(ProjectsRepository.name);
    constructor(
        @InjectRepository(Project)
        private readonly repository: Repository<Project>
    ) {
        super(repository.target, repository.manager, repository.queryRunner);
    }

    async saveProject(project: Project): Promise<Project> {
        return await this.repository.save(project);
    }

    async findAllProjects(): Promise<Project[]> {
        return await this.repository
            .createQueryBuilder('project')
            .leftJoinAndSelect('project.stats', 'stats')
            .getMany();
    }

    async findProjectByPublicId(public_id: string, withDeleted: boolean = false): Promise<Project | null> {
        const query = this.repository
            .createQueryBuilder('project')
            .leftJoinAndSelect('project.author', 'author')
            .leftJoinAndSelect('project.stats', 'stats')
            .leftJoinAndSelect('project.meta', 'meta')
            .where('project.public_id = :public_id', { public_id });

        if (withDeleted) {
            query.withDeleted();
        }

        const result = await query.getOne();
        this.logger.log('---------DEBUG--Raw Result:', result);

        return result;
    }

    async createProject(project: Project): Promise<Project> {
        const savedProject = await this.save(project);
        
        // ProjectStats 생성
        const projectStats = new ProjectStats();
        projectStats.projectId = savedProject.id;
        await this.manager.getRepository(ProjectStats).save(projectStats);
        
        return savedProject;
    }

    async updateProject(project: Project): Promise<Project> {
        return await this.saveProject(project);
    }

    async deleteProject(public_id: string): Promise<void> {
        await this.repository.manager.transaction(async (transactionalEntityManager) => {
            await transactionalEntityManager
                .createQueryBuilder()
                .update(Project)
                .set({ status: ProjectStatus.DELETED })
                .where('public_id = :public_id', { public_id })
                .execute();

            await transactionalEntityManager
                .softDelete(Project, { public_id });
        });
    }

    async incrementViewCount(public_id: string): Promise<void> {
        const project = await this.findProjectByPublicId(public_id);
        if (!project) return;

        await this.manager.getRepository(ProjectStats)
            .createQueryBuilder()
            .update(ProjectStats)
            .set({
                viewCount: () => 'view_count + 1'
            })
            .where('projectId = :projectId', { projectId: project.id })
            .execute();
    }

    async findEntityByPublicId(public_id: string): Promise<Project | null> {
        return await this.repository
            .createQueryBuilder('project')
            .leftJoinAndSelect('project.stats', 'stats')
            .where('project.public_id = :public_id', { public_id })
            .getOne();
    }
} 