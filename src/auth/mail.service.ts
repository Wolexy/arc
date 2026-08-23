import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {

  private transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: 587,
    secure: false,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

  async sendVerification(email: string, token: string) {

    const url = `http://localhost:4200/verify-email?token=${token}`;

    const message = {
      from: '"ARC Assessment" <kolaajala@gmail.com>',
      to: email,
      subject: 'Verify your account',
      html: `
        <h2>Verify your email</h2>
        <p>Please click the link below to activate your account:</p>
        <a href="${url}">${url}</a>
      `,
    };

    try {

      await this.transporter.sendMail(message);

     // console.log('Verification email sent to:', email);

    } catch (err) {

      console.log('Email server not available. Running in DEV mode.');
      console.log('Verification link:', url);

    }

  }

}