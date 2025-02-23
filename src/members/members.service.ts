// src/members/members.service.ts
// 회원 관리 서비스
import { Injectable, NotFoundException, ConflictException, BadRequestException, Logger, HttpStatus } from '@nestjs/common';

import { Member } from './entities/member.entity';
import { MemberResponseDto, CreateMemberDto, UpdateMemberDto, CreateSocialMemberDto } from './dto';
import { EmailVerificationResponse } from './types/email-verification-response.type';
import { MemberMapper } from './mappers/member.mapper';
import { MemberStatus, EmailTokenValidationError, Role, Language, Theme } from '@common/enums';
import * as bcrypt from 'bcrypt';  // 비밀번호 해시화를 위한 패키지. pnpm add bcrypt @types/bcrypt
import { v4 as uuidv4 } from 'uuid';  // 범용 고유 식별자(UUID) 생성을 위한 패키지. pnpm add uuid @types/uuid
import { EmailService } from '@common/services/email.service';
import { MembersRepository } from './repositories/members.repository';
import { AuthProvider } from '@common/enums';
import { SocialLoginDto } from '@auth/dto/social-login.dto';
import { EmailUtil } from '@common/utils/email-encryption.util';
import { NicknameGenerationUtil } from '@common/utils/nickname-generation.util';
import { PasswordResetTokenResponseDto } from './dto/password-reset-token-response.dto';

@Injectable()
export class MembersService {
  private readonly logger = new Logger(MembersService.name);

  constructor(
    private readonly membersRepository: MembersRepository,
    private readonly emailService: EmailService,
  ) {}

  // 회원가입 시 약관 동의 검증
  private validateCreateMemberDto(dto: CreateMemberDto) {
    if (!dto.termsAgreed || !dto.privacyAgreed) {
      throw new BadRequestException('필수 약관 동의해주세요.');
    }
  }

 

