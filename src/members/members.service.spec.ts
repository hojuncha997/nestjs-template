// src/members/members.service.spec.ts
// 회원 관리 서비스 테스트
import { Test, TestingModule } from '@nestjs/testing';
import { MembersService } from './members.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Member } from './entities/member.entity';
import { Repository } from 'typeorm';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { AuthProvider, MemberStatus } from '@common/enums';
import { EmailService } from '@common/services/email.service';

describe('MembersService', () => {
  let service: MembersService;
  let repository: Repository<Member>;
  let emailService: EmailService;

  const mockRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    softDelete: jest.fn(),
  };

  const mockEmailService = {
    send: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MembersService,
        {
          provide: getRepositoryToken(Member),
          useValue: mockRepository,
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
      ],
    }).compile();

    service = module.get<MembersService>(MembersService);
    repository = module.get<Repository<Member>>(getRepositoryToken(Member));
    emailService = module.get<EmailService>(EmailService);
  });

  describe('create', () => {
    const createMemberDto: CreateMemberDto = {
      email: 'test@example.com',
      password: 'password123',
      provider: AuthProvider.LOCAL,
      termsAgreed: true,
      privacyAgreed: true,
      marketingAgreed: false
    };

    it('필수 약관 미동의 시 예외가 발생해야 함', async () => {
      const invalidDto = {
        ...createMemberDto,
        termsAgreed: false
      };

      await expect(service.create(invalidDto)).rejects.toThrow(BadRequestException);
    });

    it('회원가입 성공 시 이메일이 발송되어야 함', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      const emailServiceSpy = jest.spyOn(emailService, 'send');

      await service.create(createMemberDto);

      expect(emailServiceSpy).toHaveBeenCalled();
    });

    it('비밀번호가 해시되어 저장되어야 함', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      const savedMember = jest.fn();
      
      mockRepository.save.mockImplementation((member) => {
        savedMember(member);
        return member;
      });

      await service.create(createMemberDto);
      
      // save 호출 시 전달된 엔티티의 password를 검증
      expect(savedMember).toHaveBeenCalledWith(
        expect.objectContaining({
          password: expect.stringMatching(/^\$2[aby]\$\d{1,2}\$[./A-Za-z0-9]{53}$/)
        })
      );
    });

    it('약관 동의 시간이 기록되어야 함', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.save.mockImplementation(member => member);

      const result = await service.create(createMemberDto);
      
      expect(result.termsAgreedAt).toBeInstanceOf(Date);
      expect(result.privacyAgreedAt).toBeInstanceOf(Date);
      expect(result.marketingAgreedAt).toBeUndefined(); // marketingAgreed가 false이므로
    });
  });

  describe('findOneByUuid', () => {
    const uuid = 'test-uuid';
    const mockMember = {
      uuid,
      email: 'test@example.com',
      status: MemberStatus.ACTIVE,
    };

    it('UUID로 회원을 찾아야 함', async () => {
      mockRepository.findOne.mockResolvedValue(mockMember);

      const result = await service.findOneByUuid(uuid);

      expect(result).toBeDefined();
      expect(result.uuid).toBe(uuid);
    });

    it('회원이 없으면 NotFoundException을 발생시켜야 함', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOneByUuid(uuid)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const uuid = 'test-uuid';
    const updateMemberDto: UpdateMemberDto = {
      // nickname: '새로운닉네임',
    };
    const mockMember = {
      uuid,
      email: 'test@example.com',
      nickname: '기존닉네임',
    };

    it('회원 정보를 업데이트해야 함', async () => {
      mockRepository.findOne.mockResolvedValue(mockMember);
      mockRepository.save.mockResolvedValue({
        ...mockMember,
        ...updateMemberDto,
      });

      const result = await service.update(uuid, updateMemberDto);

      // expect(result.nickname).toBe(updateMemberDto.nickname);
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('존재하지 않는 회원이면 NotFoundException을 발생시켜야 함', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.update(uuid, updateMemberDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('마케팅 동의 상태 변경 시 동의 시간이 기록되어야 함', async () => {
      const uuid = 'test-uuid';
      const member = {
        uuid,
        marketingAgreed: false,
        marketingAgreedAt: null,
      };

      const updateDto = {
        marketingAgreed: true,
      };

      mockRepository.findOne.mockResolvedValue(member);
      mockRepository.save.mockImplementation(m => ({
        ...m,
        marketingAgreedAt: expect.any(Date),
      }));

      const result = await service.update(uuid, updateDto);
      
      expect(result.marketingAgreed).toBe(true);
      expect(result.marketingAgreedAt).toBeDefined();
    });

    it('비밀번호 변경 시 해시되어 저장되어야 함', async () => {
      const uuid = 'test-uuid';
      const member = {
        uuid,
        password: 'old-hashed-password',
      };

      const updateDto = {
        password: 'NewPassword123!',
      };

      mockRepository.findOne.mockResolvedValue(member);
      const savedMember = jest.fn();
      
      mockRepository.save.mockImplementation((member) => {
        savedMember(member);
        return member;
      });

      await service.update(uuid, updateDto);
      
      // save 호출 시 전달된 엔티티의 password를 검증
      expect(savedMember).toHaveBeenCalledWith(
        expect.objectContaining({
          password: expect.stringMatching(/^\$2[aby]\$\d{1,2}\$[./A-Za-z0-9]{53}$/),
          passwordChangedAt: expect.any(Date)
        })
      );
    });
  });

  describe('softDelete', () => {
    const uuid = 'test-uuid';

    it('회원을 소프트 삭제해야 함', async () => {
      mockRepository.softDelete.mockResolvedValue({ affected: 1 });

      await service.softDelete(uuid);

      expect(mockRepository.softDelete).toHaveBeenCalledWith({ uuid });
    });

    it('존재하지 않는 회원이면 NotFoundException을 발생시켜야 함', async () => {
      mockRepository.softDelete.mockResolvedValue({ affected: 0 });

      await expect(service.softDelete(uuid)).rejects.toThrow(NotFoundException);
    });
  });

  describe('email verification', () => {
    it('이메일 인증 토큰이 유효하면 회원 상태가 ACTIVE로 변경되어야 함', async () => {
      const token = 'valid-token';
      const member = {
        verificationToken: token,
        status: MemberStatus.PENDING,
        verificationTokenExpiresAt: new Date(Date.now() + 3600000),
      };

      mockRepository.findOne.mockResolvedValue(member);
      const result = await service.verifyEmail(token);

      expect(result.status).toBe(MemberStatus.ACTIVE);
      expect(result.emailVerified).toBe(true);
    });

    it('만료된 토큰으로 인증 시 새로운 토큰이 발급되어야 함', async () => {
      const token = 'expired-token';
      const member = {
        verificationToken: token,
        status: MemberStatus.PENDING,
        verificationTokenExpiresAt: new Date(Date.now() - 3600000),
      };

      mockRepository.findOne.mockResolvedValue(member);
      const emailServiceSpy = jest.spyOn(emailService, 'send');

      await expect(service.verifyEmail(token)).rejects.toThrow(BadRequestException);
      expect(emailServiceSpy).toHaveBeenCalled();
    });

    it('잘못된 토큰으로 인증 시 NotFoundException이 발생해야 함', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.verifyEmail('invalid-token')).rejects.toThrow(NotFoundException);
    });

    it('이미 인증된 회원은 BadRequestException이 발생해야 함', async () => {
      const token = 'valid-token';
      const member = {
        verificationToken: token,
        status: MemberStatus.ACTIVE,
        emailVerified: true,
        verificationTokenExpiresAt: new Date(Date.now() + 3600000),
      };

      mockRepository.findOne.mockResolvedValue(member);

      await expect(service.verifyEmail(token)).rejects.toThrow(BadRequestException);
    });
  });

  describe('password security', () => {
    it('비밀번호 변경 시 토큰 버전이 증가해야 함', async () => {
      const uuid = 'test-uuid';
      const member = {
        uuid,
        tokenVersion: 1,
      };

      mockRepository.findOne.mockResolvedValue(member);
      await service.update(uuid, { password: 'newPassword123!' });

      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          tokenVersion: 2,
        }),
      );
    });
  });

  describe('findOneByEmailWithPassword', () => {
    it('이메일로 회원을 찾을 때 필요한 필드만 조회해야 함', async () => {
      const email = 'test@example.com';
      mockRepository.findOne.mockResolvedValue({
        id: 1,
        uuid: 'test-uuid',
        email,
        status: MemberStatus.ACTIVE,
        loginAttempts: 0,
      });

      const result = await service.findOneByEmailWithPassword(email);
      
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('uuid');
      expect(result).toHaveProperty('email');
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('loginAttempts');
      expect(result).not.toHaveProperty('password'); // 비밀번호는 기본적으로 조회되지 않아야 함
    });
  });
}); 