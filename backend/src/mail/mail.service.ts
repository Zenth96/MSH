import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST ?? 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendVerificationCode(email: string, code: string): Promise<void> {
    const html = this.buildTemplate(code);

    try {
      await this.transporter.sendMail({
        from: process.env.MAIL_FROM || process.env.SMTP_USER || '"MSH" <noreply@msh.app>',
        to: email,
        subject: 'Verify your email — MSH',
        html,
      });
      this.logger.log(`Verification email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${email}: ${error}`);
      throw error;
    }
  }

  private buildTemplate(code: string): string {
    const digits = code.split('').join('');

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#0f0f13;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f0f13;">
    <tr><td align="center" style="padding:24px 16px;">
      <table width="400" cellpadding="0" cellspacing="0" style="max-width:400px;">
        <tr>
          <td style="text-align:center;padding:0 0 16px 0;">
            <span style="color:#4f6ef7;font-size:22px;font-weight:700;letter-spacing:1px;">MSH</span>
          </td>
        </tr>
        <tr>
          <td style="background-color:#1a1a23;border-radius:16px;padding:24px;">
            <h1 style="color:#ffffff;font-size:18px;font-weight:600;margin:0 0 6px 0;">Verify your email</h1>
            <p style="color:#9ca3af;font-size:14px;line-height:1.4;margin:0 0 20px 0;">
              Use the code below to verify your email. Expires in 10 minutes.
            </p>
            <div style="text-align:center;margin-bottom:20px;">
              <span style="display:inline-block;font-size:32px;font-weight:700;letter-spacing:10px;color:#4f6ef7;background:#12121b;padding:12px 20px;border-radius:10px;font-family:monospace;">
                ${digits}
              </span>
            </div>
            <p style="color:#6b7280;font-size:12px;line-height:1.4;margin:0;text-align:center;">
              If you didn't create an account, ignore this email.
            </p>
          </td>
        </tr>
        <tr>
          <td style="text-align:center;padding-top:16px;">
            <p style="color:#4b5563;font-size:11px;margin:0;">&copy; 2026 MSH</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
  }
}
