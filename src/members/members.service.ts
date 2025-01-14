// src/members/members.service.ts
// 회원 관리 서비스
import { Injectable, NotFoundException, ConflictException, BadRequestException, Logger, HttpStatus } from '@nestjs/common';

import { Member } from './entities/member.entity';
import { MemberResponseDto, CreateMemberDto, UpdateMemberDto } from './dto';
import { EmailVerificationResponse } from './types/email-verification-response.type';
import { MemberMapper } from './mappers/member.mapper';
import { MemberStatus, EmailTokenValidationError } from '@common/enums';
import * as bcrypt from 'bcrypt';  // 비밀번호 해시화를 위한 패키지. pnpm add bcrypt @types/bcrypt
import { v4 as uuidv4 } from 'uuid';  // 범용 고유 식별자(UUID) 생성을 위한 패키지. pnpm add uuid @types/uuid
import { EmailService } from '@common/services/email.service';
import { MembersRepository } from './repositories/members.repository';
@Injectable()
export class MembersService {
  private readonly logger = new Logger(MembersService.name);

  constructor(
    private readonly membersRepository: MembersRepository,
    private readonly emailService: EmailService,
  ) {}

  /**
   * 새로운 회원 생성
   */
  async create(createMemberDto: CreateMemberDto): Promise<MemberResponseDto> {
    // 약관 동의 검증
    if (!createMemberDto.termsAgreed || !createMemberDto.privacyAgreed) {
      throw new BadRequestException('필수 약관 동의해주세요.');
    }

    // 연령 확인 필수인 경우
    // if (!createMemberDto.ageVerified) {
    //   throw new BadRequestException('연령 확인이 필요합니다.');
    // }

    const existingMember = await this.membersRepository.checkExistingEmail(createMemberDto.email);
    if (existingMember) {
      throw new ConflictException('이미 존재하는 이메일입니다.');
    }
    // DTO -> Entity
    const memberEntity = MemberMapper.toEntity(createMemberDto);
    
    // 추가 필드 설정
    memberEntity.password = await bcrypt.hash(createMemberDto.password, 10);
    memberEntity.verificationToken = uuidv4();
    memberEntity.verificationTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    memberEntity.status = MemberStatus.PENDING;
    
    // 약관 동의 시간 기록
    memberEntity.termsAgreed = createMemberDto.termsAgreed;
    memberEntity.termsAgreedAt = new Date();
    memberEntity.privacyAgreed = createMemberDto.privacyAgreed;
    memberEntity.privacyAgreedAt = new Date();
    
    if (createMemberDto.marketingAgreed) {
      memberEntity.marketingAgreed = true;
      memberEntity.marketingAgreedAt = new Date();
    }

    // // 연령 확인 기록
    // memberEntity.ageVerified = createMemberDto.ageVerified;
    // memberEntity.ageVerifiedAt = new Date();

    const savedMember = await this.membersRepository.create(memberEntity);
    
    // 인증 이메일 발송
    await this.sendVerificationEmail(savedMember);
    
    return MemberMapper.toDto(savedMember);
  }

  /**
   * 이메일로 회원 찾기
   */
  async findOneByEmailWithPassword(email: string): Promise<Member | null> {
    return this.membersRepository.findOneByEmailWithPassword(email);
  }

  /**
   * UUID로 회원 찾기
   */
  async findOneByUuid(uuid: string): Promise<MemberResponseDto> {
    const member = await this.membersRepository.findOneWithFullDetails(uuid);
    if (!member) {
      throw new NotFoundException('회원을 찾을 수 없습니다.');
    }
    return MemberMapper.toDto(member);
  }

  /**
   * 회원 정보 업데이트
   */
  async update(uuid: string, updateMemberDto: UpdateMemberDto): Promise<MemberResponseDto> {
    const member = await this.membersRepository.findOne(uuid);
    if (!member) {
      throw new NotFoundException('회원을 찾을 수 없습니다.');
    }

    // DTO -> Entity
    const updateData = MemberMapper.toEntity(updateMemberDto);
    
    if (updateMemberDto.password) {
      updateData.password = await bcrypt.hash(updateMemberDto.password, 10);
      updateData.passwordChangedAt = new Date();
      // 토큰 버전 증가 -> 기존 토큰 무효화 -> 전체 로그아웃
      updateData.tokenVersion = member.tokenVersion + 1;
    }

    if (updateMemberDto.termsAgreed !== undefined) {
      updateData.termsAgreed = updateMemberDto.termsAgreed;
      updateData.termsAgreedAt = new Date();
    }

    if (updateMemberDto.marketingAgreed !== undefined) {
      updateData.marketingAgreed = updateMemberDto.marketingAgreed;
      updateData.marketingAgreedAt = new Date();
    }

    const updatedMember = await this.membersRepository.updateMember(uuid, updateData);
    return MemberMapper.toDto(updatedMember);
  }

  /**
   * 회원가입 시 인증 이메일 발송
   */
  async sendVerificationEmail(member: Member): Promise<void> {
    const verificationLink = `${process.env.CLIENT_URL}/verify-email?token=${member.verificationToken}`;
    
    await this.emailService.send({
      to: member.email,
      subject: '회원가입 인증을 완료해주세요',
      template: 'email-verification',
      context: {
        name: member.name || member.email,
        verificationLink,
        expiresIn: '24시간',
        termsAgreedAt: member.termsAgreedAt,
        marketingAgreed: member.marketingAgreed
      }
    });
  }

