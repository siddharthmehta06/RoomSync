import crypto from 'crypto';
import User from '../models/User.js';
import { generateToken } from '../utils/generateToken.js';
import { sendEmail } from '../utils/sendEmail.js';

/**
 * @desc    Register a new user account
 * @route   POST /api/auth/register
 * @access  Public
 */
export async function register(req, res, next) {
  try {
    const { fullName, email, phone, password, role } = req.body;
    const normalizedEmail = email ? email.toLowerCase().trim() : '';

    // Check if email already exists
    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
        error: {
          code: 'EMAIL_ALREADY_EXISTS',
          message: 'An account with this email already exists.',
          details: [
            {
              field: 'email',
              message: 'Email address is already registered',
            },
          ],
        },
      });
    }

    // Create user in database (pre-save hook hashes password)
    const user = await User.create({
      fullName: fullName.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      password,
      role: role || 'seeker',
    });

    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      data: {
        user,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @desc    Authenticate user & retrieve token
 * @route   POST /api/auth/login
 * @access  Public
 */
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email ? email.toLowerCase().trim() : '';

    // Fetch user with password field explicitly selected
    const user = await User.findOne({ email: normalizedEmail }).select(
      '+password'
    );

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password.',
          details: [],
        },
      });
    }

    const token = generateToken(user);

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: {
        user,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @desc    Get current authenticated user profile
 * @route   GET /api/auth/me
 * @access  Private (Requires valid JWT)
 */
export async function getMe(req, res, next) {
  try {
    // req.user was populated by protect middleware
    res.status(200).json({
      success: true,
      data: req.user,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @desc    Request a secure time-limited password reset OTP
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
export async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    const normalizedEmail = email ? email.toLowerCase().trim() : '';

    if (!normalizedEmail) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.',
        error: { code: 'EMAIL_REQUIRED', message: 'Please provide a valid email address.' },
      });
    }

    const user = await User.findOne({ email: normalizedEmail }).select(
      '+passwordResetCooldown +passwordResetOTP +passwordResetOTPExpires'
    );

    // Consistent security practice: Always return 200 generic response
    // regardless of whether the account exists, preventing email enumeration.
    if (!user) {
      const payload = {
        success: true,
        message:
          'If an account with that email exists, a 6-digit verification code has been sent to your email address.',
      };
      if (process.env.NODE_ENV === 'development') {
        payload.devMode = {
          accountFound: false,
          hint: `No account is registered under "${normalizedEmail}".`,
        };
      }
      return res.status(200).json(payload);
    }

    // Check resend cooldown (60 seconds)
    if (user.passwordResetCooldown && user.passwordResetCooldown > Date.now()) {
      const remainingSecs = Math.ceil((user.passwordResetCooldown - Date.now()) / 1000);
      return res.status(429).json({
        success: false,
        message: `Please wait ${remainingSecs} seconds before requesting a new verification code.`,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: `Please wait ${remainingSecs} seconds before requesting another OTP.`,
          retryAfter: remainingSecs,
        },
      });
    }

    // Generate 6-digit OTP (expires in 5 mins) and legacy token
    const otp = user.createPasswordResetOTP();
    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const resetUrl = `${clientUrl}/reset-password/${resetToken}`;

    const messageText = `Hello ${user.fullName},\n\nYour RoomSync password reset verification code is: ${otp}\n\nThis 6-digit OTP is valid for strictly 5 minutes and can only be used once.\n\nIf you did not request this password reset, please safely ignore this email and your account will remain secure.\n\nRoomSync Security Team`;

    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 28px; color: #1D1D1F; background: #FFFFFF; border-radius: 20px; border: 1px solid rgba(0,0,0,0.08); box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        <div style="margin-bottom: 24px; display: flex; align-items: center; gap: 8px;">
          <h2 style="font-size: 22px; font-weight: 700; color: #0F766E; margin: 0; letter-spacing: -0.02em;">RoomSync</h2>
          <span style="font-size: 12px; color: #6E6E73; margin-left: 8px; padding-left: 8px; border-left: 1px solid #E5E5EA;">Security Verification</span>
        </div>
        <p style="font-size: 15px; line-height: 1.5; color: #1D1D1F; margin-bottom: 12px;">Hello <strong>${user.fullName}</strong>,</p>
        <p style="font-size: 14px; line-height: 1.6; color: #6E6E73; margin-bottom: 24px;">
          We received a request to reset the password for your RoomSync account. Use the 6-digit verification code below to authorize your password update:
        </p>
        <div style="margin: 28px 0; text-align: center; background: #FBFBFD; padding: 24px; border-radius: 16px; border: 1px dashed #0F766E;">
          <span style="display: block; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: #0F766E; margin-bottom: 8px;">Your One-Time Code</span>
          <span style="font-size: 34px; font-weight: 800; letter-spacing: 0.25em; color: #1D1D1F; font-family: ui-monospace, Menlo, Consolas, monospace;">${otp}</span>
          <span style="display: block; font-size: 12px; color: #86868B; margin-top: 10px;">Expires in <strong>5 minutes</strong> · Single-use only</span>
        </div>
        <p style="font-size: 12px; color: #86868B; line-height: 1.5;">
          For your protection, never share this OTP with anyone. If you did not make this request, your password remains unchanged and you can safely ignore this email.
        </p>
        <hr style="border: none; border-top: 1px solid #E5E5EA; margin: 24px 0;">
        <p style="font-size: 11px; color: #86868B; margin: 0;">RoomSync · Residential Roommate Matching Platform · Mumbai, India</p>
      </div>
    `;

    try {
      const emailResult = await sendEmail({
        to: user.email,
        subject: `${otp} is your RoomSync Password Reset Code (Valid 5 mins)`,
        text: messageText,
        html: htmlContent,
      });

      const responsePayload = {
        success: true,
        message:
          'If an account with that email exists, a 6-digit verification code has been sent to your email address.',
        cooldownSeconds: 60,
        expiresInSeconds: 300,
        resetUrl,
      };

      // In development mode, provide convenience OTP for direct verification testing
      if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
        responsePayload.devMode = {
          accountFound: true,
          otp,
          resetToken,
          resetUrl,
          emailDeliveryMode: emailResult.mode,
        };
      }

      return res.status(200).json(responsePayload);
    } catch (emailErr) {
      user.passwordResetOTP = undefined;
      user.passwordResetOTPExpires = undefined;
      user.passwordResetCooldown = undefined;
      await user.save({ validateBeforeSave: false });

      return res.status(500).json({
        success: false,
        message: 'Could not send verification code. Please try again later.',
        error: { code: 'EMAIL_SEND_FAILED', message: emailErr.message },
      });
    }
  } catch (error) {
    next(error);
  }
}

/**
 * @desc    Verify 6-digit password reset OTP and obtain single-use reset session token
 * @route   POST /api/auth/verify-otp
 * @access  Public
 */
export async function verifyResetOTP(req, res, next) {
  try {
    const { email, otp } = req.body;
    const normalizedEmail = email ? email.toLowerCase().trim() : '';
    const cleanOtp = otp ? String(otp).trim() : '';

    if (!normalizedEmail || !cleanOtp) {
      return res.status(400).json({
        success: false,
        message: 'Email and 6-digit OTP code are required.',
        error: { code: 'INVALID_INPUT', message: 'Email and OTP are required.' },
      });
    }

    if (!/^[0-9]{6}$/.test(cleanOtp)) {
      return res.status(400).json({
        success: false,
        message: 'Verification code must be exactly 6 digits.',
        error: { code: 'INVALID_OTP_FORMAT', message: 'Verification code must be 6 digits.' },
      });
    }

    const user = await User.findOne({ email: normalizedEmail }).select(
      '+passwordResetOTP +passwordResetOTPExpires +passwordResetAttempts +tempResetToken +tempResetTokenExpires'
    );

    if (!user || !user.passwordResetOTP || !user.passwordResetOTPExpires) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification code. Please request a new OTP.',
        error: { code: 'INVALID_OR_EXPIRED_OTP', message: 'Invalid or expired OTP.' },
      });
    }

    // Check maximum verification attempts (max 5)
    if (user.passwordResetAttempts >= 5) {
      user.passwordResetOTP = undefined;
      user.passwordResetOTPExpires = undefined;
      user.passwordResetAttempts = 0;
      await user.save({ validateBeforeSave: false });

      return res.status(429).json({
        success: false,
        message: 'Maximum verification attempts exceeded. Please request a new verification code.',
        error: { code: 'MAX_ATTEMPTS_EXCEEDED', message: 'Too many incorrect attempts.' },
      });
    }

    // Check OTP expiration (5 minutes)
    if (user.passwordResetOTPExpires < Date.now()) {
      user.passwordResetOTP = undefined;
      user.passwordResetOTPExpires = undefined;
      await user.save({ validateBeforeSave: false });

      return res.status(400).json({
        success: false,
        message: 'Verification code has expired. Please request a fresh OTP.',
        error: { code: 'OTP_EXPIRED', message: 'OTP has expired.' },
      });
    }

    // Verify hash
    const hashedAttempt = crypto
      .createHash('sha256')
      .update(cleanOtp)
      .digest('hex');

    if (hashedAttempt !== user.passwordResetOTP) {
      user.passwordResetAttempts = (user.passwordResetAttempts || 0) + 1;
      await user.save({ validateBeforeSave: false });
      const remainingAttempts = 5 - user.passwordResetAttempts;

      return res.status(400).json({
        success: false,
        message: `Incorrect verification code. ${remainingAttempts} attempt(s) remaining.`,
        error: {
          code: 'INCORRECT_OTP',
          message: 'Incorrect verification code.',
          remainingAttempts,
        },
      });
    }

    // OTP is valid! Invalidate OTP so it cannot be reused (single-use)
    user.passwordResetOTP = undefined;
    user.passwordResetOTPExpires = undefined;
    user.passwordResetAttempts = 0;

    // Issue single-use temporary reset authorization token (valid for 10 minutes)
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.tempResetToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    user.tempResetTokenExpires = Date.now() + 10 * 60 * 1000;

    await user.save({ validateBeforeSave: false });

    return res.status(200).json({
      success: true,
      message: 'Code verified successfully. You may now choose your new password.',
      data: {
        resetToken,
        email: user.email,
        expiresInSeconds: 600,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @desc    Set new password using verified single-use reset token
 * @route   POST /api/auth/reset-password-otp
 * @access  Public
 */
export async function resetPasswordWithOTP(req, res, next) {
  try {
    const { email, resetToken, password, confirmPassword } = req.body;
    const normalizedEmail = email ? email.toLowerCase().trim() : '';

    if (!normalizedEmail || !resetToken || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email, reset authorization token, and new password are required.',
        error: { code: 'INVALID_INPUT', message: 'Missing required reset parameters.' },
      });
    }

    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password and confirmation password do not match.',
        error: { code: 'PASSWORD_MISMATCH', message: 'Passwords do not match.' },
      });
    }

    if (typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
        error: { code: 'WEAK_PASSWORD', message: 'Password must be at least 6 characters.' },
      });
    }

    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    const user = await User.findOne({
      email: normalizedEmail,
      tempResetToken: hashedToken,
      tempResetTokenExpires: { $gt: Date.now() },
    }).select('+tempResetToken +tempResetTokenExpires');

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Reset authorization session is invalid, expired, or has already been used.',
        error: { code: 'INVALID_OR_EXPIRED_RESET_SESSION', message: 'Invalid reset token.' },
      });
    }

    // Set new password (pre-save middleware handles bcrypt hashing)
    user.password = password;
    user.tempResetToken = undefined;
    user.tempResetTokenExpires = undefined;
    user.passwordResetToken = undefined;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    user.passwordResetOTP = undefined;
    user.passwordResetOTPExpires = undefined;
    user.passwordResetAttempts = 0;
    await user.save();

    // Send confirmation email
    sendEmail({
      to: user.email,
      subject: 'RoomSync Security Alert - Your Password Has Been Changed',
      text: `Hello ${user.fullName},\n\nThis is a confirmation that the password for your RoomSync account was successfully updated.\n\nIf you performed this action, no further steps are needed.\n\nIf you did NOT change your password, please contact RoomSync support immediately to secure your account.\n\nRoomSync Security Team`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 28px; color: #1D1D1F; background: #FFFFFF; border-radius: 20px; border: 1px solid rgba(0,0,0,0.08);">
          <h2 style="font-size: 20px; font-weight: 700; color: #0F766E; margin-bottom: 12px;">Password Changed Successfully</h2>
          <p style="font-size: 14px; color: #1D1D1F; line-height: 1.5;">Hello ${user.fullName},</p>
          <p style="font-size: 14px; color: #6E6E73; line-height: 1.6;">Your RoomSync account password was successfully reset just now.</p>
          <div style="background: #F0FDF4; border: 1px solid #BBF7D0; padding: 14px; border-radius: 12px; margin: 20px 0; color: #166534; font-size: 13px;">
            ✓ Your credentials are up to date and your new password is now active.
          </div>
          <p style="font-size: 12px; color: #86868B; line-height: 1.5;">If you did not perform this change, please contact support immediately.</p>
        </div>
      `,
    }).catch((err) => console.warn('[RoomSync Auth] Confirmation email notice failed:', err.message));

    // Generate new JWT session token
    const jwtToken = generateToken(user);

    return res.status(200).json({
      success: true,
      message: 'Password reset successful. You are now logged in.',
      data: {
        user,
        token: jwtToken,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @desc    Reset user password using token (legacy link method)
 * @route   POST /api/auth/reset-password/:token
 * @access  Public
 */
export async function resetPassword(req, res, next) {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Password reset token is required.',
        error: { code: 'TOKEN_REQUIRED', message: 'Password reset token is required.' },
      });
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters.',
        error: {
          code: 'WEAK_PASSWORD',
          message: 'New password must be at least 6 characters.',
          details: [{ field: 'password', message: 'Password must be at least 6 characters' }],
        },
      });
    }

    // Hash the token from URL param with SHA-256 to compare with stored DB hash
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find user by hashed token and ensure expiration is in the future
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Password reset token is invalid, expired, or has already been used.',
        error: {
          code: 'INVALID_OR_EXPIRED_TOKEN',
          message: 'Password reset token is invalid, expired, or has already been used.',
        },
      });
    }

    // Set new password (pre-save middleware handles bcrypt hashing)
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    user.tempResetToken = undefined;
    user.tempResetTokenExpires = undefined;
    user.passwordResetOTP = undefined;
    user.passwordResetOTPExpires = undefined;
    await user.save();

    // Generate new JWT session token
    const jwtToken = generateToken(user);

    res.status(200).json({
      success: true,
      message: 'Password reset successful. You are now logged in.',
      data: {
        user,
        token: jwtToken,
      },
    });
  } catch (error) {
    next(error);
  }
}
