// src/guestbook/dto/update-guestbook.dto.ts

import { IsString, IsObject, IsOptional, IsArray, IsBoolean, IsEnum } from 'class-validator';
import { GuestbookStatus } from '@common/enums/guestbook-status.enum';
import { PartialType } from '@nestjs/mapped-types';
import { CreateGuestbookDto } from './create-guestbook.dto';

export class UpdateGuestbookDto extends PartialType(CreateGuestbookDto) {
   @IsOptional()
   @IsString()
   title?: string;

   @IsOptional()
   @IsObject()
   content?: Record<string, any>;

   // @IsOptional()
   // @IsString()
   // author?: string;

   @IsOptional()
   @IsBoolean()
   isSecret?: boolean;

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
   @IsEnum(GuestbookStatus)
   status?: GuestbookStatus;
}