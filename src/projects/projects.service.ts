import { Injectable, Logger } from '@nestjs/common';
import { ProjectsRepository } from './projects.repository';
import { CreateProjectDto } from './dtos/create-project.dto';
import { UpdateProjectDto } from './dtos/update-project.dto';
import { ProjectDetailResponseDto } from './dtos/project-detail-response.dto';
import { ProjectMapper } from './mappers/project.mapper';
import { NotFoundException } from '@nestjs/common';
import { GetProjectsQueryDto } from './dtos/get-project-query.dto';
import { QUERY_CONSTANTS } from '@common/constants/query-constants.contant';
import { Member } from '@members/entities/member.entity';
import { ForbiddenException } from '@nestjs/common';
import { ProjectListResponseDto } from './dtos/project-list-response.dto';
import { ListResponse } from '@common/types/list-response.types';
import { LessThan, MoreThan, Brackets, Like } from 'typeorm';
import { ProjectStats } from './entities/project-stats.entity';
import { ProjectStatsRepository } from './project-stats.repository';
import { ProjectMetaRepository } from './project-meta.repository';
import { ProjectMeta } from './entities/project-meta.entity';
import { BadRequestException } from '@nestjs/common';
import { MemberStatus } from '@common/enums';
import { Project } from './entities/project.entity';
import { ProjectCategoryRepository } from '@category/repositories/project-category.repository';
import { ProjectCategory } from '@category/entities/project-category.entity';

@Injectable()
export class ProjectsService {
    private readonly logger = new Logger(ProjectsService.name);

    constructor(
        private readonly projectsRepository: ProjectsRepository, 
        private readonly projectMapper: ProjectMapper,
        private readonly projectStatsRepository: ProjectStatsRepository,
        private readonly projectMetaRepository: ProjectMetaRepository,
        private readonly categoryRepository: ProjectCategoryRepository
    ) {}

