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
 * @desc    Request a secure time-limited password reset token
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

    const user = await User.findOne({ email: normalizedEmail });

    // Consistent security practice: Always return 200 generic response
    // regardless of whether the account exists, preventing email enumeration.
    if (!user) {
      const payload = {
        success: true,
        message:
          'If an account with that email exists, a password reset link has been sent to your email address.',
      };
      if (process.env.NODE_ENV === 'development') {
        payload.devMode = {
          accountFound: false,
          hint: `No account is registered under "${normalizedEmail}". Please enter a registered account email (e.g. seeker.priya@example.com or ananya.seeker@example.com), or create a new account first.`,
        };
      }
      return res.status(200).json(payload);
    }

    // Generate secure random reset token and store SHA-256 hash in DB
    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const resetUrl = `${clientUrl}/reset-password/${resetToken}`;

    const messageText = `You are receiving this email because you (or someone else) requested a password reset for your RoomSync account.\n\nPlease navigate to the following link to choose a new password within 15 minutes:\n\n${resetUrl}\n\nIf you did not request this password reset, please safely ignore this email and your password will remain unchanged.`;

    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #1D1D1F; background: #FFFFFF; border-radius: 16px; border: 1px solid rgba(0,0,0,0.08);">
        <div style="margin-bottom: 20px;">
          <h2 style="font-size: 20px; font-weight: 600; color: #0F766E; margin: 0;">RoomSync Security</h2>
        </div>
        <p style="font-size: 14px; line-height: 1.5; color: #1D1D1F;">Hello ${user.fullName},</p>
        <p style="font-size: 14px; line-height: 1.5; color: #6E6E73;">We received a request to reset your password. Click the button below to choose a new password:</p>
        <div style="margin: 28px 0; text-align: center;">
          <a href="${resetUrl}" style="background-color: #0F766E; color: #FFFFFF; padding: 12px 28px; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 9999px; display: inline-block;">Reset Password</a>
        </div>
        <p style="font-size: 12px; color: #86868B; line-height: 1.5;">This link is valid for <strong>15 minutes</strong> and can only be used once.<br>If you did not request this change, you can safely ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #E5E5EA; margin: 24px 0;">
        <p style="font-size: 11px; color: #86868B;">RoomSync · Residential Roommate Matching Platform</p>
      </div>
    `;

    try {
      const emailResult = await sendEmail({
        to: user.email,
        subject: 'RoomSync - Password Reset Request (Valid for 15 mins)',
        text: messageText,
        html: htmlContent,
      });

      const responsePayload = {
        success: true,
        message:
          'If an account with that email exists, a password reset link has been sent to your email address.',
        resetUrl,
      };

      // In development mode, provide convenience URL for direct testing
      if (process.env.NODE_ENV === 'development') {
        responsePayload.devMode = {
          accountFound: true,
          resetUrl,
          resetToken,
          emailDeliveryMode: emailResult.mode,
          previewUrl: emailResult.previewUrl || null,
        };
      }

      return res.status(200).json(responsePayload);
    } catch (emailErr) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });

      return res.status(500).json({
        success: false,
        message: 'Could not send password reset email. Please try again later.',
        error: { code: 'EMAIL_SEND_FAILED', message: emailErr.message },
      });
    }
  } catch (error) {
    next(error);
  }
}

/**
 * @desc    Reset user password using token
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
