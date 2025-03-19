import { Controller, Get, Post, Put, Delete, Param, Body, Query, BadRequestException, DefaultValuePipe, ParseIntPipe, Logger } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dtos/create-project.dto';
import { UpdateProjectDto } from './dtos/update-project.dto';
import { GetProjectsQueryDto } from './dtos/get-project-query.dto';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';
import { UseGuards } from '@nestjs/common';
import { Public } from '@decorators/auth/public.decorator';
import { GetMember } from '@decorators/auth/get-member.decorator';
import { Member } from '@members/entities/member.entity';
import { ProjectListResponseDto } from './dtos/project-list-response.dto';
import { ListResponse } from '@common/types/list-response.types';

@Controller('projects')
export class ProjectsController {
    private readonly logger = new Logger(ProjectsController.name);
    constructor(private readonly projectsService: ProjectsService) {}

    @Public()
    @Get()
    async getProjects(@Query() query: GetProjectsQueryDto): Promise<ListResponse<ProjectListResponseDto>> {
        this.logger.log('---------!!!--프로젝트 목록 조회');
        const result = await this.projectsService.findProjectList(query);
        return result;
    }

    @Get(':slugAndId')
    @Public()
    @UseGuards(JwtAuthGuard)
    async getProject(
        @Param('slugAndId') slugAndId: string,
        @GetMember(true) member: Member | null
    ) {
        const requestId = Date.now();
        this.logger.log(`---------!!!--프로젝트 상세 조회 Request ID: ${requestId}`);
        this.logger.log('---------!!!--member:', member);

        const decodedSlugAndId = decodeURIComponent(slugAndId);
        const lastHyphenIndex = decodedSlugAndId.lastIndexOf('-');
        const publicId = decodedSlugAndId.substring(lastHyphenIndex + 1);
        
        if (!publicId?.match(/^[a-z0-9]{10}$/i)) {
            throw new BadRequestException('Invalid public_id format');
        }

        return await this.projectsService.findProjectByPublicId(publicId, member);
    }

    @UseGuards(JwtAuthGuard)
    @Post()
    async createProject(
        @GetMember() member: Member,
        @Body() project: CreateProjectDto
    ) {
        return await this.projectsService.createProject(project, member);
    }

    @UseGuards(JwtAuthGuard)
    @Put(':public_id')
    async updateProject(
        @GetMember() member: Member,
        @Param('public_id') public_id: string,
        @Body() project: UpdateProjectDto
    ) {
        const decodedPublicId = decodeURIComponent(public_id);
        
        if (!decodedPublicId?.match(/^[a-z0-9]{10}$/i)) {
            throw new BadRequestException('Invalid public_id format');
        }
        this.logger.log('---------!!!--프로젝트 수정');
        this.logger.log('---------!!!--public_id:', public_id);
        this.logger.log('---------!!!--member:', member.email);

        return await this.projectsService.updateProject(public_id, project, member);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':public_id')
    async deleteProject(
        @GetMember() member: Member,
        @Param('public_id') public_id: string
    ) {
        const decodedPublicId = decodeURIComponent(public_id);
        
        if (!decodedPublicId?.match(/^[a-z0-9]{10}$/i)) {
            throw new BadRequestException('Invalid public_id format');
        }

        this.logger.log('---------!!!--프로젝트 삭제');
        this.logger.log('---------!!!--public_id:', public_id);
        this.logger.log('---------!!!--member:', member.email);
        return await this.projectsService.deleteProject(decodedPublicId, member);
    }
} 