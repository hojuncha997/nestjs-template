// src/members/members.controller.spec.ts
// 회원 관리 컨트롤러 테스트
import { Test, TestingModule } from '@nestjs/testing';
import { MembersController } from './members.controller';
import { MembersService } from './members.service';
import { AuthProvider } from '@common/enums';

describe('MembersController', () => {
  let controller: MembersController;
  let service: MembersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MembersController],
      providers: [
        {
          provide: MembersService,
          useValue: {
            create: jest.fn(),
            findOne: jest.fn(),
            // ... 다른 메서드들
          },
        },
      ],
    }).compile();

    controller = module.get<MembersController>(MembersController);
    service = module.get<MembersService>(MembersService);
  });

  describe('create', () => {
    it('should create a member', async () => {
      const dto = {
        email: 'test@example.com',
        password: 'password123',
        termsAgreed: true,
        privacyAgreed: true,
        marketingAgreed: false,
        provider: AuthProvider.LOCAL,
      };

      await controller.create(dto);
      expect(service.create).toHaveBeenCalledWith(dto);
    });
  });
}); 