  /**
   * 이메일 인증 처리
   */
  async verifyEmail(token: string): Promise<EmailVerificationResponse> {
    const member = await this.membersRepository.findOneByVerificationToken(token);
    if (!member) {
      throw new BadRequestException({
        // statusCode: HttpStatus.BAD_REQUEST,
        code: EmailTokenValidationError.INVALID_TOKEN,
        message: '유효하지 않은 인증 토큰입니다.'
      });
    }
    // 로직 상 불필요하지만 DB 직접 수정 등으로 인해 ACTIVE 상태인데 토큰이 남아있는 경우를 대비하여 남겨 놓음. 정합성이 깨졌을 때를 대비
    if (member.status === MemberStatus.ACTIVE) {
      // 내부적으로는 자세히 로깅
      this.logger.error(
        `Data inconsistency detected: Member(${member.id}) is ACTIVE but has verification token`,
        { memberId: member.id, status: member.status, token: member.verificationToken }
      );
    
      // 사용자에게는 일반적인 메시지
      throw new BadRequestException({
        // statusCode: HttpStatus.BAD_REQUEST,
        code: EmailTokenValidationError.ALREADY_VERIFIED,
        message: '이미 인증이 완료된 회원입니다.'
      });
    }

    if (member.verificationTokenExpiresAt < new Date()) {
      member.verificationToken = uuidv4();
      member.verificationTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await this.membersRepository.save(member);
      await this.sendVerificationEmail(member);
      
      throw new BadRequestException({
        // statusCode: HttpStatus.BAD_REQUEST,
        code: EmailTokenValidationError.EXPIRED,
        message: '만료된 인증 토큰입니다. 새로운 인증 메일을 발송했습니다.'
      });
    }

    member.emailVerified = true;
    member.emailVerifiedAt = new Date();
    member.status = MemberStatus.ACTIVE;
    member.verificationToken = null;
    member.verificationTokenExpiresAt = null;
    member.notificationSettings.email = true;

    const updatedMember = await this.membersRepository.save(member);
    // return MemberMapper.toDto(updatedMember);
    return {
      email: updatedMember.email,
      verified: updatedMember.emailVerified,
      verifiedAt: updatedMember.emailVerifiedAt,
      status: updatedMember.status,
    }
  }

  /**
   * 비밀번호 재설정 토큰 생성
   */
  async createPasswordResetToken(email: string): Promise<MemberResponseDto> {
    const member = await this.findOneByEmailWithPassword(email);
    if (!member) {
      throw new NotFoundException('회원을 찾을 수 없습니다.');
    }

    if (member.passwordResetToken && member.passwordResetTokenExpiresAt > new Date()) {
      throw new BadRequestException('이미 유효한 비밀번호 재설정 토큰이 존재합니다.');
    }

    const updatedMember = await this.membersRepository.createPasswordResetToken(member);
    return MemberMapper.toDto(updatedMember);
  }

  /**
   * 회원 소프트 삭제
   */
  async withdrawMember(uuid: string): Promise<void> {
    const success = await this.membersRepository.withdrawMember(uuid);
    if (!success) {
      throw new NotFoundException('회원을 찾을 수 없습니다.');
    }
    // 추가 비즈니스 로직 (이메일 발송 등)
  }

  /**
   * 로그인 시도 횟수 증가 및 계정 잠금 처리
   */
  async incrementLoginAttempts(email: string): Promise<void> {
    const member = await this.membersRepository.findByEmail(email);
    if (!member) return;

    const loginAttempts = (member.loginAttempts || 0) + 1;
    const lockoutUntil = loginAttempts >= 5 ? new Date(Date.now() + 30 * 60 * 1000) : null; // 30분

    await this.membersRepository.updateLoginAttempts(email, loginAttempts, lockoutUntil);
  }

  /**
   * 로그인 성공 시 로그인 시도 횟수 초기화
   */
  async resetLoginAttempts(email: string): Promise<void> {
    await this.membersRepository.resetLoginAttempts(email);
  }

  /**
   * 포인트 적립/차감
   */
  async updatePoints(uuid: string, pointType: 'purchase' | 'reward', amount: number): Promise<MemberResponseDto> {
    if (amount < 0) {
      const member = await this.membersRepository.findOne(uuid);
      if (Math.abs(amount) > member.points[pointType]) {
        throw new BadRequestException('차감할 포인트가 보유 포인트보다 많습니다.');
      }
    }
    
    const updatedMember = await this.membersRepository.updatePoints(uuid, pointType, amount);
    if (!updatedMember) {
      throw new NotFoundException('회원을 찾을 수 없습니다.');
    }
    
    return MemberMapper.toDto(updatedMember);
  }

  /**
   * 이메일로 회원 상세정보 조회(비밀번호 제외)
   */
  async findByEmail(email: string): Promise<Member | null> {
    const member = await this.membersRepository.findByEmailWithFullDetails(email);
    if (member) {
      console.log('Found member:', { 
        ...member, 
        password: 'HIDDEN',
        status: member.status,
        emailVerified: member.emailVerified 
      });
    }
    return member;
  }

  async incrementTokenVersion(memberId: number): Promise<void> {
    await this.membersRepository.incrementTokenVersion(memberId);
  }
} 