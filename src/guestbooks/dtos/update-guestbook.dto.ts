import { IsOptional, IsString, IsObject, IsArray, IsBoolean, IsEnum, IsNumber, Allow } from 'class-validator';
import { GuestbookStatus } from '@common/enums/guestbook-status.enum';

export class UpdateGuestbookDto {
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
    @IsEnum(GuestbookStatus)
    status?: GuestbookStatus;

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