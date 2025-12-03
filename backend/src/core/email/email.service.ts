import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private configService: ConfigService) {}

  /**
   * Send magic link email
   * In production, integrate with SendGrid, Resend, AWS SES, etc.
   */
  async sendMagicLink(email: string, magicLink: string, tenantName: string) {
    const emailFrom = this.configService.get<string>('EMAIL_FROM') || 'no-reply@proagenda.com';

    // In development, just log the link
    if (process.env.NODE_ENV !== 'production') {
      this.logger.log(`[DEV] Magic Link for ${email}: ${magicLink}`);
      this.logger.log(`[DEV] Full URL: ${magicLink}`);
      return;
    }

    // TODO: Integrate with email service (SendGrid, Resend, etc.)
    // Example with nodemailer or similar:
    // await this.sendEmail({
    //   to: email,
    //   from: emailFrom,
    //   subject: `Acesse sua conta ${tenantName}`,
    //   html: this.getMagicLinkTemplate(magicLink, tenantName),
    // });

    this.logger.warn('Email sending not configured. Magic link:', magicLink);
  }

  private getMagicLinkTemplate(link: string, tenantName: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Acesse sua conta</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #2563eb;">Acesse sua conta ${tenantName}</h1>
            <p>Clique no botão abaixo para fazer login:</p>
            <a href="${link}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">
              Fazer Login
            </a>
            <p style="color: #666; font-size: 14px;">
              Ou copie e cole este link no seu navegador:<br>
              <a href="${link}" style="color: #2563eb; word-break: break-all;">${link}</a>
            </p>
            <p style="color: #666; font-size: 12px; margin-top: 30px;">
              Este link expira em 30 minutos e só pode ser usado uma vez.
            </p>
          </div>
        </body>
      </html>
    `;
  }
}

