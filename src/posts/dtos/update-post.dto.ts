// src/posts/dto/update-post.dto.ts

import { IsOptional, IsString, IsObject, IsArray, IsBoolean, IsEnum, ValidateNested, IsNumber, Allow } from 'class-validator';
import { PostStatus } from '@common/enums/post-status.enum';
// import { Type } from 'class-transformer';
// import { CurationDto } from './curation.dto';
// import { CurationType } from '@common/enums/curation-type.enum';
// import { PostCurationDto } from './post-curation.dto';

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

    @Allow()
    @IsOptional()
    @IsString()
    categorySlug?: string;

    // @IsOptional()
    // @ValidateNested()
    // @Type(() => PostCurationDto)
    // curation?: Partial<PostCurationDto>;

    // @IsOptional()
    // @IsBoolean()
    // isCurated?: boolean;

    // @IsOptional()
    // @IsString()
    // curatedAt?: string | null;

    // @IsOptional()
    // @IsString()
    // curatedBy?: string | null;

    // @IsOptional()
    // @IsNumber()
    // curationOrder?: number;

    // @IsOptional()
    // @IsArray()
    // @IsEnum(CurationType)
    // curationType?: CurationType[];

    // @IsOptional()
    // @IsString()
    // curationNote?: string;

    // @IsOptional()
    // @IsString()
    // curationStartDate?: string | null;

    // @IsOptional()
    // @IsString()
    // curationEndDate?: string | null;
}