import { Injectable, Logger } from "@nestjs/common";
import { EmailServicePort } from "../../application/ports/ports";

@Injectable()
export class ConsoleEmailService implements EmailServicePort {
  private readonly logger = new Logger(ConsoleEmailService.name);

  async sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3002";
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

    // En desarrollo, solo logueamos el enlace
    this.logger.log(`========================================`);
    this.logger.log(`Password Reset Email (Console Mode)`);
    this.logger.log(`To: ${email}`);
    this.logger.log(`Reset URL: ${resetUrl}`);
    this.logger.log(`========================================`);

    // En producción, aquí se integraría con SendGrid, AWS SES, Nodemailer, etc.
    // Ejemplo con SendGrid:
    // await sgMail.send({
    //   to: email,
    //   from: process.env.EMAIL_FROM!,
    //   subject: "Password Reset Request",
    //   text: `Click here to reset your password: ${resetUrl}`,
    //   html: `<p>Click <a href="${resetUrl}">here</a> to reset your password.</p>`,
    // });
  }
}

// Implementación para SendGrid (descomentar cuando se necesite)
/*
import * as sgMail from "@sendgrid/mail";

@Injectable()
export class SendGridEmailService implements EmailServicePort {
  private readonly logger = new Logger(SendGridEmailService.name);

  constructor() {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY!);
  }

  async sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3002";
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

    await sgMail.send({
      to: email,
      from: process.env.EMAIL_FROM!,
      subject: "Password Reset Request - Support Ticket System",
      text: `You requested a password reset. Click the link below to reset your password:\n\n${resetUrl}\n\nThis link will expire in 1 hour.\n\nIf you didn't request this, please ignore this email.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset Request</h2>
          <p>You requested a password reset for your Support Ticket System account.</p>
          <p>Click the button below to reset your password:</p>
          <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px; margin: 16px 0;">
            Reset Password
          </a>
          <p style="color: #666; font-size: 14px;">Or copy and paste this link:</p>
          <p style="color: #666; font-size: 14px; word-break: break-all;">${resetUrl}</p>
          <p style="color: #666; font-size: 14px;">This link will expire in 1 hour.</p>
          <hr style="margin: 24px 0; border: none; border-top: 1px solid #eee;" />
          <p style="color: #999; font-size: 12px;">If you didn't request this password reset, please ignore this email.</p>
        </div>
      `,
    });

    this.logger.log(`Password reset email sent to ${email}`);
  }
}
*/
