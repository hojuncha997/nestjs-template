// src/members/dto/withdraw-request.dto.ts
// 탈퇴 요청 DTO
import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { WithdrawalReason } from '@common/enums';

export class WithdrawRequestDto {
  @ApiProperty({
    enum: WithdrawalReason,
    description: '탈퇴 사유',
    example: WithdrawalReason.NO_LONGER_NEEDED
  })
  @IsEnum(WithdrawalReason)
  reason: WithdrawalReason;

  @ApiProperty({
    description: '상세 사유 (선택)',
    required: false,
    example: '더 이상 서비스가 필요하지 않아서 탈퇴합니다.'
  })
  @IsString()
  @IsOptional()
  detail?: string;
}