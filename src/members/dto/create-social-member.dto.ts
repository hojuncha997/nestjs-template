import { IsEmail, IsEnum, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AuthProvider, MemberStatus, Role } from '@common/enums';

export class CreateSocialMemberDto {
  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty({ enum: AuthProvider })
  @IsEnum(AuthProvider)
  provider: AuthProvider;

  @ApiProperty()
  @IsString()
  providerId: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  profileImage?: string;

  @ApiProperty({ enum: MemberStatus })
  @IsEnum(MemberStatus)
  status: MemberStatus;

  @ApiProperty({ enum: Role })
  @IsEnum(Role)
  role: Role;

  @ApiProperty({
    example: {
      language: 'ko',
      timezone: 'Asia/Seoul',
      theme: 'light'
    }
  })
  preferences: {
    language: string;
    timezone: string;
    theme: string;
  };

    @ApiProperty({ required: false })
    @ApiProperty()
    socialProfile?: {
      id: string;
      email?: string;
      name?: string;
      profileUrl?: string;
    };
} 