  /**
   * 새로운 회원 생성
   */
  async create(createMemberDto: CreateMemberDto): Promise<MemberResponseDto> {
    // 약관 동의 검증
    // if (!createMemberDto.termsAgreed || !createMemberDto.privacyAgreed) {
    //   throw new BadRequestException('필수 약관 동의해주세요.');
    // }
    this.validateCreateMemberDto(createMemberDto);

    // 연령 확인 필수인 경우
    // if (!createMemberDto.ageVerified) {
    //   throw new BadRequestException('연령 확인이 필요합니다.');
    // }

    // 이메일 해싱(암호화 X)
    const hashedEmail = EmailUtil.hashEmail(createMemberDto.email);

    // 이메일 해시값으로 중복 체크
    const existingMember = await this.membersRepository.findOneByHashedEmail(hashedEmail);
    if (existingMember) {
      throw new ConflictException('이미 존재하는 이메일입니다.');
    }

    // const existingMember = await this.membersRepository.checkExistingEmail(createMemberDto.email);
    // if (existingMember) {
    //   throw new ConflictException('이미 존재하는 이메일입니다.');
    // }

    // 시간 관련 처리
    const now = new Date();
    const verificationTokenExpiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // DTO -> Entity
    const memberEntity = MemberMapper.toEntity(createMemberDto);

  // 랜덤 닉네임 생성 및 중복 체크
    const nickname = await NicknameGenerationUtil.generateUniqueNickname(
      // 생성된 닉네임을 리포지토리 함수에 전달하여 중복 체크
      // 만약 중복되면 여러 번 시도하여 고유한 닉네임 생성
      // 계속해서 문제가 생기면 에러 발생
      async (nick) => await this.membersRepository.existsByNickname(nick)
    );

    // 추가 필드 설정: Object.assig()을 사용하지 않고 개별 처리.(가독성, 디버깅 용이)
    memberEntity.email = EmailUtil.encryptEmail(createMemberDto.email); // 이메일 암호화(개인정보 보호(양방향))
    memberEntity.hashedEmail = hashedEmail; // 이메일 해시값(조회용)
    memberEntity.password = await bcrypt.hash(createMemberDto.password, 10); // 비밀번호 해시화(단방향)
    memberEntity.verificationToken = uuidv4(); // 인증 토큰 생성
    memberEntity.verificationTokenExpiresAt = verificationTokenExpiresAt; // 인증 토큰 만료 시간 설정
    memberEntity.status = MemberStatus.PENDING; // 회원 상태 설정
    memberEntity.nickname = nickname; // 닉네임 설정
    
    // 약관 동의 시간 기록
    memberEntity.termsAgreed = createMemberDto.termsAgreed;
    memberEntity.termsAgreedAt = now;
    memberEntity.privacyAgreed = createMemberDto.privacyAgreed;
    memberEntity.privacyAgreedAt = now;
    
    if (createMemberDto.marketingAgreed) {
      memberEntity.marketingAgreed = true;
      memberEntity.marketingAgreedAt = now;
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
    const member = await this.membersRepository.findOneByEmailWithPassword(email);
    if (!member) {
      throw new NotFoundException('회원을 찾을 수 없습니다.');
    }
    return member;
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
    
    const html = `
      <h1>이메일 인증</h1>
      <p>안녕하세요 ${member.name || member.email}님,</p>
      <p>아래 링크를 클릭하여 이메일 인증을 완료해주세요:</p>
      <a href="${verificationLink}" target="_blank" rel="noopener noreferrer">이메일 인증하기</a>
      <p>이 링크는 24시간 동안 유효합니다.</p>
    `;

    await this.emailService.send({
      to: EmailUtil.decryptEmail(member.email),
      subject: '회원가입 인증을 완료해주세요',
      html,
      context: {
        name: member.name || member.email,
        verificationLink,
        expiresIn: '24시간'
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
  async createPasswordResetToken(email: string): Promise<PasswordResetTokenResponseDto> {
    const member = await this.membersRepository.findOneByEmail(email);

    if (!member) {
      throw new NotFoundException('회원을 찾을 수 없습니다.');
    }

    if (member.passwordResetToken && member.passwordResetTokenExpiresAt > new Date()) {
      throw new BadRequestException('이미 유효한 비밀번호 재설정 토큰이 존재합니다.');
    }

    console.log('member from createPasswordResetToken: ', member);

    // 비밀번호 재설정 토큰(uuid, passwordResetToken), 만료 시간(passwordResetTokenExpiresAt) 생성하여 멤버 테이블 칼럼에 저장
    const updatedMember = await this.membersRepository.createPasswordResetToken(member);

    // 이메일 복호화
    const decryptedEmail = EmailUtil.decryptEmail(updatedMember.email);

    // 비밀번호 재설정 이메일 발송
    const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${updatedMember.passwordResetToken}`;
    
    const html = `
      <h1>비밀번호 재설정</h1>
      <p>안녕하세요 ${decryptedEmail}님,</p>
      <p>아래 링크를 클릭하여 비밀번호를 재설정해주세요:</p>
      <a href="${resetLink}" target="_blank" rel="noopener noreferrer">비밀번호 재설정하기</a>
      <p>이 링크는 30분 동안 유효합니다.</p>
    `;

    await this.emailService.send({
      to: decryptedEmail,
      subject: '비밀번호 재설정 안내',
      html,
      context: {
        name: updatedMember.name || updatedMember.email,
        resetLink,
        expiresIn: '30분'
      }
    });

    return {
      success: true,
      message: '비밀번호 재설정 링크가 이메일로 전송되었습니다.'
    };
  }

  /**
   * 비밀번호 재설정 토큰 검증
   */
  async validatePasswordResetToken(token: string): Promise<PasswordResetTokenResponseDto> {
    const member = await this.membersRepository.findOneByPasswordResetToken(token);
    
    if (!member) {
      throw new BadRequestException('유효하지 않은 토큰입니다.');
    }

    if (member.passwordResetTokenExpiresAt < new Date()) {
      throw new BadRequestException('만료된 토큰입니다. 비밀번호 재설정을 다시 요청해주세요.');
    }

    return {
      success: true,
      message: '유효한 토큰입니다.'
    };
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
    const member = await this.membersRepository.findOneByEmail(email);
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
    // const member = await this.membersRepository.findByEmailWithFullDetails(email);
    const member = await this.membersRepository.findOneByEmailWithFullDetails(email);
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

  /**
   * 소셜 회원 가입
   */
  // async createSocialMember(createSocialMemberDto: CreateSocialMemberDto): Promise<MemberResponseDto> {
  async createSocialMember(socialLoginDto: SocialLoginDto): Promise<MemberResponseDto> {
    const memberEntity = MemberMapper.toEntity({
      email: socialLoginDto.email,
      provider: socialLoginDto.provider,
      providerId: socialLoginDto.providerId,
      name: socialLoginDto.name,
      profileImage: socialLoginDto.picture,
      status: MemberStatus.ACTIVE,
      role: Role.USER,
      preferences: {
        language: Language.KO,
        timezone: 'Asia/Seoul',
        theme: Theme.LIGHT
      }
    });

    const now = new Date();

    // 이메일 암호화 및 해시값 생성
    memberEntity.email = EmailUtil.encryptEmail(socialLoginDto.email);
    memberEntity.hashedEmail = EmailUtil.hashEmail(socialLoginDto.email);

    // 닉네임 생성
    memberEntity.nickname = await NicknameGenerationUtil.generateUniqueNickname(
      async (nick) => await this.membersRepository.existsByNickname(nick)
    );
    
    // 소셜 회원은 이메일 인증이 필요 없음
    memberEntity.emailVerified = true;
    memberEntity.emailVerifiedAt = now;
    memberEntity.status = MemberStatus.ACTIVE;
    
    // 필수 약관 동의 처리 (소셜 로그인의 경우 자동 동의로 처리)
    memberEntity.termsAgreed = true;
    memberEntity.termsAgreedAt = now;
    memberEntity.privacyAgreed = true;
    memberEntity.privacyAgreedAt = now;
    
    // provider와 providerId 명시적 설정
    memberEntity.provider = socialLoginDto.provider;
    memberEntity.providerId = socialLoginDto.providerId;
    
    console.log('memberEntity before save:', {
      ...memberEntity,
      provider: memberEntity.provider,
      providerId: memberEntity.providerId
    });
    
    const savedMember = await this.membersRepository.create(memberEntity);
    
    if (!savedMember.id) {
      throw new Error('회원 저장 실패: ID가 생성되지 않았습니다.');
    }
    
    console.log('savedMember', savedMember);
    return MemberMapper.toDto(savedMember);
  }

  async findByProviderAndProviderId(provider: AuthProvider, providerId: string) {
    return this.membersRepository.findOneByProviderAndProviderId(provider, providerId);
  }

  async findByHashedEmail(hashedEmail: string) {
    console.log('findByHashedEmail 호출됨. hashedEmail:', hashedEmail);
    const member = await this.membersRepository.findByHashedEmail(hashedEmail);
    console.log('DB 조회 결과:', member);
    return member;
  }

  /**
   * 비밀번호 재설정
   */
  async resetPassword(token: string, newPassword: string): Promise<PasswordResetTokenResponseDto> {
    const member = await this.membersRepository.findOneByPasswordResetToken(token);
    
    if (!member) {
      throw new BadRequestException('유효하지 않은 토큰입니다.');
    }

    if (member.passwordResetTokenExpiresAt < new Date()) {
      throw new BadRequestException('만료된 토큰입니다. 비밀번호 재설정을 다시 요청해주세요.');
    }

    // 비밀번호 해시화 및 업데이트
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.membersRepository.updateMember(member.uuid, {
      password: hashedPassword,
      passwordResetToken: null,
      passwordResetTokenExpiresAt: null,
      passwordChangedAt: new Date(),
      tokenVersion: member.tokenVersion + 1
    });

    return {
      success: true,
      message: '비밀번호가 성공적으로 재설정되었습니다.'
    };
  }

} 