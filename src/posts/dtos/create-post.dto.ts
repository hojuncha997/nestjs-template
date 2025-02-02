import { IsNotEmpty, IsString, IsObject, IsOptional, IsArray, IsBoolean, IsEnum } from 'class-validator';
import { PostStatus } from '@common/enums/post-status.enum';

export class CreatePostDto {
    @IsNotEmpty()
    @IsString()
    title: string;

    @IsNotEmpty()
    @IsObject()
    content: Record<string, any>;

    @IsNotEmpty()
    @IsString()
    author: string;

    @IsOptional()
    @IsString()
    category?: string = 'uncategorized';

    @IsOptional()
    @IsString()
    slug?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    tags?: string[] = [];  // 타입을 string[]로 변경하고 기본값 설정. db저장 시에는 json형태로 저장됨


    @IsOptional()
    @IsString()
    thumbnail?: string;
    //추후 아래와 같이 메타데이터까지 추가하는 방식으로 변경
    // thumbnail: {
    //     url: string;
    //     fileName: string;
    //     size: number;
    //     width: number;
    //     height: number;
    //     mimeType: string;
    // }

    @IsOptional()
    @IsBoolean()
    isFeatured?: boolean = false;

    @IsOptional()
    @IsEnum(PostStatus)
    status?: PostStatus = PostStatus.DRAFT;
}