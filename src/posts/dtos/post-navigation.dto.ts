// 게시글 상세 페이지에서 이전/다음 글 네비게이션 정보
import { IsArray, IsNumber, IsOptional, IsString } from "class-validator";
import { Type } from "class-transformer";

export class NavigationItemDto {
    @IsString()
    public_id: string;

    @IsString()
    title: string;

    @IsString()
    slug: string;

    @IsString()
    category: string;

    @Type(() => Date)
    created_at: Date;
}

export class PostNavigationDto {
    @IsOptional()
    @IsArray()
    prev: NavigationItemDto[];

    @IsOptional()
    @IsArray()
    next: NavigationItemDto[];

    @IsNumber()
    @Type(() => Number)
    limit: number = 5; // 앞뒤로 각각 몇 개씩 가져올지 설정
}