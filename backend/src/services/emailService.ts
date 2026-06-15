import nodemailer from 'nodemailer';

let transporter: nodemailer.Transporter | null = null;

// Initialize transporter
async function getTransporter(): Promise<nodemailer.Transporter> {
  if (transporter) return transporter;

  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = parseInt(process.env.SMTP_PORT || '587');
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  const sendgridApiKey = process.env.SENDGRID_API_KEY;

  if (sendgridApiKey) {
    console.log('✉️ Email Service: Using SendGrid SMTP');
    transporter = nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      auth: {
        user: 'apikey',
        pass: sendgridApiKey
      }
    });
    return transporter;
  }

  if (smtpHost && smtpUser && smtpPass) {
    console.log(`✉️ Email Service: Using configured SMTP (${smtpHost})`);
    transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    });
    return transporter;
  }

  // Fallback: Create Ethereal test account automatically
  console.log('✉️ Email Service: No SMTP configured. Creating Ethereal Test Account...');
  try {
    const testAccount = await nodemailer.createTestAccount();
    console.log(`✉️ Email Service: Ethereal Account Created!`);
    console.log(`   User: ${testAccount.user}`);
    console.log(`   Pass: ${testAccount.pass}`);
    
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
    return transporter;
  } catch (error) {
    console.error('❌ Failed to create Ethereal email test account, falling back to console mailer', error);
    // Console log fallback transporter
    transporter = {
      sendMail: async (mailOptions: any) => {
        console.log('========================================');
        console.log('📧 CONSOLE EMAIL LOGGER:');
        console.log(`To: ${mailOptions.to}`);
        console.log(`Subject: ${mailOptions.subject}`);
        console.log(`Body:\n${mailOptions.text || mailOptions.html}`);
        console.log('========================================');
        return { messageId: 'console-fake-id' };
      }
    } as any;
    return transporter!;
  }
}

export async function sendVerificationEmail(email: string, name: string, token: string) {
  const t = await getTransporter();
  const url = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${token}`;
  
  const mailOptions = {
    from: process.env.SENDGRID_FROM_EMAIL || '"BillHouse" <noreply@billhouse.com>',
    to: email,
    subject: 'Verify your BillHouse Account',
    text: `Hello ${name},\n\nPlease verify your BillHouse account by clicking the following link:\n${url}\n\nThis link will expire in 24 hours.\n\nThank you,\nThe BillHouse Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f0f0f0; border-radius: 8px;">
        <h2 style="color: #061B2D; text-align: center;">Welcome to BillHouse!</h2>
        <p>Hello <strong>${name}</strong>,</p>
        <p>Thank you for signing up. Please verify your email address to unlock your invoicing dashboard.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${url}" style="background-color: #2F8F7A; color: #FFFFFF; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Verify Email Address</a>
        </div>
        <p>If the button doesn't work, copy and paste this link in your browser:</p>
        <p style="word-break: break-all; color: #5F6B76;"><a href="${url}">${url}</a></p>
        <hr style="border: 0; border-top: 1px solid #e0e0e0; margin: 20px 0;">
        <p style="font-size: 12px; color: #5F6B76; text-align: center;">This link will expire in 24 hours. If you did not create an account, please ignore this email.</p>
      </div>
    `
  };

  const info = await t.sendMail(mailOptions);
  
  // Log ethereal email preview link if available
  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log(`📧 Verification email sent. Preview URL: ${previewUrl}`);
  } else {
    console.log(`📧 Verification email sent to ${email}. Link: ${url}`);
  }
  return info;
}

export async function sendResetPasswordEmail(email: string, name: string, token: string) {
  const t = await getTransporter();
  const url = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}`;

  const mailOptions = {
    from: process.env.SENDGRID_FROM_EMAIL || '"BillHouse" <noreply@billhouse.com>',
    to: email,
    subject: 'Reset your BillHouse Password',
    text: `Hello ${name},\n\nYou requested a password reset. Please reset it by clicking this link:\n${url}\n\nThis link will expire in 1 hour.\n\nThank you,\nThe BillHouse Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f0f0f0; border-radius: 8px;">
        <h2 style="color: #061B2D; text-align: center;">Reset Your Password</h2>
        <p>Hello <strong>${name}</strong>,</p>
        <p>We received a request to reset the password for your BillHouse account. Click the button below to set a new password.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${url}" style="background-color: #E76F51; color: #FFFFFF; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
        </div>
        <p>If the button doesn't work, copy and paste this link in your browser:</p>
        <p style="word-break: break-all; color: #5F6B76;"><a href="${url}">${url}</a></p>
        <hr style="border: 0; border-top: 1px solid #e0e0e0; margin: 20px 0;">
        <p style="font-size: 12px; color: #5F6B76; text-align: center;">This link will expire in 1 hour. If you did not request a password reset, please ignore this email.</p>
      </div>
    `
  };

  const info = await t.sendMail(mailOptions);
  
  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log(`📧 Password reset email sent. Preview URL: ${previewUrl}`);
  } else {
    console.log(`📧 Password reset email sent to ${email}. Link: ${url}`);
  }
  return info;
}
