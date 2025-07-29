import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUrl, Matches, ValidateIf } from 'class-validator';
import { FILE_CONSTANTS } from '@common/constants/file.constants';

export class UpdateProfileImageDto {
  @ApiProperty({ 
    description: '프로필 이미지 URL',
    example: 'https://example.com/profile.jpg'
  })
  @IsString()
  @IsNotEmpty()
  @IsUrl({ protocols: ['http', 'https'] })
  @Matches(
    /\.(jpg|jpeg|png|gif)$/i,
    { message: '지원되는 이미지 형식: JPG, JPEG, PNG, GIF' }
  )
  @ValidateIf((o) => o.profileImage)
  profileImage: string;

  @ApiProperty({ 
    description: '이미지 크기 (bytes)',
    example: 1024000
  })
  @IsNotEmpty()
  @ValidateIf((o) => o.size)
  size: number;

  @ApiProperty({ 
    description: '이미지 MIME 타입',
    example: 'image/jpeg'
  })
  @IsString()
  @IsNotEmpty()
  @ValidateIf((o) => o.mimeType)
  mimeType: string;
} 