// src/posts/dto/update-post.dto.ts

import { IsOptional, IsString, IsObject, IsArray, IsBoolean, IsEnum, ValidateNested } from 'class-validator';
import { PostStatus } from '@common/enums/post-status.enum';
import { Type } from 'class-transformer';
import { CurationDto } from './curation.dto';

export class UpdatePostDto {
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
    @IsString()
    category?: string;

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
    @IsEnum(PostStatus)
    status?: PostStatus;

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

    @IsOptional()
    @ValidateNested()
    @Type(() => CurationDto)
    curation?: Partial<CurationDto>;
}