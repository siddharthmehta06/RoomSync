import nodemailer from 'nodemailer';

/**
 * Send email using Nodemailer with graceful fallback for development and testing environments.
 * 
 * @param {object} options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject line
 * @param {string} options.text - Plain text email content
 * @param {string} options.html - HTML formatted email content
 * @returns {Promise<{ sent: boolean, mode: string, messageId?: string, previewUrl?: string }>}
 */
export async function sendEmail({ to, subject, text, html }) {
  const isMockSmtp =
    !process.env.SMTP_PASS ||
    process.env.SMTP_PASS === 'app_password_mock' ||
    process.env.SMTP_PASS === 'your_app_password_here';

  // In development/test mode or with mock credentials, log safely without attempting invalid external connection
  if (isMockSmtp || process.env.NODE_ENV === 'test') {
    console.log('\n======================================================');
    console.log('[RoomSync Email Service - Development Simulation]');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log('------------------------------------------------------');
    console.log(text);
    console.log('======================================================\n');

    return {
      sent: true,
      mode: 'development_simulated',
      messageId: `dev-sim-${Date.now()}`,
    };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'RoomSync <notifications@roomsync.in>',
      to,
      subject,
      text,
      html,
    });

    return {
      sent: true,
      mode: 'smtp_delivered',
      messageId: info.messageId,
    };
  } catch (error) {
    console.warn('[RoomSync Email] SMTP connection failed, falling back to simulated output:', error.message);
    console.log('\n======================================================');
    console.log('[RoomSync Email Fallback]');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log('------------------------------------------------------');
    console.log(text);
    console.log('======================================================\n');

    return {
      sent: true,
      mode: 'fallback_logged',
      error: error.message,
    };
  }
}
