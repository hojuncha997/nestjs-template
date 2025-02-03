// src/guestbook/mappers/guestbook.mapper.ts

import { Injectable } from '@nestjs/common';
import { Guestbook } from '../entities/guestbook.entity';
import { CreateGuestbookDto } from '../dtos/create-guestbook.dto';
import { GuestbookResponseDto } from '../dtos/guestbook-response.dto'
import { GuestbookStatus } from '@common/enums/guestbook-status.enum';
import { UpdateGuestbookDto } from '../dtos/update-guestbook.dto';
@Injectable()
export class GuestbookMapper {
   toEntity(dto: CreateGuestbookDto): Guestbook {
       const guestbook = new Guestbook();
       
       // 필수 필드
       guestbook.title = dto.title;
       guestbook.content = dto.content;
    //    guestbook.author = dto.author;

       // 선택적 필드들은 undefined 체크
       if (dto.category) {
           guestbook.category = dto.category;
       }

       if (dto.isSecret) {
           guestbook.isSecret = dto.isSecret;
       }
       
       if (dto.slug) {
           guestbook.slug = dto.slug;
       }

       if (dto.tags) {
           guestbook.tags = dto.tags;
       }

       if (dto.thumbnail) {
           guestbook.thumbnail = dto.thumbnail;
       }

       // 기본값이 있는 필드들
       guestbook.status = dto.status || GuestbookStatus.PUBLISHED;
       guestbook.isFeatured = dto.isFeatured || false;

       return guestbook;
   }

   toDto(entity: Guestbook): GuestbookResponseDto {
       const dto = new GuestbookResponseDto();
       
       // 기본 필드
       // dto.id = entity.id;
       dto.uuid = entity.uuid;
       dto.title = entity.title;
       dto.content = entity.content;
    //    dto.author_display_name = entity.author.nickname || entity.author.email;
       dto.author_display_name = entity.current_author_name;
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

   // 목록 조회 등에서 활용할 수 있는 배열 변환 메서드
   toDtoList(entities: Guestbook[]): GuestbookResponseDto[] {
       return entities.map(entity => this.toDto(entity));
   }

   // 업데이트 시 사용할 수 있는 엔티티 업데이트 메서드
   updateEntity(entity: Guestbook, dto: UpdateGuestbookDto): Guestbook {
        // 존재하는 필드만 업데이트
        if (dto.title !== undefined) entity.title = dto.title;
        if (dto.content !== undefined) entity.content = dto.content;
        // if (dto.author !== undefined) entity.author = dto.author;
        if (dto.isSecret !== undefined) entity.isSecret = dto.isSecret;
        if (dto.category !== undefined) entity.category = dto.category;
        if (dto.slug !== undefined) entity.slug = dto.slug;
        if (dto.tags !== undefined) entity.tags = dto.tags;
        if (dto.thumbnail !== undefined) entity.thumbnail = dto.thumbnail;
        if (dto.isFeatured !== undefined) entity.isFeatured = dto.isFeatured;
        if (dto.status !== undefined) entity.status = dto.status;

        return entity;
    }
}