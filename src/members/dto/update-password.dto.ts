// src/members/dto/update-password.dto.ts
// 로그인 이후 비밀번호 변경 시 사용

import { IsString, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePasswordDto {
    @ApiProperty({
        description: '현재 비밀번호',
        example: 'currentPassword123'
    })
    @IsString()
    @IsNotEmpty()
    currentPassword: string;
  
    @ApiProperty({
        description: '새 비밀번호 (8자 이상)',
        example: 'newPassword123'
    })
    @IsString()
    @IsNotEmpty()
    @MinLength(8)
    newPassword: string;
  
    // @ApiProperty({
    //     description: '새 비밀번호 확인',
    //     example: 'newPassword123'
    // })
    // @IsString()
    // @IsNotEmpty()
    // confirmPassword: string;
}