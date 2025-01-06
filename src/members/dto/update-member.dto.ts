// src/members/dto/update-member.dto.ts
// 멤버 수정 DTO: 회원 정보 업데이트 시 사용되는 데이터 정의
// CreateMemberDto를 상속받아 모든 필드를 선택적으로 만듦

import { CreateMemberDto } from './create-member.dto';
import { ApiProperty,PartialType }from '@nestjs/swagger';
import { IsOptional, IsString, IsObject } from 'class-validator';

export class UpdateMemberDto extends PartialType(CreateMemberDto) {
    // @IsOptional()
    // @IsString()
    // @ApiProperty({ 
    //     example: "새로운닉네임", 
    //     description: "변경할 닉네임",
    //     required: false 
    // })
    // nickname?: string;

    @IsOptional()
    @IsObject()
    @ApiProperty({ 
        example: {
            "email": true,
            "push": false,
            "sms": true,
            "marketing": false,
            "inApp": true
        },
        description: "알림 설정",
        required: false 
    })
    notificationSettings?: {
        email: boolean;
        push: boolean;
        sms: boolean;
        marketing: boolean;
        inApp: boolean;
    };

    @ApiProperty({ 
        example: "newPassword123!", 
        description: "새 비밀번호 (로컬 로그인 사용자만)",
        required: false 
    })
    password?: string;
} 