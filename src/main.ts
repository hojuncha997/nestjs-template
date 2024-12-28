// src/main.ts
// 애플리케이션 진입점
// 스프링부트의 @SpringBootApplication가 붙어있는 파일(메인함수가 있는 파일)에 대응되는 파일

// 유효성 검사 파이프 추가
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';

import { NestFactory } from '@nestjs/core';
// Swagger 모듈 추가
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  console.log('DB Connection Info:', {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    username: process.env.DB_USERNAME,
    database: process.env.DB_DATABASE,
    // password는 보안상 출력하지 않음
  });
  
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // DTO에 정의되지 않은 속성은 제거
    forbidNonWhitelisted: true, // DTO에 정의되지 않은 속성이 있으면 요청 자체를 막음
    transform: true, // 요청 데이터를 DTO 클래스의 인스턴스로 변환
  }));
  
  // CORS 허용
  app.enableCors({
    origin: true, // 또는 특정 도메인 'http://localhost:3000'
    credentials: true, // 쿠키 전송을 위해 필요
    exposedHeaders: ['set-cookie'], // 쿠키 헤더 노출
    /*
    브라우저는 CORS 정책에 따라 쿠키를 처리
    하지만 CORS 설정에 credentials: true가 없으면:
    브라우저가 다른 도메인의 쿠키를 수락하지 않음
    Set-Cookie 헤더가 무시됨
    결과적으로 리프레시 토큰이 저장되지 않음
    */
  });
  
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

  console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
  
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
