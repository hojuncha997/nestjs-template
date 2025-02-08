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
       const entity = new Guestbook();
       
       // 필수 필드
       entity.title = dto.title;
       entity.content = dto.content;
    //    guestbook.author = dto.author;

       // 슬러그 생성 로직
       if (dto.title) {
           console.log('Creating slug from title:', dto.title);  // 원본 타이틀
           const slug = dto.title
               .trim()
               .replace(/\s+/g, '-')  // 먼저 공백을 하이픈으로
               .replace(/[^\w\-\u3131-\u318E\uAC00-\uD7A3]/g, '')  // 한글(자음/모음 포함), 영문, 숫자, 하이픈만 허용
               .toLowerCase()
               .replace(/-+/g, '-')   // 중복 하이픈 제거
               .replace(/^-+|-+$/g, '')  // 시작과 끝의 하이픈 제거
               .substring(0, 100);
           
           console.log('Generated slug:', slug);  // 생성된 슬러그
           entity.slug = slug;
       } else if (dto.slug) {
           entity.slug = dto.slug;
       }

       // 선택적 필드들은 undefined 체크
       if (dto.category) {
           entity.category = dto.category;
       }

       if (dto.isSecret) {
           entity.isSecret = dto.isSecret;
       }
       
       if (dto.tags) {
           entity.tags = dto.tags;
       }

       if (dto.thumbnail) {
           entity.thumbnail = dto.thumbnail;
       }

       // 기본값이 있는 필드들
       entity.status = dto.status || GuestbookStatus.PUBLISHED;
       entity.isFeatured = dto.isFeatured || false;

       return entity;
   }

   toDto(entity: Guestbook): GuestbookResponseDto {
       const dto = new GuestbookResponseDto();
       
       // 기본 필드
       // dto.id = entity.id;
       dto.public_id = entity.public_id;
       dto.title = entity.title;
       dto.content = entity.content;
    //    dto.author_id = entity.author_id;
    //    dto.author_display_name = entity.author_display_name;
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