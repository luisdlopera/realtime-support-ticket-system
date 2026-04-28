import { Injectable, Logger, BadRequestException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { EmailServicePort } from "../../application/ports/ports";
import { ERROR_MESSAGES } from "../../../common/constants/error-messages.constants";

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
  }
}

/**
 * SendGrid Email Service for Production
 * Requires @sendgrid/mail package to be installed
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SendGridMail = any;

@Injectable()
export class SendGridEmailService implements EmailServicePort {
  private readonly logger = new Logger(SendGridEmailService.name);
  private sgMail: SendGridMail | null = null;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>("SENDGRID_API_KEY");
    if (apiKey) {
      try {
        // Dynamic import to avoid dependency issues when not using SendGrid
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const sgMailLib = require("@sendgrid/mail");
        if (sgMailLib) {
          sgMailLib.setApiKey(apiKey);
          this.sgMail = sgMailLib;
        }
      } catch (error) {
        this.logger.error("Failed to initialize SendGrid. Please install @sendgrid/mail package:", error);
      }
    }
  }

  async sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
    if (!this.sgMail) {
      throw new BadRequestException("SendGrid not configured");
    }

    const frontendUrl = this.config.get<string>("FRONTEND_URL") || "http://localhost:3002";
    const emailFrom = this.config.get<string>("EMAIL_FROM") || "noreply@support.local";
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

    const msg = {
      to: email,
      from: emailFrom,
      subject: "Password Reset Request - Support Ticket System",
      text: `You requested a password reset. Click the link below to reset your password:\n\n${resetUrl}\n\nThis link will expire in 1 hour.\n\nIf you didn't request this, please ignore this email.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p style="color: #555;">You requested a password reset for your Support Ticket System account.</p>
          <p style="color: #555;">Click the button below to reset your password:</p>
          <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px; margin: 16px 0;">
            Reset Password
          </a>
          <p style="color: #666; font-size: 14px;">Or copy and paste this link:</p>
          <p style="color: #666; font-size: 14px; word-break: break-all; background: #f5f5f5; padding: 10px; border-radius: 4px;">${resetUrl}</p>
          <p style="color: #666; font-size: 14px;">This link will expire in 1 hour.</p>
          <hr style="margin: 24px 0; border: none; border-top: 1px solid #eee;" />
          <p style="color: #999; font-size: 12px;">If you didn't request this password reset, please ignore this email.</p>
        </div>
      `,
    };

    try {
      await this.sgMail.send(msg);
      this.logger.log(`Password reset email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${email}:`, error);
      throw new BadRequestException("Failed to send password reset email");
    }
  }
}

/**
 * Factory to create the appropriate email service based on configuration
 */
export function createEmailService(
  config: ConfigService
): EmailServicePort {
  const emailService = config.get<string>("EMAIL_SERVICE") || "console";

  switch (emailService.toLowerCase()) {
    case "sendgrid":
      return new SendGridEmailService(config);
    case "console":
    default:
      return new ConsoleEmailService();
  }
}
