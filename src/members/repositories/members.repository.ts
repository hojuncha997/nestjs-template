// src/members/repositories/members.repository.ts
// 멤버 리포지토리: 데이터베이스 접근을 담당하는 클래스
// TypeORM의 Repository를 래핑하여 도메인에 특화된 데이터 접근 메서드 제공

import { Injectable , Logger, InternalServerErrorException} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository , DataSource} from 'typeorm';
import { Member } from '../entities/member.entity';
import { MemberStatus , AuthProvider} from '@common/enums';
import { v4 as uuidv4 } from 'uuid';
import { EmailUtil } from '@common/utils/email-util.util';
import { WithdrawnMember } from '../entities/withdrawn-member.entity';
@Injectable()
export class MembersRepository {
  
  // members.mudule.ts에 로거를 등록하지 않고 직접 생성하면 각 클래스가 자신만의 Logger 인스턴스를 가지게 되어 로깅할 때 어떤 클래스에서 발생한 로그인지 쉽게 구분할 수 있음
  private readonly logger = new Logger(MembersRepository.name);

  constructor(
    @InjectRepository(Member)
    private readonly memberRepository: Repository<Member>,
    private readonly dataSource: DataSource,
  ) {}

  // UUID로 단일 멤버 조회
  async findOne(uuid: string): Promise<Member | null> {
    return this.memberRepository.findOne({ where: { uuid } });
  }

  // 내부용: ID로 단일 멤버 조회 (시스템 내부에서만 사용)
  async findOneById(id: number): Promise<Member | null> {
    return this.memberRepository.findOne({ where: { id } });
  }

  // 이메일로 멤버 조회 (로그인, 중복 확인 등에 사용)
  async findOneByEmail(email: string): Promise<Member | null> {
    return this.memberRepository.findOne({
      where: { hashedEmail: EmailUtil.hashEmail(email) },
    });
  }

  // 모든 멤버 목록 조회
  async findAll(): Promise<Member[]> {
    return this.memberRepository.find();
  }

  // 새 멤버 생성
  async create(member: Partial<Member>): Promise<Member> {
    const newMember = this.memberRepository.create(member);
    return this.memberRepository.save(newMember);
  }

  // 멤버 정보 업데이트
  async save(member: Member): Promise<Member> {
    return this.memberRepository.save(member);
  }

  // 멤버 삭제 (Soft Delete)
  async withdrawMember(member: Member, withdrawnMember: WithdrawnMember): Promise<boolean> {
    try {
      return await this.dataSource.transaction(async (manager) => {
        // 탈퇴 정보 저장
        await manager.save(WithdrawnMember, withdrawnMember);

        // 기존 회원 정보 삭제 처리
        await manager.update(Member, { uuid: member.uuid }, {
          email: `withdrawn_${member.uuid}@deleted.account`,  // not null 때문에 특수한 이메일 형식으로 변경
          hashedEmail: `withdrawn_${member.uuid}`,  // not null 때문에 해시된 이메일도 특수한 형식으로 변경
          name: '[withdrawn member]',
          nickname: '[withdrawn member]',
          phoneNumber: null,
          socialProfiles: null,
          status: MemberStatus.WITHDRAWAL,
          deletedAt: new Date(),
          // 추가적인 개인정보 필드들도 null 처리
          // 보안 관련 필드 초기화 추가
          password: null,
          passwordChangedAt: null,
          passwordResetToken: null,
          passwordResetTokenExpiresAt: null,
          verificationToken: null,
          verificationTokenExpiresAt: null,
          twoFactorSecret: null
        });

        return true;
      });
    } catch (error) { 
      // 에러 로깅
      this.logger.error(`Failed to withdraw member: ${member.uuid}`, error.stack);
      throw new InternalServerErrorException('회원 탈퇴 처리 중 오류가 발생했습니다.');
    }
  }

  // 이메일로 멤버 조회 (로그인 시 사용)
  async findOneByEmailWithPassword(email: string): Promise<Member | null> {
    return this.memberRepository.findOne({
      where: { email },
      select: ['id', 'uuid', 'email', 'status', 'loginAttempts', 'lockoutUntil']
    });
  }

  // 이메일 인증 토큰으로 멤버 조회 (이메일 인증 시 사용)
  async findOneByVerificationToken(token: string): Promise<Member | null> {
    const member = await this.memberRepository.findOne({
      where: { 
        verificationToken: token,
        status: MemberStatus.PENDING
      },
      select: {
        id: true,
        uuid: true,
        email: true,
        verificationToken: true,  
        verificationTokenExpiresAt: true,
        status: true,
        notificationSettings: {
          //jsonb형식이기 때문에 이처럼 객체형태로 명시해 줘야함. 단순히 notificationSettings: true 로 하면 에러 발생
          email: true,
          // push: true,
          // sms: true,
          // marketing: true,
          // inApp: true
        }
      }
    });
    return member;
  }

