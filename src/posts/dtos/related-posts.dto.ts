// 게시글 상세 페이지에서 관련 게시글 조회 시 사용

import { IsArray, IsInt, IsOptional, IsString, Max, Min } from "class-validator";
import { Type } from "class-transformer";

export class RelatedPostsDto {
    @IsOptional()
    @IsInt()
    @Type(() => Number)
    @Min(1)
    @Max(10)
    limit?: number = 5;
  
    @IsOptional()
    @IsString()
    category?: string;
  
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    tags?: string[];
  }
  