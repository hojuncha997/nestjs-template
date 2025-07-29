/**
 * 비밀번호 재설정 DTO
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength, Matches } from 'class-validator';
import { PASSWORD_POLICY, PASSWORD_VALIDATION_MESSAGE } from '@common/constants/password-policy.constant';

export class ResetPasswordDto {
  @ApiProperty({
    description: '비밀번호 재설정 토큰',
    required: true
  })
  @IsString()
  token: string;

  @ApiProperty({
    description: '새 비밀번호',
    required: true
  })
  @IsString()
  @MinLength(PASSWORD_POLICY.MIN_LENGTH, { message: PASSWORD_VALIDATION_MESSAGE.MIN_LENGTH })
  @MaxLength(PASSWORD_POLICY.MAX_LENGTH, { message: PASSWORD_VALIDATION_MESSAGE.MAX_LENGTH })
  @Matches(PASSWORD_POLICY.PATTERNS.UPPERCASE, { message: PASSWORD_VALIDATION_MESSAGE.REQUIRE_UPPERCASE })
  @Matches(PASSWORD_POLICY.PATTERNS.LOWERCASE, { message: PASSWORD_VALIDATION_MESSAGE.REQUIRE_LOWERCASE })
  @Matches(PASSWORD_POLICY.PATTERNS.NUMBER, { message: PASSWORD_VALIDATION_MESSAGE.REQUIRE_NUMBER })
  @Matches(PASSWORD_POLICY.PATTERNS.SPECIAL_CHAR, { message: PASSWORD_VALIDATION_MESSAGE.REQUIRE_SPECIAL_CHAR })
  newPassword: string;
} 