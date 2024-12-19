// 스프링부트의 @SpringBootApplication가 붙어있는 파일(메인함수가 있는 파일)에 대응되는 파일

// 유효성 검사 파이프 추가
import { ValidationPipe } from '@nestjs/common';


import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe()); // 전역 유효성 검사 파이프 추가
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
