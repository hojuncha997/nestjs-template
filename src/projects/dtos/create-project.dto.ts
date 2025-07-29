import { IsNotEmpty, IsString, IsObject, IsOptional, IsArray, IsBoolean, IsEnum } from 'class-validator';
import { ProjectStatus } from '@common/enums/project-status.enum';

export class CreateProjectDto {
    @IsNotEmpty()
    @IsString()
    title: string;

    @IsNotEmpty()
    @IsObject()
    content: Record<string, any>;

    @IsOptional()
    @IsString()
    categorySlug?: string;

    @IsOptional()
    @IsString()
    slug?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    tags?: string[] = [];

    @IsOptional()
    @IsString()
    thumbnail?: string;

    @IsOptional()
    @IsBoolean()
    isFeatured?: boolean = false;

    @IsOptional()
    @IsEnum(ProjectStatus)
    status?: ProjectStatus = ProjectStatus.PUBLISHED;

    @IsOptional()
    @IsBoolean()
    isSecret?: boolean = false;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    coverImageAlt?: string;

    @IsOptional()
    @IsString()
    metaDescription?: string;
} 