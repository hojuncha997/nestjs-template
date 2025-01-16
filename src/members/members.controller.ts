// src/members/members.controller.ts
// 멤버 컨트롤러: HTTP 요청을 처리하고 응답을 반환하는 컨트롤러
// RESTful API 엔드포인트 정의 및 요청/응답 처리

import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query,
  HttpStatus,
  HttpCode,
  ParseUUIDPipe,
  UseGuards,
  Request
} from '@nestjs/common';
import { MembersService } from './members.service';
import { CreateMemberDto,  UpdateMemberDto, MemberResponseDto, CreateSocialMemberDto } from './dto';
import { EmailVerificationResponse } from './types/email-verification-response.type';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';


@ApiTags('members')
@Controller('members')
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiOperation({ summary: '내 정보 조회' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: '내 정보 조회 성공', 
    type: MemberResponseDto 
  })
  async getProfile(@Request() req) {
    return this.membersService.findOneByUuid(req.user.uuid);
  }

  /**
   * 회원 생성
   */
  @Post()
  @ApiOperation({
    summary: '회원 가입',
    description: '새로운 회원을 등록합니다.',
  })
  @ApiResponse({
    status: 201,
    description: '회원가입 성공',
    schema: {
      example: {
        id: 1,
        email: 'user@example.com',
        name: 'John Doe',
        createdAt: '2024-03-20T12:00:00Z',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: '잘못된 요청 (이메일 형식 오류, 비밀번호 불일치 등)',
  })
  @ApiResponse({
    status: 409,
    description: '이미 존재하는 이메일',
  })
  async create(@Body() createMemberDto: CreateMemberDto) {
    return this.membersService.create(createMemberDto);
  }

  /**
   * UUID로 회원 조회
   */
  @Get(':uuid')
  @ApiOperation({ summary: '회원 정보 조회' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: '회원 정보 조회 성공', 
    type: MemberResponseDto 
  })
  async findOne(
    @Param('uuid', ParseUUIDPipe) uuid: string
  ): Promise<MemberResponseDto> {
    return this.membersService.findOneByUuid(uuid);
  }

  /**
   * 회원 정보 수정
   */
  @Put(':uuid')
  @ApiOperation({ summary: '회원 정보 수정' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: '회원 정보 수정 성공', 
    type: MemberResponseDto 
  })
  async update(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Body() updateMemberDto: UpdateMemberDto
  ): Promise<MemberResponseDto> {
    return this.membersService.update(uuid, updateMemberDto);
  }

  /**
   * 회원 삭제 (소프트 삭제)
   */
  @Delete(':uuid')
  @ApiOperation({ summary: '회원 탈퇴' })
  @ApiResponse({ 
    status: HttpStatus.NO_CONTENT, 
    description: '회원 탈퇴 성공' 
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('uuid', ParseUUIDPipe) uuid: string): Promise<void> {
    await this.membersService.withdrawMember(uuid);
  }

  /**
   * 이메일 인증
   */
  @Post('verify-email')
  @ApiOperation({ summary: '이메일 인증' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: '이메일 인증 성공', 
  })
  async verifyEmail(
    @Body('token') token: string
  ): Promise<EmailVerificationResponse> {
    return this.membersService.verifyEmail(token);
  }

  /**
   * 비밀번호 재설정 토큰 생성
   */
  @Post('password-reset')
  @ApiOperation({ summary: '비밀번호 재설정 토큰 발급' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: '비밀번호 재설정 토큰 발급 성공', 
    type: MemberResponseDto 
  })
  async createPasswordResetToken(
    @Body('email') email: string
  ): Promise<MemberResponseDto> {
    return this.membersService.createPasswordResetToken(email);
  }

  /**
   * 포인트 업데이트
   */
  @Put(':uuid/points')
  @ApiOperation({ summary: '포인트 수정' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: '포인트 수정 성공', 
    type: MemberResponseDto 
  })
  async updatePoints(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Body('pointType') pointType: 'purchase' | 'reward',
    @Body('amount') amount: number
  ): Promise<MemberResponseDto> {
    return this.membersService.updatePoints(uuid, pointType, amount);
  }

  @Post('social/signup')
  @ApiOperation({ summary: '소셜 회원가입' })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: '소셜 회원가입 성공', 
    type: MemberResponseDto 
  })
  async socialSignup(
    @Body() createSocialMemberDto: CreateSocialMemberDto
  ): Promise<MemberResponseDto> {
    return this.membersService.createSocialMember(createSocialMemberDto);
  }

} 