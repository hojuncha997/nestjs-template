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
  Request,
  ForbiddenException,
  BadRequestException,
  ValidationPipe,
  UnauthorizedException
} from '@nestjs/common';
import { MembersService } from './members.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';
import { MemberStatus } from '@common/enums';
import { EmailVerificationResponse } from './types/email-verification-response.type';
import { CreateMemberDto,  UpdateMemberDto, MemberResponseDto, CreateSocialMemberDto, WithdrawRequestDto, ResetPasswordDto, PasswordResetTokenResponseDto, UpdatePasswordDto } from './dto';

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
  @Delete('withdraw')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '회원 탈퇴' })
  @ApiResponse({ 
    status: HttpStatus.NO_CONTENT, 
    description: '회원 탈퇴 성공' 
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  async withdraw(@Request() req, @Body() withdrawRequestDto: WithdrawRequestDto): Promise<void> {
    const member = await this.membersService.findOneByUuidAsEntity(req.user.uuid);
    
    // 이미 탈퇴한 회원인지 체크
    if (member.status === MemberStatus.WITHDRAWAL) {
      throw new BadRequestException('이미 탈퇴한 회원입니다.');
    }

    await this.membersService.withdrawMember(member, withdrawRequestDto);
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
    type: PasswordResetTokenResponseDto 
  })
  async createPasswordResetToken(
    @Body('email') email: string
  ): Promise<PasswordResetTokenResponseDto> {
    return this.membersService.createPasswordResetToken(email);
  }

  /**
   * 비밀번호 재설정 토큰 검증
   */
  @Post('validate-password-reset-token')
  @ApiOperation({ summary: '비밀번호 재설정 토큰 검증' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: '토큰 검증 성공', 
    type: PasswordResetTokenResponseDto 
  })
  async validatePasswordResetToken(
    @Body('token') token: string
  ): Promise<PasswordResetTokenResponseDto> {
    return this.membersService.validatePasswordResetToken(token);
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

  /**
   * 비밀번호 재설정
   */
  @Post('reset-password')
  @ApiOperation({ summary: '비밀번호 재설정' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: '비밀번호 재설정 성공', 
    type: PasswordResetTokenResponseDto 
  })
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto
  ): Promise<PasswordResetTokenResponseDto> {
    return this.membersService.resetPassword(
      resetPasswordDto.token, 
      resetPasswordDto.newPassword
    );
  }

  /**
   * 사용자가 로그인 이후 비밀번호 업데이트
   */
  // @Put('update-password') 명칭을 이렇게 하면 상단의 update로 인식되어 오류 발생.
  @Put('me/password')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '비밀번호 업데이트' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: '비밀번호 업데이트 성공', 
  })
  async updatePassword(
    @Request() req,
    @Body() updatePasswordDto: UpdatePasswordDto
  ) {
    console.log('req.user: ', req.user);
    console.log('updatePasswordDto: ', updatePasswordDto);

    const member = await this.membersService.findOneByUuidAsEntity(req.user.uuid);
    
    return this.membersService.updatePassword(
      member,  // 완전한 Member 엔티티
      updatePasswordDto.currentPassword, 
      updatePasswordDto.newPassword
    );
  }

} 