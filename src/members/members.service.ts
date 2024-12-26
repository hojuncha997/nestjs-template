// src/members/members.service.ts
// 회원 관리 서비스
import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm'; // Repository 타입 가져오기:제네릭 타입
import { Member } from './entities/member.entity';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { MemberResponseDto } from './dto/member-response.dto';
import { MemberMapper } from './mappers/member.mapper';
import { AuthProvider, MemberStatus } from '@common/enums';
import * as bcrypt from 'bcrypt';  // 비밀번호 해시화를 위한 패키지. pnpm add bcrypt @types/bcrypt
import { v4 as uuidv4 } from 'uuid';  // 범용 고유 식별자(UUID) 생성을 위한 패키지. pnpm add uuid @types/uuid
import { EmailService } from '@common/services/email.service';

@Injectable()
export class MembersService {
  constructor(
    @InjectRepository(Member)
    private readonly membersRepository: Repository<Member>, // typeorm Repository 제네릭타입 사용
    private readonly emailService: EmailService,
  ) {}

  /**
   * 새로운 회원 생성
   */
  async create(createMemberDto: CreateMemberDto): Promise<MemberResponseDto> {
    // 약관 동의 검증
    if (!createMemberDto.termsAgreed || !createMemberDto.privacyAgreed) {
      throw new BadRequestException('필수 약관��� 동의해주세요.');
    }

    // 연령 확인 필수인 경우
    // if (!createMemberDto.ageVerified) {
    //   throw new BadRequestException('연령 확인이 필요합니다.');
    // }

    const existingMember = await this.membersRepository.findOne({
      where: { email: createMemberDto.email }
    });

    if (existingMember) {
      throw new ConflictException('이미 존재하는 이메일입니다.');
    }

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

    const savedMember = await this.membersRepository.save(memberEntity);
    
    // 인증 이메일 발송
    await this.sendVerificationEmail(savedMember);
    
    return MemberMapper.toDto(savedMember);
  }

  /**
   * 이메일로 회원 찾기
   */
  async findOneByEmailWithPassword(email: string): Promise<Member | null> {
    return this.membersRepository.findOne({
      where: { email },
      select: ['id', 'uuid', 'email', 'status', 'loginAttempts', 'lockoutUntil']
    });
  }

  /**
   * UUID로 회원 찾기
   */
  async findOneByUuid(uuid: string): Promise<MemberResponseDto> {
    const member = await this.membersRepository.findOne({
      where: { uuid }
    });

    if (!member) {
      throw new NotFoundException('회원을 찾을 수 없습니다.');
    }

    return MemberMapper.toDto(member);
  }

  /**
   * 회원 정보 업데이트
   */
  async update(uuid: string, updateMemberDto: UpdateMemberDto): Promise<MemberResponseDto> {
    const member = await this.membersRepository.findOne({ where: { uuid } });
    if (!member) {
      throw new NotFoundException('회원을 찾을 수 없습니다.');
    }

    // 비밀번호 변경 처리
    if (updateMemberDto.password) {
      updateMemberDto.password = await bcrypt.hash(updateMemberDto.password, 10);
      member.passwordChangedAt = new Date();
      member.tokenVersion += 1; // 기존 토큰 무효화
    }

    // 약관 동의 처리
    if (updateMemberDto.termsAgreed !== undefined) {
      member.termsAgreed = updateMemberDto.termsAgreed;
      member.termsAgreedAt = new Date();
    }

    if (updateMemberDto.marketingAgreed !== undefined) {
      member.marketingAgreed = updateMemberDto.marketingAgreed;
      member.marketingAgreedAt = new Date();
    }

    const updatedMember = await this.membersRepository.save({
      ...member,
      ...MemberMapper.toEntity(updateMemberDto),
    });

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
   * 이��일 인증 처리
   */
  async verifyEmail(token: string): Promise<MemberResponseDto> {
    const member = await this.membersRepository.findOne({
      where: { 
        verificationToken: token,
        status: MemberStatus.PENDING
      }
    });

    if (!member) {
      throw new NotFoundException('유효하지 않은 인증 토큰입니다.');
    }

    if (member.verificationTokenExpiresAt < new Date()) {
      // 만료된 토큰인 경우 새로운 토큰 발급
      member.verificationToken = uuidv4();
      member.verificationTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await this.membersRepository.save(member);
      await this.sendVerificationEmail(member);
      
      throw new BadRequestException('만료된 인증 토큰입니다. 새로운 인증 메일을 발송했습니다.');
    }

    // 인증 처리
    member.emailVerified = true;
    member.emailVerifiedAt = new Date();
    member.status = MemberStatus.ACTIVE;
    member.verificationToken = null;
    member.verificationTokenExpiresAt = null;
    member.notificationSettings.email = true;

    const updatedMember = await this.membersRepository.save(member);
    return MemberMapper.toDto(updatedMember);
  }

  /**
   * 비밀번호 재설정 토큰 생성
   */
  async createPasswordResetToken(email: string): Promise<MemberResponseDto> {
    const member = await this.findOneByEmailWithPassword(email);
    if (!member) {
      throw new NotFoundException('회원을 찾을 수 없습니다.');
    }

    // 이전 토큰이 있다면 무효화
    if (member.passwordResetToken && member.passwordResetTokenExpiresAt > new Date()) {
      throw new BadRequestException('이미 유효한 비밀번호 재설정 토큰이 존재합니다.');
    }

    member.passwordResetToken = uuidv4();
    member.passwordResetTokenExpiresAt = new Date(Date.now() + 3600000);
    member.tokenVersion += 1; // 토큰 버전 증가로 기존 토큰 무효화

    const updatedMember = await this.membersRepository.save(member);
    return MemberMapper.toDto(updatedMember);
  }

  /**
   * 회원 소프트 삭제
   */
  async softDelete(uuid: string): Promise<void> {
    const result = await this.membersRepository.softDelete({ uuid });
    if (result.affected === 0) {
      throw new NotFoundException('회원을 찾을 수 없습니다.');
    }
  }

  /**
   * 로그인 시도 횟수 증가 및 계정 잠금 처리
   */
  async incrementLoginAttempts(email: string): Promise<void> {
    const member = await this.findOneByEmailWithPassword(email);
    if (!member) return;

    member.loginAttempts += 1;
    
    if (member.loginAttempts >= 5) {
      member.lockoutUntil = new Date(Date.now() + 30 * 60 * 1000); // 30분 잠금
    }

    await this.membersRepository.save(member);
  }

  /**
   * 로그인 성공 시 로그인 시도 횟수 초기화
   */
  async resetLoginAttempts(email: string): Promise<void> {
    await this.membersRepository.update(
      { email },
      { 
        loginAttempts: 0,
        lockoutUntil: null,
        lastLoginAt: new Date()
      }
    );
  }

  /**
   * 포인트 적립/차감
   */
  async updatePoints(uuid: string, pointType: 'purchase' | 'reward', amount: number): Promise<MemberResponseDto> {
    const member = await this.membersRepository.findOne({ where: { uuid } });
    if (!member) {
      throw new NotFoundException('회원을 찾을 수 없습니다.');
    }
    
    // 음수 포인트 검증
    if (amount < 0 && Math.abs(amount) > member.points[pointType]) {
      throw new BadRequestException('차감할 포인트가 보유 포인트보다 많습니다.');
    }
    
    member.points[pointType] += amount;
    member.points.total = member.points.purchase + member.points.reward;

    const updatedMember = await this.membersRepository.save(member);
    return MemberMapper.toDto(updatedMember);
  }
} 