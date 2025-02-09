// src/posts/mappers/post.mapper.ts

import { Injectable } from '@nestjs/common';
import { Post } from '../entities/post.entity';
import { CreatePostDto } from '../dtos/create-post.dto';
import { PostResponseDto } from '../dtos/post-response.dto'
import { PostStatus } from '@common/enums/post-status.enum';
import { UpdatePostDto } from '../dtos/update-post.dto';

@Injectable()
export class PostMapper {
   toEntity(dto: CreatePostDto): Post {
       const entity = new Post();
       
       // 필수 필드
       entity.title = dto.title;
       entity.content = dto.content;

       // 슬러그 생성 로직
       if (dto.title) {
           const slug = dto.title
               .trim()
               .replace(/\s+/g, '-')
               .replace(/[^\w\-가-힣]/g, '')
               .toLowerCase()
               .replace(/-+/g, '-')
               .replace(/^-+|-+$/g, '')
               .substring(0, 100);
           
           entity.slug = slug;
       } else if (dto.slug) {
           entity.slug = dto.slug;
       }

       // 선택적 필드들은 undefined 체크
       if (dto.category) {
           entity.category = dto.category;
       }
       
       if (dto.tags) {
           entity.tags = dto.tags;
       }

       if (dto.thumbnail) {
           entity.thumbnail = dto.thumbnail;
       }

       // 기본값이 있는 필드들
       entity.status = dto.status || PostStatus.PUBLISHED;
       entity.isFeatured = dto.isFeatured || false;

       return entity;
   }

   toDto(entity: Post): PostResponseDto {
       const dto = new PostResponseDto();
       
       // 기본 필드
       dto.public_id = entity.public_id;
       dto.title = entity.title;
       dto.content = entity.content;
       dto.author_display_name = entity.author_display_name;
       dto.current_author_name = entity.current_author_name;
       dto.isSecret = entity.isSecret;
       dto.category = entity.category;
       dto.slug = entity.slug;
       dto.tags = entity.tags;
       dto.thumbnail = entity.thumbnail;
       dto.status = entity.status;
       dto.isFeatured = entity.isFeatured;
       
       // 메타 필드
       dto.createdAt = entity.createdAt;
       dto.updatedAt = entity.updatedAt;
       dto.viewCount = entity.viewCount;
       dto.likeCount = entity.likeCount;
       dto.commentCount = entity.commentCount;

       return dto;
   }

   toDtoList(entities: Post[]): PostResponseDto[] {
       return entities.map(entity => this.toDto(entity));
   }

   updateEntity(entity: Post, dto: UpdatePostDto): Post {
        // 존재하는 필드만 업데이트
        if (dto.title !== undefined) entity.title = dto.title;
        if (dto.content !== undefined) entity.content = dto.content;
        if (dto.category !== undefined) entity.category = dto.category;
        if (dto.slug !== undefined) entity.slug = dto.slug;
        if (dto.tags !== undefined) entity.tags = dto.tags;
        if (dto.thumbnail !== undefined) entity.thumbnail = dto.thumbnail;
        if (dto.isFeatured !== undefined) entity.isFeatured = dto.isFeatured;
        if (dto.status !== undefined) entity.status = dto.status;
        if (dto.isSecret !== undefined) entity.isSecret = dto.isSecret;

        return entity;
    }
}