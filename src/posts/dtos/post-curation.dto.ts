import { CurationType } from '@common/enums/curation-type.enum';
import { IsBoolean, IsOptional, IsString, IsNumber, IsEnum, IsArray } from 'class-validator';

export class PostCurationDto {
    @IsOptional()
    @IsBoolean()
    isCurated: boolean;

    @IsOptional()
    @IsString()
    curatedAt: string | null;

    @IsOptional()
    @IsString()
    curatedBy: string | null;

    @IsOptional()
    @IsNumber()
    curationOrder: number;

    @IsOptional()
    @IsArray()
    @IsEnum(CurationType, { each: true })
    curationType: CurationType[];

    @IsOptional()
    @IsString()
    curationNote?: string;

    @IsOptional()
    @IsString()
    curationStartDate?: string | null;

    @IsOptional()
    @IsString()
    curationEndDate?: string | null;
}

// PostDetailResponseDto에서
// export class PostDetailResponseDto {
//     // ... 다른 필드들
//     isCurated: boolean;
//     curatedAt: string | null;
//     curatedBy: string | null;
//     curationOrder: number;
//     curationType: CurationType[];
//     curationNote?: string;
//     curationStartDate?: string | null;
//     curationEndDate?: string | null;
// } 