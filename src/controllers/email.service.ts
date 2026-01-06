// src/services/email.service.ts
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

interface SendInviteEmailParams {
  to: string;
  subject: string;
  body: string;
  code: string;
  image?: string;
}

export class EmailService {
  private sesClient: SESClient;
  private fromEmail: string;

  constructor() {
    this.sesClient = new SESClient({ 
      region: process.env.AWS_REGION || 'us-east-1' 
    });
    this.fromEmail = process.env.FROM_EMAIL || 'noreply@mozaiqretail.com';
  }

  /**
   * Send invitation email with code
   */
  async sendInviteEmail(params: SendInviteEmailParams): Promise<void> {
    const { to, subject, body, code, image } = params;

    const htmlBody = this.createInvitationHtml({ body, code, image });

    const command = new SendEmailCommand({
      Source: this.fromEmail,
      Destination: {
        ToAddresses: [to]
      },
      Message: {
        Subject: {
          Data: subject,
          Charset: 'UTF-8'
        },
        Body: {
          Html: {
            Data: htmlBody,
            Charset: 'UTF-8'
          },
          Text: {
            Data: body,
            Charset: 'UTF-8'
          }
        }
      }
    });

    try {
      const response = await this.sesClient.send(command);
      console.log('Email sent successfully:', response.MessageId);
    } catch (error) {
      console.error('Failed to send email:', error);
      throw new Error('Failed to send invitation email');
    }
  }

  /**
   * Create HTML email template
   */
  private createInvitationHtml(params: { body: string; code: string; image?: string }): string {
    const appUrl = process.env.APP_URL;
    const { body, code, image } = params;
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mozaiq Invitation</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #5b9279 0%, #2b5345 100%);
      padding: 40px 20px;
      text-align: center;
    }
    .header img {
      max-width: 200px;
      height: auto;
      margin-bottom: 20px;
    }
    .header h1 {
      color: white;
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }
    .content {
      padding: 40px 30px;
    }
    .code-box {
      background: linear-gradient(135deg, rgba(91, 146, 121, 0.1) 0%, rgba(43, 83, 69, 0.05) 100%);
      border: 2px solid #5b9279;
      border-radius: 8px;
      padding: 20px;
      margin: 30px 0;
      text-align: center;
    }
    .code-label {
      font-size: 14px;
      color: #666;
      margin-bottom: 10px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .code {
      font-size: 32px;
      font-weight: 700;
      color: #2b5345;
      letter-spacing: 2px;
      font-family: 'Courier New', monospace;
      word-break: break-all;
    }
    .message {
      font-size: 16px;
      color: #444;
      margin: 20px 0;
      white-space: pre-line;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #5b9279 0%, #2b5345 100%);
      color: white;
      padding: 14px 32px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      margin: 20px 0;
    }
    .footer {
      background: #f9f9f9;
      padding: 20px 30px;
      text-align: center;
      font-size: 14px;
      color: #666;
      border-top: 1px solid #e0e0e0;
    }
    .expiry-notice {
      background: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 12px 16px;
      margin: 20px 0;
      font-size: 14px;
      color: #856404;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      ${image ? `<img src="${image}" alt="Mozaiq">` : ''}
      <h1>You're Invited to Mozaiq!</h1>
    </div>
    
    <div class="content">
      <div class="message">${body}</div>
      
      <div class="code-box">
        <div class="code-label">Your Invitation Code</div>
        <div class="code">${code}</div>
      </div>
      
      <div class="expiry-notice">
        ⏰ This invitation code expires in 24 hours
      </div>
      
      <div style="text-align: center;">
      <!--
        <a href="${appUrl}" class="cta-button">
          Join Now
        </a>
        -->
      </div>
    </div>
    
    <div class="footer">
      <p>
        This invitation was sent to you on behalf of a Mozaiq team member.<br>
        If you weren't expecting this email, you can safely ignore it.
      </p>
      <p style="margin-top: 20px; color: #999;">
        © ${new Date().getFullYear()} Mozaiq. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
    `.trim();
  }
}