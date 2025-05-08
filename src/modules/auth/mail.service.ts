import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import env from 'src/common';

@Injectable()
export class MailService {
  private readonly logger: Logger = new Logger(MailService.name);
  private readonly transporter: nodemailer.Transporter;
  private readonly css = `<style>body{font-family:Arial,sans-serif;background-color:#f4f4f4;margin:0;padding:0;display:flex;justify-content:center;align-items:center;min-height:100vh}.container{background:#fff;padding:40px;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,0.1);text-align:center}h1{color:#333}p{font-size:18px;color:#555}.pin{font-size:32px;font-weight:bold;letter-spacing:4px;background:#eee;display:inline-block;padding:10px 20px;border-radius:8px;margin:20px 0}</style>`;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: 587,
      secure: false,
      auth: {
        user: env.SMTP_EMAIL,
        pass: env.SMTP_PASSWORD
      }
    });
  }
  async sendVerifyEmail(addr: string, token: string) {
    try {
      const mail = await this.transporter.sendMail({
        from: `"The Parking Hub" <${process.env.SMTP_SENDER}>`,
        to: `${addr}`,
        subject: "Confirm your email",
        html: `<a href="${env.APP_URL}/auth/verify-email?token=${token}"></a>`,
      });

      this.logger.log("Verify message %s sent to: %s", mail.messageId, addr);
    } catch (error) {
      throw new Error(`Error sending email to ${addr}`);
    }
  }

  async sendResetPasswordEmail(addr: string, token: string) {
    try {
      const mail = await this.transporter.sendMail({
        from: `"The Parking Hub" <${process.env.SMTP_SENDER}>`,
        to: `${addr}`,
        subject: "Password Reset Request",
        html: `<a href="${env.APP_URL}/auth/reset-password?token=${token}"></a>`
      });

      this.logger.log("Recovery message %s sent to: %s", mail.messageId, addr);
    } catch (error) {
      throw new Error(`Error sending password reset email to ${addr}`);
    }
  }
}
