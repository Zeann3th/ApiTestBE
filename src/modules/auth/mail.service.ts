import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import env from 'src/common';

@Injectable()
export class MailService {
  private readonly logger: Logger = new Logger(MailService.name);
  private readonly transporter: nodemailer.Transporter;

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
  async sendVerifyEmail(name: string, addr: string, token: string) {
    try {
      const mail = await this.transporter.sendMail({
        from: `"The Parking Hub" <${process.env.SMTP_SENDER}>`,
        to: `${addr}`,
        subject: "Confirm your email",
        html: `<!DOCTYPE html>
                  <html>
                    <body style="font-family: Arial, sans-serif; color: #333;">
                      <h2>Welcome to Postman! 🎉</h2>
                      <p>Hi ${name},</p>

                      <p>Thanks for signing up! Click the button below to verify your email and activate your account:</p>
                      <p style="text-align: center;">
                        <a href="${env.APP_URL}/auth/verify-email?token=${token}"></a>" style="background-color: #16578f; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Verify Email</a>
                      </p>

                      <p>If you didn’t sign up for Postman, you can safely ignore this email.</p>

                      <hr />
                      <small>This link will expire in 15 minutes.</small>
                    </body>
                  </html>`,
      });

      this.logger.log("Verify message %s sent to: %s", mail.messageId, addr);
    } catch (error) {
      throw new Error(`Error sending email to ${addr}`);
    }
  }

  async sendResetPasswordEmail(name: string, addr: string, token: string) {
    try {
      const mail = await this.transporter.sendMail({
        from: `"The Parking Hub" <${process.env.SMTP_SENDER}>`,
        to: `${addr}`,
        subject: "Password Reset Request",
        html: `<!DOCTYPE html>
                <html>
                  <body style="font-family: Arial, sans-serif; color: #333;">
                    <h2>Password Reset Request 🔐</h2>
                    <p>Hi ${name},</p>
                    <p>We received a request to reset your password. Click the button below to set a new one:</p>

                    <p style="text-align: center;">
                      <a href="${env.APP_URL}/auth/reset-password?token=${token}" style="background-color: #49a75d; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Reset Password</a>
                    </p>

                    <p>If you didn’t request a password reset, just ignore this email—your current password will still work.</p>

                    <hr />
                    <small>This link will expire in 15 minutes.</small>
                  </body>
                </html>`,
      });

      this.logger.log("Recovery message %s sent to: %s", mail.messageId, addr);
    } catch (error) {
      throw new Error(`Error sending password reset email to ${addr}`);
    }
  }
}
