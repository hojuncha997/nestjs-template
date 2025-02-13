import { IsBoolean, IsDateString, IsEnum, IsNumber, IsOptional, IsString, IsArray } from 'class-validator';
import { CurationType } from '@common/enums/curation-type.enum';

export class CurationDto {
    @IsOptional()
    @IsBoolean()
    isCurated?: boolean;

    @IsOptional()
    @IsDateString()
    curatedAt?: string;

    @IsOptional()
    @IsString()
    curatedBy?: string;

    @IsOptional()
    @IsNumber()
    curationOrder?: number;

    @IsOptional()
    @IsArray()
    @IsEnum(CurationType, { each: true })
    curationType?: CurationType[];

    @IsOptional()
    @IsString()
    curationNote?: string;

    @IsOptional()
    @IsDateString()
    curationStartDate?: string;

    @IsOptional()
    @IsDateString()
    curationEndDate?: string;
} 