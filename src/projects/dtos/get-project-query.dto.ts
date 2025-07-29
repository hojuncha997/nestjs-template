import { IsOptional, IsInt, IsString, Min, Max, IsISO8601 } from 'class-validator';
import { Type } from 'class-transformer';
import { ProjectStatus } from '@common/enums/project-status.enum';
import { QUERY_CONSTANTS } from '@common/constants/query-constants.contant';
import { MaxDateRange } from '@common/custom-validators/max-date-range';

export class GetProjectsQueryDto {
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
    categorySlug?: string;

    @IsOptional()
    @IsString()
    status?: ProjectStatus;

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
    @IsISO8601()
    startDate?: string;

    @IsOptional()
    @IsISO8601()
    @MaxDateRange('startDate')
    endDate?: string;
} 