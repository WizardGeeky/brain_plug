import nodemailer from "nodemailer";
import { Ticket, TicketStatus } from "@prisma/client";

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private static transporter: nodemailer.Transporter | null = null;

  private static readonly APP_URL =
    process.env.APP_URL || "http://localhost:3000";

  private static getFrom(): string {
    return (
      process.env.EMAIL_FROM ||
      process.env.SMTP_FROM ||
      (process.env.SMTP_USER ? `Brain Plug <${process.env.SMTP_USER}>` : "Brain Plug <no-reply@brainplug.ai>")
    );
  }

  /**
   * Initializes or returns the cached nodemailer transport with IPv4 support
   */
  private static getTransporter(): nodemailer.Transporter {
    if (!this.transporter) {
      const host = process.env.SMTP_HOST || "";
      const port = parseInt(process.env.SMTP_PORT || "587", 10);
      const user = process.env.SMTP_USER;
      const pass = process.env.SMTP_PASS || process.env.SMTP_PASSWORD;
      const secure = process.env.SMTP_SECURE === "true" || port === 465;

      if (user && pass) {
        if (host.includes("gmail") || user.endsWith("@gmail.com")) {
          // Gmail built-in preset with connection timeouts
          this.transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
              user,
              pass,
            },
            connectionTimeout: 4000,
            greetingTimeout: 4000,
            socketTimeout: 5000,
          });
        } else {
          this.transporter = nodemailer.createTransport({
            host,
            port,
            secure,
            auth: {
              user,
              pass,
            },
            connectionTimeout: 4000,
            greetingTimeout: 4000,
            socketTimeout: 5000,
            tls: {
              rejectUnauthorized: false,
            },
          });
        }
      } else {
        // Fallback to stream/json transport when SMTP is not configured
        this.transporter = nodemailer.createTransport({
          jsonTransport: true,
        });
      }
    }
    return this.transporter;
  }

  /**
   * Send transactional email using Nodemailer or Resend quietly
   */
  public static async send(options: EmailOptions): Promise<boolean> {
    try {
      // If RESEND_API_KEY is configured, send via Resend HTTP API
      if (process.env.RESEND_API_KEY) {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: this.getFrom(),
            to: [options.to],
            subject: options.subject,
            html: options.html,
            text: options.text || options.html.replace(/<[^>]*>?/gm, ""),
          }),
        });

        return res.ok;
      }

      // Default: Nodemailer SMTP
      const transporter = this.getTransporter();

      await transporter.sendMail({
        from: this.getFrom(),
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || options.html.replace(/<[^>]*>?/gm, ""),
      });

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Send Welcome Onboarding Email to newly created Client Admin
   */
  public static async sendWelcomeOnboarding(
    to: string,
    fullName: string,
    companyName: string,
    onboardingToken: string
  ): Promise<boolean> {
    const onboardingLink = `${this.APP_URL}/onboarding?token=${onboardingToken}`;
    const subject = `Welcome to Brain Plug - Set up your ${companyName} account`;
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; background-color: #fbf9fe; border-radius: 16px; border: 1px solid #dec1f7;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #7c32c4; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">Brain Plug</h1>
          <p style="color: #672ca0; margin-top: 4px; font-size: 14px;">Enterprise AI Agent Infrastructure</p>
        </div>
        <div style="background: #ffffff; padding: 32px; border-radius: 12px; border: 1px solid #dec1f7; box-shadow: 0 4px 12px rgba(124, 50, 196, 0.05);">
          <h2 style="color: #1e1b4b; margin-top: 0; font-size: 20px;">Welcome, ${fullName}!</h2>
          <p style="color: #4b5563; font-size: 15px; line-height: 1.6;">
            Your workspace for <strong>${companyName}</strong> is ready. Click the button below to complete your profile setup and access your AI agent infrastructure with passwordless OTP login.
          </p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${onboardingLink}" style="background-color: #7c32c4; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block;">
              Complete Account Setup
            </a>
          </div>
          <p style="color: #6b7280; font-size: 13px; line-height: 1.5;">
            Or copy and paste this link into your browser:<br/>
            <a href="${onboardingLink}" style="color: #7c32c4; word-break: break-all;">${onboardingLink}</a>
          </p>
          <p style="color: #9ca3af; font-size: 12px; margin-top: 24px; border-top: 1px solid #f3f4f6; padding-top: 16px;">
            This invitation link is valid for 48 hours. If you did not expect this invitation, please ignore this email.
          </p>
        </div>
      </div>
    `;

    return this.send({
      to,
      subject,
      html,
      text: `Welcome to Brain Plug! Complete your account setup here: ${onboardingLink}`,
    });
  }

  /**
   * Send 6-Digit OTP Email for Passwordless Login
   */
  public static async sendOtpEmail(
    to: string,
    otp: string,
    purpose: string
  ): Promise<boolean> {
    const purposeTitle =
      purpose === "EMAIL_VERIFICATION"
        ? "Email Verification Code"
        : "Sign-In Verification Code";

    const subject = `${otp} is your Brain Plug verification code`;
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; background-color: #fbf9fe; border-radius: 16px; border: 1px solid #dec1f7;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #7c32c4; margin: 0; font-size: 28px; font-weight: 800;">Brain Plug</h1>
        </div>
        <div style="background: #ffffff; padding: 32px; border-radius: 12px; border: 1px solid #dec1f7;">
          <h2 style="color: #1e1b4b; margin-top: 0; font-size: 18px;">${purposeTitle}</h2>
          <p style="color: #4b5563; font-size: 15px;">Use this 6-digit one-time passcode to complete your sign-in:</p>
          <div style="background: #f5f0fd; border-radius: 8px; border: 1px dashed #7c32c4; text-align: center; padding: 18px; margin: 24px 0;">
            <span style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #7c32c4;">${otp}</span>
          </div>
          <p style="color: #6b7280; font-size: 13px;">This code will expire in 5 minutes. Never share this code with anyone.</p>
        </div>
      </div>
    `;

    return this.send({
      to,
      subject,
      html,
      text: `Your Brain Plug verification code is: ${otp} (expires in 5 minutes).`,
    });
  }

  /**
   * Send New Ticket Notification to Assigned Admin or Client
   */
  public static async sendTicketCreatedNotification(
    ticket: Ticket,
    companyName: string,
    creatorName: string,
    recipientEmail: string,
    isAdminNotification: boolean
  ): Promise<boolean> {
    const subject = isAdminNotification
      ? `[Ticket #${ticket.ticketNumber}] New Support Request from ${companyName}`
      : `[Ticket #${ticket.ticketNumber}] Your Support Request Has Been Received`;

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #ffffff; border: 1px solid #dec1f7; border-radius: 12px;">
        <h2 style="color: #7c32c4; margin-top: 0;">${subject}</h2>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px;">
          <tr><td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Ticket Number:</td><td style="padding: 8px 0; font-weight: 700; color: #1e1b4b;">#${ticket.ticketNumber}</td></tr>
          <tr><td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Client:</td><td style="padding: 8px 0; color: #1e1b4b;">${companyName} (${creatorName})</td></tr>
          <tr><td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Priority:</td><td style="padding: 8px 0; color: #dc2626; font-weight: 700;">${ticket.priority}</td></tr>
          <tr><td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Category:</td><td style="padding: 8px 0; color: #4b5563;">${ticket.category}</td></tr>
          <tr><td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Subject:</td><td style="padding: 8px 0; color: #1e1b4b; font-weight: 600;">${ticket.title}</td></tr>
        </table>
        <div style="background-color: #f9fafb; border-left: 4px solid #7c32c4; padding: 12px 16px; margin: 16px 0; font-size: 14px; color: #374151;">
          ${ticket.description}
        </div>
      </div>
    `;

    return this.send({
      to: recipientEmail,
      subject,
      html,
    });
  }

  /**
   * Send Ticket Reply Notification
   */
  public static async sendTicketReplyNotification(
    ticket: Ticket,
    senderName: string,
    messageContent: string,
    recipientEmail: string,
    isAdminNotification: boolean
  ): Promise<boolean> {
    const subject = `[Ticket #${ticket.ticketNumber}] New Reply: ${ticket.title}`;
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #ffffff; border: 1px solid #dec1f7; border-radius: 12px;">
        <h2 style="color: #7c32c4; margin-top: 0;">New Response on Ticket #${ticket.ticketNumber}</h2>
        <p style="color: #4b5563; font-size: 14px;"><strong>${senderName}</strong> (${isAdminNotification ? "Support" : "Client"}) replied:</p>
        <div style="background-color: #f9fafb; border-left: 4px solid #7c32c4; padding: 12px 16px; margin: 16px 0; font-size: 14px; color: #374151;">
          ${messageContent}
        </div>
      </div>
    `;

    return this.send({
      to: recipientEmail,
      subject,
      html,
    });
  }

  /**
   * Send Ticket Status Change Notification
   */
  public static async sendTicketStatusNotification(
    ticket: Ticket,
    newStatus: TicketStatus,
    recipientEmail: string,
    isAdminNotification: boolean
  ): Promise<boolean> {
    const subject = `[Ticket #${ticket.ticketNumber}] Status Updated to ${newStatus}`;
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #ffffff; border: 1px solid #dec1f7; border-radius: 12px;">
        <h2 style="color: #7c32c4; margin-top: 0;">Ticket #${ticket.ticketNumber} Status Changed</h2>
        <p style="color: #4b5563; font-size: 14px;">The status for <strong>"${ticket.title}"</strong> has been changed to <strong>${newStatus}</strong>.</p>
      </div>
    `;

    return this.send({
      to: recipientEmail,
      subject,
      html,
    });
  }
}
