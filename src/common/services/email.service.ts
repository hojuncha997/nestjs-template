// src/common/services/email.service.ts
// 이메일 서비스
import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';  // 이메일 전송을 위한 패키지. pnpm add nodemailer @types/nodemailer

interface EmailOptions {
  to: string;
  subject: string;
  template: string;
  context: Record<string, any>;
}

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // 개발 환경용 테스트 계정 생성
    nodemailer.createTestAccount().then(account => {
      this.transporter = nodemailer.createTransport({
        host: account.smtp.host,
        port: account.smtp.port,
        secure: account.smtp.secure,
        auth: {
          user: account.user,
          pass: account.pass,
        },
      });
    });
  }

  async send(options: EmailOptions): Promise<void> {
    // 템플릿 렌더링 (예시)
    const html = `
      <h1>이메일 인증</h1>
      <p>안녕하세요 ${options.context.name}님,</p>
      <p>아래 링크를 클릭하여 이메일 인증을 완료해주세요:</p>
      <a href="${options.context.verificationLink}">이메일 인증하기</a>
      <p>이 링크는 ${options.context.expiresIn} 동안 유효합니다.</p>
    `;

    // 이메일 발송
    const info = await this.transporter.sendMail({
      from: '"My App" <noreply@myapp.com>',
      to: options.to,
      subject: options.subject,
      html: html,
    });

    // 개발 환경에서 이메일 확인용 URL 출력
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
  }
} 