  // 로그인 시도 횟수 업데이트
  async updateLoginAttempts(email: string, attempts: number, lockoutUntil?: Date): Promise<void> {
    await this.memberRepository.update({ email }, { 
      loginAttempts: attempts,
      lockoutUntil
    });
  }

  async resetLoginAttempts(email: string): Promise<void> {
    await this.memberRepository.update(
      { email },
      { 
        loginAttempts: 0,
        lockoutUntil: null,
        lastLoginAt: new Date()
      }
    );
  }

  // 포인트 업데이트
  async updatePoints(uuid: string, pointType: 'purchase' | 'reward', amount: number): Promise<Member> {
    const member = await this.findOne(uuid);
    if (!member) return null;

    member.points[pointType] += amount;
    member.points.total = member.points.purchase + member.points.reward;
    
    return this.memberRepository.save(member);
  }

  // 멤버 상세 정보 조회 (회원 정보 페이지 등에 사용)
  async findOneWithFullDetails(uuid: string): Promise<Member | null> {
    return this.memberRepository.findOne({ 
      where: { uuid },
      select: {
        id: true,
        uuid: true,
        email: true,
        hashedEmail: true,
        name: true,
        nickname: true,
        provider: true,
        providerId: true,
        status: true,
        createdAt: true,
        lastLoginAt: true,
        emailVerified: true,
        marketingAgreed: true,
        tokenVersion: true,
        password: true,
        levelInfo: {
          level: true,
          experience: true
        },
        points: {
          total: true,
          purchase: true,
          reward: true
        }
      }
    });
  }

  // 이메일로 멤버 상세 정보 조회 (회원 정보 페이지 등에 사용)
  async findOneByEmailWithFullDetails(email: string): Promise<Member | null> {
    return this.memberRepository.findOne({ 
      // where: { email },
      // where: {hashedEmail: EmailUtil.encryptEmail(email)},
      where: {hashedEmail: EmailUtil.hashEmail(email)},
      select: {
        id: true,
        uuid: true,
        email: true,
        nickname: true,
        password: true,
        status: true,
        emailVerified: true,
        loginAttempts: true,
        lockoutUntil: true,
        lastLoginAt: true,
        tokenVersion: true,
        preferences: {
          language: true,
          timezone: true,
          theme: true
        }
      }
    });
  }

  // 멤버 정보 업데이트
  async updateMember(uuid: string, updateData: Partial<Member>): Promise<Member> {
    const member = await this.findOne(uuid);
    if (!member) return null;

    Object.assign(member, updateData);
    return this.memberRepository.save(member);
  }

  // 비밀번호 재설정 토큰 생성
  async createPasswordResetToken(member: Member): Promise<Member> {
    member.passwordResetToken = uuidv4();
    // 1시간 후 만료
    member.passwordResetTokenExpiresAt = new Date(Date.now() + 3600000);
    // 토큰 버전 증가(기존 발급된 토큰 무효화 -> 실질적 로그아웃 -> 재로그인 필요)
    member.tokenVersion += 1;
    
    return this.memberRepository.save(member);
  }

  // 이메일 중복 검사
  async checkExistingEmail(email: string): Promise<Member | null> {
    // return this.memberRepository.findOne({ where: { email } });
    return this.memberRepository.findOne({ where: { hashedEmail: EmailUtil.encryptEmail(email) } });
  }

  // 멤버 업데이트
  async update(id: number, updates: Partial<Member>): Promise<void> {
    await this.memberRepository.update(id, updates);
  }

  async incrementTokenVersion(memberId: number): Promise<void> {
    await this.memberRepository.increment(
      { id: memberId },
      'tokenVersion',
      1
    );
  }

  async findOneByProviderAndProviderId(provider: AuthProvider, providerId: string) {
    return this.memberRepository.findOne({ where: { provider, providerId } });
  }

  // 이메일 해시값으로 조회 
  async findOneByHashedEmail(hashedEmail: string): Promise<Member | null> {
    return this.memberRepository.findOne({ where: { hashedEmail: hashedEmail }, select: ['id', 'uuid', 'email', 'status', 'loginAttempts', 'lockoutUntil', 'password'] });
  }

  // 닉네임 중복 검사
  async existsByNickname(nickname: string): Promise<boolean> {
    const count = await this.memberRepository.count({ where: { nickname } });
    return count > 0;
  }

  async findOneByPasswordResetToken(token: string): Promise<Member | null> {
    return this.memberRepository.findOne({
      where: { passwordResetToken: token }
    });
  }

  async findByHashedEmail(hashedEmail: string) {
    const member = await this.memberRepository.findOne({
        where: { hashedEmail: hashedEmail },
        select: {
            id: true,
            uuid: true,
            email: true,
            password: true,
            nickname: true,
            status: true,
            role: true,
            preferences: {
                language: true,
                timezone: true,
                theme: true
            },
            tokenVersion: true,
            loginAttempts: true,
            lockoutUntil: true
        }
    });
    return member;
  }
} 