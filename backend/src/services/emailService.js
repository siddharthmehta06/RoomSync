import nodemailer from 'nodemailer';

/**
 * RoomSync Email Service using Nodemailer with Gmail SMTP
 * 
 * Supports sending emails to ANY valid recipient address (Gmail, Outlook, Yahoo,
 * institutional domains like @spit.ac.in, etc.) without sandbox restrictions.
 * 
 * Security:
 * - Credentials read exclusively from process.env (never hardcoded or leaked)
 * - Plaintext reset tokens/credentials are never printed to logs
 * - Preserves RoomSync branded responsive HTML layout and plain-text fallback
 * - Supports mocking for automated test suites
 */

let mockSendHandler = null;

/**
 * Set a mock send handler for test suites
 * @param {Function|null} handler
 */
export function setMockSendHandler(handler) {
  mockSendHandler = handler;
}

/**
 * Create a Nodemailer transporter configured with Gmail SMTP or environment settings
 * @returns {nodemailer.Transporter}
 */
export function getTransporter() {
  const provider = (process.env.EMAIL_PROVIDER || '').toLowerCase();
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT) || 587;
  const isSecure = process.env.SMTP_SECURE === 'true' || port === 465;
  const user = (process.env.SMTP_USER || '').trim();
  const pass = (process.env.SMTP_PASS || '').replace(/\s+/g, '').trim();

  if (!user || !pass) {
    throw new Error(
      'SMTP credentials missing: Please configure SMTP_USER and SMTP_PASS in backend/.env'
    );
  }

  const transportConfig = {
    auth: {
      user,
      pass,
    },
    connectionTimeout: 15000,
    greetingTimeout: 12000,
    socketTimeout: 20000,
  };

  if (provider === 'gmail' || host === 'smtp.gmail.com') {
    transportConfig.service = 'gmail';
  } else {
    transportConfig.host = host;
    transportConfig.port = port;
    transportConfig.secure = isSecure;
  }

  return nodemailer.createTransport(transportConfig);
}

/**
 * Send password reset email to ANY recipient address via Gmail SMTP
 * 
 * @param {object} params
 * @param {string} params.to - Recipient email address
 * @param {string} params.resetToken - Unhashed 32-byte crypto token
 * @param {string} [params.userName] - Recipient user's display name
 * @returns {Promise<{ success: boolean, messageId?: string }>}
 */
