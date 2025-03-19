import { IsOptional, IsString, IsObject, IsArray, IsBoolean, IsEnum, IsNumber, Allow } from 'class-validator';
import { ProjectStatus } from '@common/enums/project-status.enum';

export class UpdateProjectDto {
    @IsOptional()
    @IsString()
    title?: string;

    @IsOptional()
    @IsObject()
    content?: Record<string, any>;

    @IsOptional()
    @IsString()
    author?: string;

    @IsOptional()
    @IsNumber()
    categoryId?: number;

    @IsOptional()
    @IsString()
    slug?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    tags?: string[];

    @IsOptional()
    @IsString()
    thumbnail?: string;

    @IsOptional()
    @IsBoolean()
    isFeatured?: boolean;

    @IsOptional()
    @IsEnum(ProjectStatus)
    status?: ProjectStatus;

    @IsOptional()
    @IsBoolean()
    isSecret?: boolean;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    coverImageAlt?: string;

    @IsOptional()
    @IsString()
    metaDescription?: string;

    @Allow()
    @IsOptional()
    @IsString()
    categorySlug?: string;
} 