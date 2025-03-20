// src/main.ts
// 애플리케이션 진입점
// 스프링부트의 @SpringBootApplication가 붙어있는 파일(메인함수가 있는 파일)에 대응되는 파일

// 유효성 검사 파이프 추가
import { ValidationPipe, BadRequestException , Logger} from '@nestjs/common';
import * as cookieParser from 'cookie-parser';

import { NestFactory } from '@nestjs/core';
// Swagger 모듈 추가
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

const logger = new Logger('Main');

async function bootstrap() {
  logger.log('DB Connection Info:', {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    username: process.env.DB_USERNAME,
    database: process.env.DB_DATABASE,
    // password는 보안상 출력하지 않음
  });
  
  // 환경 변수 로드
  const app = await NestFactory.create(AppModule, {
    logger: process.env.NODE_ENV === 'production' ? ['error', 'warn'] : ['error', 'warn', 'log', 'debug', 'verbose'],
    
    // NODE_ENV에 따라 CORS 설정을 다르게 적용
    cors: process.env.NODE_ENV === 'production' 
      ? false  // 프로덕션 환경에서는 CORS 비활성화 (nginx에서 처리)
      : {      // 개발 환경에서는 CORS 설정 활성화
          origin: ['http://localhost:3001'],
          credentials: true,
          methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
          allowedHeaders: ['Content-Type', 'Authorization'],
        }
  });

  // HTTP 요청에 포함된 쿠키를 자동으로 파싱
  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,  // DTO에 정의되지 않은 속성은 제거
      transform: true,  // 요청 데이터를 DTO 클래스의 인스턴스로 변환
      forbidNonWhitelisted: true,  // DTO에 정의되지 않은 속성이 있으면 에러
      // forbidNonWhitelisted: false,  // DTO에 정의되지 않은 속성이 있으면 에러
      transformOptions: {
        enableImplicitConversion: true,  // 암시적 타입 변환 허용
      },
      exceptionFactory: (errors) => {
        logger.error('ValidationPipe errors:', errors);
        return new BadRequestException(errors);
      },
    })
  );
  
  // CORS 허용
  // app.enableCors({
  //   origin: 'https://blog.notesandnodes.com',
  //   methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  //   credentials: true,
  //   allowedHeaders: '*',  // 모든 헤더 허용
  //   exposedHeaders: ['Set-Cookie'],  // 모든 헤더 노출
  //   preflightContinue: false,
  //   optionsSuccessStatus: 204,
  // });
  
  // 전역 경로 설정: 경로 앞에 /api/v1 붙이기
  app.setGlobalPrefix('api/v1');  // /api/v1/members

  // Swagger 설정
  const config = new DocumentBuilder()
    .setTitle('Members API') // 문서 제목
    .setDescription('회원 관리 API 문서') // 문서 설명
    .setVersion('1.0') // 문서 버전
    .addBearerAuth( // Bearer 인증 토큰 추가
      {
        type: 'http',
        scheme: 'bearer', // 인증 토큰 타입
        bearerFormat: 'JWT', // 인증 토큰 형식
        name: 'JWT', // 인증 토큰 이름
        description: 'Enter JWT token', // 인증 토큰 설명
        in: 'header', // 인증 토큰 위치
      },
      'access-token',
    )
    .addTag('auth', '인증 관련 API') // 태그 추가
    .addTag('members', '회원 관리 API') // 태그 추가
    .addTag('email', '이메일 관련 API') // 태그 추가
    .addCookieAuth('refresh_token') // 쿠키 인증 토큰 추가
    .build(); // 문서 빌드

  const document = SwaggerModule.createDocument(app, config); // Swagger 문서 생성
  SwaggerModule.setup('api-docs', app, document, { // Swagger 문서 설정
    swaggerOptions: {
      persistAuthorization: true,
      withCredentials: true,
    },
  });

  // 포트 번호 설정
  const port = process.env.PORT ?? 3000;
  const server = await app.listen(port);
  const router = app.getHttpAdapter().getInstance()._router;
  logger.log('Registered routes:', 
    router.stack
      .filter(layer => layer.route)
      .map(layer => ({
        path: layer.route.path,
        methods: layer.route.methods
      }))
  );
}
bootstrap();