export async function sendPasswordResetEmail({ to, resetToken, userName = 'there' }) {
  const frontendUrl =
    process.env.FRONTEND_URL ||
    process.env.CLIENT_URL ||
    'http://localhost:5173';

  const resetUrl = `${frontendUrl.replace(/\/$/, '')}/reset-password?token=${resetToken}`;
  const senderEmail = process.env.SMTP_USER || 'notifications@roomsync.in';
  const fromAddress = process.env.EMAIL_FROM || `RoomSync <${senderEmail}>`;
  const subject = 'Reset Your RoomSync Password';

  const textContent = `Hello,\n\nWe received a request to reset the password associated with your RoomSync account.\n\nClick the button below to create a new password:\n${resetUrl}\n\nThis link will expire in 15 minutes and can only be used once.\n\nIf you did not request this password reset, you can safely ignore this email. Your current password will remain unchanged.\n\nRegards,\nTeam RoomSync`;

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your RoomSync Password</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FBFBFD; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1D1D1F; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #FBFBFD; padding: 40px 16px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 540px; background-color: #FFFFFF; border: 1px solid rgba(0, 0, 0, 0.08); border-radius: 24px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04); overflow: hidden;">
          
          <!-- Brand Header -->
          <tr>
            <td style="padding: 36px 36px 20px 36px; text-align: left;">
              <table role="presentation" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="width: 38px; height: 38px; background-color: #0F766E; border-radius: 10px; text-align: center; vertical-align: middle;">
                    <span style="color: #FFFFFF; font-size: 20px; font-weight: 700; line-height: 38px; display: inline-block;">R</span>
                  </td>
                  <td style="padding-left: 12px;">
                    <span style="font-size: 18px; font-weight: 600; color: #1D1D1F; letter-spacing: -0.02em;">RoomSync</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Email Content -->
          <tr>
            <td style="padding: 0 36px 32px 36px; text-align: left;">
              <h1 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 600; color: #1D1D1F; letter-spacing: -0.02em;">
                Reset Your RoomSync Password
              </h1>
              
              <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #424245;">
                Hello,
              </p>

              <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #424245;">
                We received a request to reset the password associated with your RoomSync account.
              </p>

              <p style="margin: 0 0 28px 0; font-size: 14px; line-height: 1.6; color: #424245;">
                Click the button below to create a new password.
              </p>

              <!-- CTA Button -->
              <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="margin: 0 0 28px 0;">
                <tr>
                  <td align="left" style="border-radius: 12px; background-color: #0F766E;">
                    <a href="${resetUrl}" target="_blank" style="display: inline-block; padding: 14px 32px; font-size: 14px; font-weight: 600; color: #FFFFFF; text-decoration: none; border-radius: 12px; background-color: #0F766E; letter-spacing: -0.01em;">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 16px 0; font-size: 13px; line-height: 1.6; color: #6E6E73;">
                This link will expire in <strong>15 minutes</strong> and can only be used once.
              </p>

              <p style="margin: 0 0 28px 0; font-size: 13px; line-height: 1.6; color: #86868B;">
                If you did not request this password reset, you can safely ignore this email. Your current password will remain unchanged.
              </p>

              <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #424245;">
                Regards,<br>
                <strong style="color: #1D1D1F;">Team RoomSync</strong>
              </p>
            </td>
          </tr>

          <!-- Subtle Divider -->
          <tr>
            <td style="padding: 0 36px;">
              <div style="height: 1px; background-color: #E5E5EA; width: 100%;"></div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 36px 36px 36px; text-align: left;">
              <p style="margin: 0 0 6px 0; font-size: 11px; line-height: 1.5; color: #86868B;">
                This is an automated security notification from RoomSync. Please do not reply directly to this email.
              </p>
              <p style="margin: 0; font-size: 11px; line-height: 1.5; color: #86868B;">
                &copy; ${new Date().getFullYear()} RoomSync. Verified Roommate &amp; Shared Rental Platform.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  // 1. In mock or test environment
  if (mockSendHandler) {
    return await mockSendHandler({
      to,
      subject,
      text: textContent,
      html: htmlContent,
      resetUrl,
    });
  }

  if (process.env.NODE_ENV === 'test') {
    return { success: true, messageId: 'test-mock-nodemailer-id' };
  }

  // 2. Real SMTP delivery via Nodemailer
  try {
    const transporter = getTransporter();
    const info = await transporter.sendMail({
      from: fromAddress,
      to,
      subject,
      text: textContent,
      html: htmlContent,
    });

    if (info.rejected && info.rejected.length > 0) {
      throw new Error(`Recipient address rejected by mail server: ${info.rejected.join(', ')}`);
    }

    console.log(`[RoomSync Email] Password reset email delivered to ${to} (Message ID: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    // Diagnose SMTP failure codes securely
    if (err.code === 'EAUTH') {
      console.error(
        '[RoomSync Email] Gmail SMTP Authentication Failed: Please check your SMTP_USER and SMTP_PASS (Gmail App Password).'
      );
    } else if (err.code === 'ETIMEDOUT' || err.code === 'ESOCKETTIMEDOUT') {
      console.error(
        '[RoomSync Email] Gmail SMTP Connection Timeout: Network connection to smtp.gmail.com:587 timed out.'
      );
    } else {
      console.error(`[RoomSync Email] SMTP Delivery Error (${err.code || 'UNKNOWN'}): ${err.message}`);
    }
    throw err;
  }
}

/**
 * Send email verification link to ANY recipient address via Gmail SMTP
 * 
 * @param {object} params
 * @param {string} params.to - Recipient email address
 * @param {string} params.verificationToken - Unhashed crypto verification token
 * @param {string} [params.userName] - Recipient user's display name
 * @returns {Promise<{ success: boolean, messageId?: string }>}
 */
export async function sendVerificationEmail({ to, verificationToken, userName = 'there' }) {
  const frontendUrl =
    process.env.FRONTEND_URL ||
    process.env.CLIENT_URL ||
    'http://localhost:5173';

  const verificationUrl = `${frontendUrl.replace(/\/$/, '')}/verify-email?token=${verificationToken}`;
  const senderEmail = process.env.SMTP_USER || 'notifications@roomsync.in';
  const fromAddress = process.env.EMAIL_FROM || `RoomSync <${senderEmail}>`;
  const subject = 'Verify Your RoomSync Email Address';

  const textContent = `Hello ${userName},\n\nThank you for registering on RoomSync! Please verify your email address by opening the following link:\n\n${verificationUrl}\n\nThis verification link will expire in 24 hours.\n\nRegards,\nTeam RoomSync`;

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your RoomSync Email</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FBFBFD; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1D1D1F; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #FBFBFD; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 540px; background-color: #FFFFFF; border: 1px solid rgba(0, 0, 0, 0.08); border-radius: 24px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04); overflow: hidden;">
          <tr>
            <td style="padding: 36px 36px 20px 36px; text-align: left;">
              <table role="presentation" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="width: 38px; height: 38px; background-color: #0F766E; border-radius: 10px; text-align: center; vertical-align: middle;">
                    <span style="color: #FFFFFF; font-size: 20px; font-weight: 700; line-height: 38px; display: inline-block;">R</span>
                  </td>
                  <td style="padding-left: 12px;">
                    <span style="font-size: 18px; font-weight: 600; color: #1D1D1F; letter-spacing: -0.02em;">RoomSync</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding: 0 36px 32px 36px; text-align: left;">
              <h1 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 600; color: #1D1D1F; letter-spacing: -0.02em;">
                Verify Your Email Address
              </h1>
              
              <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #424245;">
                Hello ${userName},
              </p>

              <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #424245;">
                Welcome to RoomSync! To unlock your verified trust badge, secure communication with roommates, and password recovery privileges, please verify your email address.
              </p>

              <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="margin: 0 0 28px 0;">
                <tr>
                  <td align="left" style="border-radius: 12px; background-color: #0F766E;">
                    <a href="${verificationUrl}" target="_blank" style="display: inline-block; padding: 14px 32px; font-size: 14px; font-weight: 600; color: #FFFFFF; text-decoration: none; border-radius: 12px; background-color: #0F766E; letter-spacing: -0.01em;">
                      Verify Email Address
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 16px 0; font-size: 13px; line-height: 1.6; color: #6E6E73;">
                This link will expire in <strong>24 hours</strong> and can only be used once.
              </p>

              <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #424245;">
                Regards,<br>
                <strong style="color: #1D1D1F;">Team RoomSync</strong>
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding: 0 36px;">
              <div style="height: 1px; background-color: #E5E5EA; width: 100%;"></div>
            </td>
          </tr>

          <tr>
            <td style="padding: 24px 36px 36px 36px; text-align: left;">
              <p style="margin: 0; font-size: 11px; line-height: 1.5; color: #86868B;">
                &copy; ${new Date().getFullYear()} RoomSync. Verified Roommate &amp; Shared Rental Platform.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  if (mockSendHandler) {
    return await mockSendHandler({
      to,
      subject,
      text: textContent,
      html: htmlContent,
      verificationUrl,
    });
  }

  if (process.env.NODE_ENV === 'test') {
    return { success: true, messageId: 'test-mock-verification-id' };
  }

  try {
    const transporter = getTransporter();
    const info = await transporter.sendMail({
      from: fromAddress,
      to,
      subject,
      text: textContent,
      html: htmlContent,
    });

    console.log(`[RoomSync Email] Verification email delivered to ${to} (Message ID: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[RoomSync Email] Failed to send verification email to ${to}: ${err.message}`);
    throw err;
  }
}
