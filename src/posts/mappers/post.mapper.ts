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
       const post = new Post();
       
       // 필수 필드
       post.title = dto.title;
       post.content = dto.content;
       post.author = dto.author;

       // 선택적 필드들은 undefined 체크
       if (dto.category) {
           post.category = dto.category;
       }
       
       if (dto.slug) {
           post.slug = dto.slug;
       }

       if (dto.tags) {
           post.tags = dto.tags;
       }

       if (dto.thumbnail) {
           post.thumbnail = dto.thumbnail;
       }

       // 기본값이 있는 필드들
       post.status = dto.status || PostStatus.DRAFT;
       post.isFeatured = dto.isFeatured || false;

       return post;
   }

   toDto(entity: Post): PostResponseDto {
       const dto = new PostResponseDto();
       
       // 기본 필드
       // dto.id = entity.id;
       dto.uuid = entity.uuid;
       dto.title = entity.title;
       dto.content = entity.content;
       dto.author = entity.author;
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

   // 목록 조회 등에서 활용할 수 있는 배열 변환 메서드
   toDtoList(entities: Post[]): PostResponseDto[] {
       return entities.map(entity => this.toDto(entity));
   }

   // 업데이트 시 사용할 수 있는 엔티티 업데이트 메서드
   updateEntity(entity: Post, dto: UpdatePostDto): Post {
        // 존재하는 필드만 업데이트
        if (dto.title !== undefined) entity.title = dto.title;
        if (dto.content !== undefined) entity.content = dto.content;
        if (dto.author !== undefined) entity.author = dto.author;
        if (dto.category !== undefined) entity.category = dto.category;
        if (dto.slug !== undefined) entity.slug = dto.slug;
        if (dto.tags !== undefined) entity.tags = dto.tags;
        if (dto.thumbnail !== undefined) entity.thumbnail = dto.thumbnail;
        if (dto.isFeatured !== undefined) entity.isFeatured = dto.isFeatured;
        if (dto.status !== undefined) entity.status = dto.status;

        return entity;
    }
}