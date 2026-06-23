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

export async function sendInvoiceEmail(email: string, clientName: string, invoice: any, business: any) {
  const t = await getTransporter();
  const currencySymbol = invoice.currency === 'INR' ? '₹' : invoice.currency || '₹';
  const amountStr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(invoice.totalAmount);
  const dueDateStr = new Date(invoice.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const themeColor = invoice.colorTheme || '#3b4b5c';

  const itemRows = invoice.items.map((item: any) => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #f0f0f0;">
        <strong>${item.description}</strong><br>
        <span style="font-size: 11px; color: #5f6b76;">GST Rate: ${item.gstRate}%</span>
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #f0f0f0; text-align: right;">${item.quantity} ${item.unit || 'items'}</td>
      <td style="padding: 10px; border-bottom: 1px solid #f0f0f0; text-align: right;">${currencySymbol}${item.rate}</td>
      <td style="padding: 10px; border-bottom: 1px solid #f0f0f0; text-align: right;"><strong>${currencySymbol}${item.amount}</strong></td>
    </tr>
  `).join('');

  const mailOptions = {
    from: process.env.SENDGRID_FROM_EMAIL || '"BillHouse" <noreply@billhouse.com>',
    to: email,
    subject: `Invoice ${invoice.number} from ${business.name}`,
    text: `Hello ${clientName},\n\nYou have received a new invoice ${invoice.number} from ${business.name} for the amount of ${amountStr}, due on ${dueDateStr}.\n\nThank you,\n${business.name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f0f0f0; border-radius: 8px;">
        <div style="text-align: center; border-bottom: 3px solid ${themeColor}; padding-bottom: 15px;">
          <h2 style="color: #061B2D; margin: 0;">${business.name}</h2>
          <p style="font-size: 12px; color: #5f6b76; margin: 5px 0 0 0;">${business.address || ''}, ${business.city || ''}</p>
        </div>
        <div style="margin: 20px 0;">
          <p>Hello <strong>${clientName}</strong>,</p>
          <p>Please find the invoice details for statement <strong>${invoice.number}</strong> below:</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px;">
            <thead>
              <tr style="background-color: #f8fafc; text-align: left; font-weight: bold; border-bottom: 2px solid ${themeColor};">
                <th style="padding: 10px;">Item</th>
                <th style="padding: 10px; text-align: right;">Qty</th>
                <th style="padding: 10px; text-align: right;">Price</th>
                <th style="padding: 10px; text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${itemRows}
            </tbody>
          </table>
          
          <div style="text-align: right; font-size: 14px; margin-top: 20px;">
            <p style="margin: 5px 0;">Subtotal: <strong>${currencySymbol}${invoice.subtotal}</strong></p>
            <p style="margin: 5px 0;">Tax: <strong>${currencySymbol}${invoice.gstAmount}</strong></p>
            ${invoice.discountAmount > 0 ? `<p style="margin: 5px 0; color: #e74c3c;">Discount: <strong>-${currencySymbol}${invoice.discountAmount}</strong></p>` : ''}
            ${invoice.tdsRate > 0 ? `<p style="margin: 5px 0; color: #7f8c8d;">TDS (${invoice.tdsRate}%): <strong>-${currencySymbol}${invoice.tdsAmount}</strong></p>` : ''}
            <h3 style="color: ${themeColor}; margin: 10px 0 0 0;">Total Due: ${amountStr}</h3>
            <p style="font-size: 12px; color: #5f6b76;">Due Date: <strong>${dueDateStr}</strong></p>
          </div>
        </div>

        ${business.bankAccount ? `
        <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0; font-size: 12px;">
          <p style="font-weight: bold; color: #061B2D; margin: 0 0 10px 0;">Payment Details (Bank Transfer):</p>
          <p style="margin: 3px 0;">Bank: <strong>${business.bankName || ''}</strong></p>
          <p style="margin: 3px 0;">Account: <strong>${business.bankAccount}</strong></p>
          <p style="margin: 3px 0;">IFSC Code: <strong>${business.bankIfsc || ''}</strong></p>
        </div>
        ` : ''}

        <hr style="border: 0; border-top: 1px solid #e0e0e0; margin: 20px 0;">
        <p style="font-size: 11px; color: #5F6B76; text-align: center;">Powered by BillHouse. If you have any questions, please contact the sender directly.</p>
      </div>
    `
  };

  const info = await t.sendMail(mailOptions);
  return info;
}

export async function sendPaymentReminderEmail(email: string, clientName: string, invoice: any, business: any) {
  const t = await getTransporter();
  const currencySymbol = invoice.currency === 'INR' ? '₹' : invoice.currency || '₹';
  const outstandingStr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(invoice.amountDue);
  const dueDateStr = new Date(invoice.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const themeColor = invoice.colorTheme || '#3b4b5c';

  const mailOptions = {
    from: process.env.SENDGRID_FROM_EMAIL || '"BillHouse" <noreply@billhouse.com>',
    to: email,
    subject: `Payment Reminder: Invoice ${invoice.number} is overdue`,
    text: `Hello ${clientName},\n\nThis is a friendly reminder that invoice ${invoice.number} from ${business.name} was due on ${dueDateStr}. The outstanding amount is ${outstandingStr}.\n\nPlease arrange for payment as soon as possible.\n\nThank you,\n${business.name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f0f0f0; border-radius: 8px;">
        <div style="text-align: center; border-bottom: 3px solid #e74c3c; padding-bottom: 15px;">
          <h2 style="color: #061B2D; margin: 0;">Payment Reminder</h2>
          <p style="font-size: 13px; color: #e74c3c; margin: 5px 0 0 0; font-weight: bold;">Invoice ${invoice.number} is Overdue</p>
        </div>
        <div style="margin: 20px 0;">
          <p>Hello <strong>${clientName}</strong>,</p>
          <p>This is a friendly reminder that payment for invoice <strong>${invoice.number}</strong> issued by <strong>${business.name}</strong> was due on <strong>${dueDateStr}</strong>.</p>
          
          <div style="background-color: #fdf2f2; border-left: 4px solid #e74c3c; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0; font-size: 13px; color: #5f6b76;">Outstanding Balance:</p>
            <h3 style="margin: 5px 0 0 0; color: #e74c3c; font-size: 20px; font-weight: 900;">${outstandingStr}</h3>
          </div>

          <p>Please review the statement details and arrange for bank transfer / settlement at your earliest convenience.</p>
        </div>

        ${business.bankAccount ? `
        <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0; font-size: 12px;">
          <p style="font-weight: bold; color: #061B2D; margin: 0 0 10px 0;">Payment Details (Bank Transfer):</p>
          <p style="margin: 3px 0;">Bank: <strong>${business.bankName || ''}</strong></p>
          <p style="margin: 3px 0;">Account: <strong>${business.bankAccount}</strong></p>
          <p style="margin: 3px 0;">IFSC Code: <strong>${business.bankIfsc || ''}</strong></p>
        </div>
        ` : ''}

        <hr style="border: 0; border-top: 1px solid #e0e0e0; margin: 20px 0;">
        <p style="font-size: 11px; color: #5F6B76; text-align: center;">Powered by BillHouse Invoicing. Thank you for your business!</p>
      </div>
    `
  };

  const info = await t.sendMail(mailOptions);
  return info;
}

export async function sendPaymentConfirmationEmail(
  email: string,
  clientName: string,
  invoice: any,
  payment: any,
  business: any
) {
  const t = await getTransporter();
  const currencySymbol = invoice.currency === 'INR' ? '₹' : invoice.currency || '₹';
  const amountPaidStr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(payment.amount);
  const amountDueStr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(invoice.amountDue);
  const isFullyPaid = invoice.amountDue <= 0;
  const paymentDateStr = new Date(payment.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const themeColor = '#2F8F7A'; // Always use success green for payment receipts

  const mailOptions = {
    from: process.env.SENDGRID_FROM_EMAIL || '"BillHouse" <noreply@billhouse.com>',
    to: email,
    subject: `Payment Receipt: ${amountPaidStr} received for Invoice ${invoice.number}`,
    text: `Hello ${clientName},\n\nThank you! We have received your payment of ${amountPaidStr} for invoice ${invoice.number}.\n\nPayment Date: ${paymentDateStr}\nPayment Method: ${payment.method}${payment.transactionId ? `\nTransaction ID: ${payment.transactionId}` : ''}\n${isFullyPaid ? 'Invoice is now fully settled.' : `Outstanding Balance: ${amountDueStr}`}\n\nThank you for your business!\n${business.name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f0f0f0; border-radius: 8px;">
        
        <!-- Header -->
        <div style="text-align: center; border-bottom: 3px solid ${themeColor}; padding-bottom: 15px; margin-bottom: 20px;">
          <h2 style="color: #061B2D; margin: 0;">${business.name}</h2>
          <p style="font-size: 12px; color: #5f6b76; margin: 5px 0 0 0;">Payment Receipt</p>
        </div>

        <!-- Success Badge -->
        <div style="text-align: center; margin: 20px 0;">
          <div style="display: inline-block; background-color: #EAF8F2; border: 2px solid ${themeColor}; border-radius: 50%; width: 60px; height: 60px; line-height: 60px; font-size: 28px;">✓</div>
          <h3 style="color: ${themeColor}; margin: 12px 0 4px 0; font-size: 20px;">Payment Received!</h3>
          <p style="color: #5f6b76; font-size: 13px; margin: 0;">Thank you, <strong>${clientName}</strong>. Your payment has been recorded.</p>
        </div>

        <!-- Payment Summary Card -->
        <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <table style="width: 100%; font-size: 13px; color: #061B2D; border-collapse: collapse;">
            <tr>
              <td style="padding: 6px 0; color: #5f6b76;">Invoice Number</td>
              <td style="padding: 6px 0; text-align: right; font-weight: bold;">${invoice.number}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #5f6b76;">Payment Date</td>
              <td style="padding: 6px 0; text-align: right; font-weight: bold;">${paymentDateStr}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #5f6b76;">Payment Method</td>
              <td style="padding: 6px 0; text-align: right; font-weight: bold;">${payment.method}</td>
            </tr>
            ${payment.transactionId ? `
            <tr>
              <td style="padding: 6px 0; color: #5f6b76;">Transaction ID</td>
              <td style="padding: 6px 0; text-align: right; font-weight: bold; font-size: 11px; color: #5f6b76;">${payment.transactionId}</td>
            </tr>` : ''}
            <tr><td colspan="2" style="border-top: 1px solid #e0e0e0; padding-top: 10px; margin-top: 6px;"></td></tr>
            <tr>
              <td style="padding: 8px 0; font-size: 15px; font-weight: bold; color: #061B2D;">Amount Paid</td>
              <td style="padding: 8px 0; text-align: right; font-size: 18px; font-weight: 900; color: ${themeColor};">${amountPaidStr}</td>
            </tr>
            ${!isFullyPaid ? `
            <tr>
              <td style="padding: 6px 0; color: #E4A11B; font-weight: bold;">Remaining Balance</td>
              <td style="padding: 6px 0; text-align: right; color: #E4A11B; font-weight: bold;">${amountDueStr}</td>
            </tr>` : `
            <tr>
              <td colspan="2" style="padding: 8px 0; text-align: center;">
                <span style="background-color: #EAF8F2; color: ${themeColor}; font-size: 12px; font-weight: bold; padding: 4px 12px; border-radius: 20px; border: 1px solid ${themeColor};">✓ Invoice Fully Settled</span>
              </td>
            </tr>`}
          </table>
        </div>

        ${payment.notes ? `
        <div style="background-color: #fff6dd; border-left: 3px solid #E4A11B; padding: 12px 15px; border-radius: 4px; margin: 15px 0; font-size: 12px; color: #5f6b76;">
          <strong>Note:</strong> ${payment.notes}
        </div>` : ''}

        <hr style="border: 0; border-top: 1px solid #e0e0e0; margin: 20px 0;">
        <p style="font-size: 11px; color: #5F6B76; text-align: center; margin: 0;">
          This is an automated payment receipt from <strong>${business.name}</strong> via BillHouse.<br>
          Please keep this for your records.
        </p>
      </div>
    `
  };

  const info = await t.sendMail(mailOptions);
  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log(`📧 Payment confirmation email sent. Preview URL: ${previewUrl}`);
  } else {
    console.log(`📧 Payment confirmation email sent to ${email} for invoice ${invoice.number}`);
  }
  return info;
}
