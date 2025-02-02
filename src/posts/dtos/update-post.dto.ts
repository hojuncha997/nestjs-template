// src/posts/dto/update-post.dto.ts

import { IsString, IsObject, IsOptional, IsArray, IsBoolean, IsEnum } from 'class-validator';
import { PostStatus } from '@common/enums/post-status.enum';
import { PartialType } from '@nestjs/mapped-types';
import { CreatePostDto } from './create-post.dto';

export class UpdatePostDto extends PartialType(CreatePostDto) {
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
}