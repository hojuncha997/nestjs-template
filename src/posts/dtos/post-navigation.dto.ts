// 게시글 목록 조회 시 추가로 보여줄 포스팅 네비게이션 정보

import { IsString } from "class-validator";

export class PostNavigationDto {
    @IsString()
    category: string;

}