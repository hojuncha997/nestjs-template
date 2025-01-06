// test/e2e/members/members.e2e-spec.ts
// 회원 관리 테스트
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../src/app.module';

describe('MembersController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/members (POST)', () => {
    return request(app.getHttpServer())
      .post('/members')
      .send({
        email: 'test@example.com',
        password: 'password123',
        termsAgreed: true,
        privacyAgreed: true,
        marketingAgreed: false,
      })
      .expect(201)
      .expect((res) => {
        expect(res.body.email).toBe('test@example.com');
        expect(res.body.uuid).toBeDefined();
      });
  });
}); 