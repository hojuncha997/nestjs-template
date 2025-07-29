import { ProjectsController } from './projects.controller';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from './entities/project.entity';
import { ProjectsService } from './projects.service';
import { ProjectsRepository } from './projects.repository';
import { ProjectMapper } from './mappers/project.mapper';
import { MembersModule } from '../members/members.module';
import { ProjectRelationRepository } from './project-relation.repository';
import { ProjectStats } from './entities/project-stats.entity';
import { ProjectStatsRepository } from './project-stats.repository';
import { ProjectMetaRepository } from './project-meta.repository';
import { ProjectMeta } from './entities/project-meta.entity';
import { CategoryModule } from '@category/category.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Project, ProjectStats, ProjectMeta]),
        MembersModule,
        CategoryModule,
    ],
    providers: [
        ProjectsService,
        ProjectsRepository,
        ProjectMapper,
        ProjectRelationRepository,
        ProjectStatsRepository,
        ProjectMetaRepository,
    ],
    controllers: [ProjectsController],
    exports: [ProjectsService],
})
export class ProjectsModule {} 