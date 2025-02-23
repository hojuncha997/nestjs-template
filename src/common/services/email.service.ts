// src/common/services/email.service.ts
// 이메일 서비스
import { EmailUtil } from '@common/utils/email-encryption.util';
import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';  // 이메일 전송을 위한 패키지. pnpm add nodemailer @types/nodemailer

interface EmailOptions {
  to: string;
  subject: string;
  html?: string;
  template?: string;
  context: Record<string, any>;
}

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  // constructor() {
  //   // 개발 환경용 테스트 계정 생성
  //   nodemailer.createTestAccount().then(account => {
  //     this.transporter = nodemailer.createTransport({
  //       host: account.smtp.host,
  //       port: account.smtp.port,
  //       secure: account.smtp.secure,
  //       auth: {
  //         user: account.user,
  //         pass: account.pass,
  //       },
  //     });
  //   });
  // }



  constructor() {
    // Gmail 전송 설정
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      },
    });
  }
  



  async send(options: EmailOptions): Promise<void> {
    // 디버깅을 위한 로그
    if (options.context.verificationLink) {
      console.log('Verification Link:', options.context.verificationLink);
    }
    if (options.context.resetLink) {
      console.log('Reset Link:', options.context.resetLink);
    }

    // 이메일 발송
    const info = await this.transporter.sendMail({
      from: '"personal-cms" <noreply@myapp.com>',
      to: options.to,
      subject: options.subject,
      html: options.html,  // 전달받은 html 사용
    });

    // 개발 환경에서 이메일 확인용 URL 출력
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
  }
} 