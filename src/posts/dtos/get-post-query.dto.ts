import { IsOptional, IsInt, IsString, Min, Max, IsISO8601 } from 'class-validator';
import { Type } from 'class-transformer';
import { PostStatus } from '@common/enums/post-status.enum';
import { QUERY_CONSTANTS } from '@common/constants/query-constants.contant';
import { MaxDateRange } from '@common/custom-validators/max-date-range';

export class GetPostsQueryDto {
    @IsOptional()
    @IsInt()
    @Min(1)
    @Type(() => Number)
    page?: number = QUERY_CONSTANTS.DEFAULT_QUERY_PAGE;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(QUERY_CONSTANTS.MAX_QUERY_LIMIT)
    @Type(() => Number)
    limit?: number = QUERY_CONSTANTS.DEFAULT_QUERY_LIMIT;

    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsString()
    category?: string;

    @IsOptional()
    @IsString()
    status?: PostStatus;

    @IsOptional()
    @IsString()
    sortBy?: 'createdAt' | 'viewCount' | 'likeCount';

    @IsOptional()
    @IsString()
    order?: 'ASC' | 'DESC' = 'DESC';

    @IsOptional()
    @IsString()
    tag?: string;

    @IsOptional()
    // @IsString()
    @IsISO8601() // ISO 8601 형식(YYYY-MM-DD)
    startDate?: string;

    @IsOptional()
    @IsISO8601()
    @MaxDateRange('startDate', {
        // message: '종료일은 시작일로부터 1년을 초과할 수 없습니다'
    })
    endDate?: string;
}