    async findProjectList(query: GetProjectsQueryDto): Promise<
    ListResponse<ProjectListResponseDto>
    > {
        this.logger.log('---------@@@--query from service:', query);
        const { MAX_QUERY_LIMIT, DEFAULT_QUERY_LIMIT, DEFAULT_QUERY_PAGE } = QUERY_CONSTANTS;

        const limit = Math.min(query.limit || DEFAULT_QUERY_LIMIT, MAX_QUERY_LIMIT);
        const page = Math.max(query.page || DEFAULT_QUERY_PAGE, 1);

        const queryBuilder = this.projectsRepository.createQueryBuilder('project')
            .leftJoinAndSelect('project.stats', 'stats')
            .leftJoinAndSelect('project.meta', 'meta')
            .leftJoinAndSelect('project.category', 'category')
            .leftJoinAndSelect('project.author', 'author');

        if (query.startDate) {
            queryBuilder.andWhere('project.createdAt >= :startDate', { 
                startDate: new Date(query.startDate) 
            });
        }

        if (query.endDate) {
            const endDate = new Date(query.endDate);
            endDate.setHours(23, 59, 59, 999);
            
            queryBuilder.andWhere('project.createdAt <= :endDate', { 
                endDate 
            });
        }
        
        if (query.search) {
            queryBuilder.andWhere('project.title ILIKE :search', { search: `%${query.search}%` });
        }
    
        if (query.categorySlug) {
            const category = await this.categoryRepository.findOne({
                where: { slug: query.categorySlug }
            });
            
            this.logger.log('---------@@@--found category:', category);
            
            if (category) {
                const categoryPath = category.path;
                const subCategories = await this.categoryRepository
                    .createQueryBuilder('category')
                    .where('category.id = :categoryId', { categoryId: category.id })
                    .orWhere('category.path LIKE :pathPattern', { 
                        pathPattern: `${categoryPath}/%` 
                    })
                    .getMany();

                this.logger.log('---------@@@--found sub categories:', subCategories);

                if (subCategories.length > 0) {
                    const categoryIds = subCategories.map(cat => cat.id);
                    queryBuilder.andWhere('project.category_id IN (:...categoryIds)', {
                        categoryIds
                    });
                } else {
                    queryBuilder.andWhere('project.category_id = :categoryId', {
                        categoryId: category.id
                    });
                }
            }
        }
    
        if (query.status) {
            queryBuilder.andWhere('project.status = :status', { status: query.status });
        }
    
        if (query.tag) {
            queryBuilder.andWhere(':tag = ANY(project.tags)', { tag: query.tag });
        }
    
        if (query.sortBy) {
            switch (query.sortBy) {
                case 'createdAt':
                    queryBuilder.orderBy('project.createdAt', query.order);
                    break;
                case 'viewCount':
                    queryBuilder
                        .addSelect('COALESCE(stats.view_count, 0)', 'view_count_order')
                        .orderBy('view_count_order', query.order)
                        .addOrderBy('project.createdAt', 'DESC');
                    break;
                case 'likeCount':
                    queryBuilder
                        .addSelect('COALESCE(stats.like_count, 0)', 'like_count_order')
                        .orderBy('like_count_order', query.order)
                        .addOrderBy('project.createdAt', 'DESC');
                    break;
                default:
                    queryBuilder.orderBy('project.createdAt', 'DESC');
            }
        } else {
            queryBuilder.orderBy('project.createdAt', 'DESC');
        }
    
        this.logger.log('---------@@@--final query:', queryBuilder.getSql());
        this.logger.log('---------@@@--query parameters:', queryBuilder.getParameters());

        const total = await queryBuilder.getCount();
        const projects = await queryBuilder
            .skip((page - 1) * limit)
            .take(limit)
            .getMany();

        this.logger.log('---------@@@--found projects:', projects);

        // 각 프로젝트의 current_author_name을 현재 멤버의 닉네임으로 업데이트
        projects.forEach(project => {
            if (project.author) {
                project.current_author_name = project.author.nickname || project.author.email;
            }
        });

        return {
            data: this.projectMapper.toListDtoList(projects),
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    private async findProjectEntityByPublicId(public_id: string) {
        const project = await this.projectsRepository.findOne({
            where: { public_id },
            relations: ['category', 'meta', 'stats', 'author']
        });

        if (project && project.author) {
            project.current_author_name = project.author.nickname || project.author.email;
        }

        return project;
    }

    async findProjectByPublicId(public_id: string, member?: Member) {
        const projectEntity = await this.findProjectEntityByPublicId(public_id);
        if (!projectEntity) {
            throw new NotFoundException(`Project with ID "${public_id}" not found`);
        }

        if (!projectEntity.author || projectEntity.author.status === MemberStatus.WITHDRAWAL) {
            projectEntity.author = {
                ...projectEntity.author,
                nickname: '[withdrawn member]',
            } as Member;
            projectEntity.current_author_name = '[withdrawn member]';
        }

        const projectDetailResponseDto = this.projectMapper.toDto(projectEntity);
        this.logger.log('---------@@@--projectDetailResponseDto: ', projectDetailResponseDto);

        return projectDetailResponseDto;
    }

    async incrementViewCount(public_id: string): Promise<void> {
        const project = await this.projectsRepository.findOne({
            where: { public_id }
        });

        if (!project) {
            throw new NotFoundException(`Project with ID "${public_id}" not found`);
        }

        await this.projectsRepository.incrementViewCount(public_id);
    }

    async createProject(createProjectDto: CreateProjectDto, member: Member): Promise<ProjectDetailResponseDto> {
        let category: ProjectCategory | null = null;
        if (createProjectDto.categorySlug) {
            category = await this.categoryRepository.findOne({
                where: { slug: createProjectDto.categorySlug }
            });
            
            if (!category) {
                throw new NotFoundException(`Category with slug "${createProjectDto.categorySlug}" not found`);
            }
        }

        const projectEntity = this.projectMapper.toEntity(createProjectDto);
        
        if (category) {
            projectEntity.category = category;
        }

        const displayName = member.nickname || member.email;
        projectEntity.author = member;
        projectEntity.current_author_name = displayName;

        const savedProject = await this.projectsRepository.createProject(projectEntity);
        return this.projectMapper.toDto(savedProject);
    }

    async updateProject(public_id: string, updateProjectDto: UpdateProjectDto, member: Member): Promise<ProjectDetailResponseDto> {
        const projectEntity = await this.findProjectEntityByPublicId(public_id);
        if (!projectEntity) {
            throw new NotFoundException(`Project with ID "${public_id}" not found`);
        }

        if (projectEntity.author.id !== member.id) {
            throw new ForbiddenException('You are not authorized to update this project');
        }

        let category: ProjectCategory | null = null;
        if (updateProjectDto.categorySlug) {
            category = await this.categoryRepository.findOne({
                where: { slug: updateProjectDto.categorySlug }
            });
            
            if (!category) {
                throw new NotFoundException(`Category with slug "${updateProjectDto.categorySlug}" not found`);
            }
        }

        const updatedProject = this.projectMapper.updateEntity(projectEntity, updateProjectDto);
        updatedProject.current_author_name = member.nickname || member.email;

        if (category) {
            updatedProject.category = category;
        }

        const savedProject = await this.projectsRepository.updateProject(updatedProject);
        return this.projectMapper.toDto(savedProject);
    }

    async deleteProject(public_id: string, member: Member): Promise<void> {
        const projectEntity = await this.findProjectEntityByPublicId(public_id);
        if (!projectEntity) {
            throw new NotFoundException(`Project with ID "${public_id}" not found`);
        }

        if (projectEntity.author.id !== member.id) {
            throw new ForbiddenException('You are not authorized to delete this project');
        }

        await this.projectsRepository.deleteProject(public_id);
    }

    async updateAuthorDisplayNames(memberId: number, newDisplayName: string) {
        await this.projectsRepository.update(
            { author: { id: memberId } },
            { current_author_name: newDisplayName }
        );
    }
} 