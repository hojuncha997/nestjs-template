import { IsString, IsNotEmpty, IsOptional, IsNumber, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCommentDto {
  @ApiProperty({ description: '댓글 내용', example: '좋은 글 감사합니다!' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(1000)
  content: string;

  @ApiProperty({ description: '부모 댓글 ID (대댓글인 경우)', example: 1, required: false })
  @IsOptional()
  @IsNumber()
  parentCommentId?: number;
}