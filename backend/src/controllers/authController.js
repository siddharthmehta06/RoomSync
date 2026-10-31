import crypto from 'crypto';
import User from '../models/User.js';
import PasswordResetToken from '../models/PasswordResetToken.js';
import EmailVerificationToken from '../models/EmailVerificationToken.js';
import { generateToken } from '../utils/generateToken.js';
import {
  sendPasswordResetEmail,
  sendVerificationEmail,
} from '../services/emailService.js';

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

    // Create user in database (pre-save hook hashes password; isVerified defaults to false)
    const user = await User.create({
      fullName: fullName.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      password,
      role: role || 'seeker',
    });

    const token = generateToken(user);

    // Generate cryptographic email verification token and dispatch verification email
    try {
      const verificationRawToken = crypto.randomBytes(32).toString('hex');
      const hashedVerificationToken = crypto
        .createHash('sha256')
        .update(verificationRawToken)
        .digest('hex');

      await EmailVerificationToken.create({
        user: user._id,
        hashedToken: hashedVerificationToken,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours validity
        isUsed: false,
      });

      // Dispatch verification email via Nodemailer Gmail SMTP
      sendVerificationEmail({
        to: user.email,
        verificationToken: verificationRawToken,
        userName: user.fullName,
      }).catch((emailErr) => {
        console.warn(
          `[RoomSync Email Notice] Initial verification email notice for ${user.email}: ${emailErr.message}`
        );
      });
    } catch (verifErr) {
      console.warn(
        `[RoomSync Notice] Verification token generation notice: ${verifErr.message}`
      );
    }

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
 * @desc    Request a secure time-limited password reset link via Resend email
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

    // Generic response preventing account enumeration (Phases 2, 3, 9)
    const genericResponse = {
      success: true,
      message:
        'If an account exists with this email address, you will receive a password reset link shortly. Please check your inbox.',
    };

    const user = await User.findOne({ email: normalizedEmail });

    // If user does not exist, return generic success immediately
    if (!user) {
      return res.status(200).json(genericResponse);
    }

    // If account exists but email is not verified, do not dispatch reset link (Phase 3)
    if (!user.isVerified) {
      return res.status(200).json(genericResponse);
    }

    // Generate cryptographically secure 32-byte hex token (Phase 3 & 9)
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Generate SHA-256 hash for secure database storage (Phase 3 & 4)
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // 15-minute token expiration timestamp
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    // Invalidate any previously generated unused tokens for this user
    await PasswordResetToken.updateMany(
      { user: user._id, isUsed: false },
      { $set: { isUsed: true } }
    );

    // Persist hashed token record with single-use flag
    const tokenRecord = await PasswordResetToken.create({
      user: user._id,
      hashedToken,
      expiresAt,
      isUsed: false,
    });

    // Send email via Gmail SMTP email service
    try {
      await sendPasswordResetEmail({
        to: user.email,
        resetToken,
        userName: user.fullName,
      });
    } catch (emailErr) {
      // Invalidate the token record on delivery failure to prevent orphaned active tokens
      await PasswordResetToken.deleteOne({ _id: tokenRecord._id });

      return res.status(500).json({
        success: false,
        message: 'Unable to send password reset email at this time. Please try again later.',
        error: {
          code: 'EMAIL_DELIVERY_FAILED',
          message: 'Unable to send password reset email at this time. Please try again later.',
        },
      });
    }

    return res.status(200).json(genericResponse);
  } catch (error) {
    next(error);
  }
}

/**
 * @desc    Reset user password using secure token
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
export async function resetPassword(req, res, next) {
  try {
    const token = req.body?.token || req.params?.token;
    const newPassword = req.body?.newPassword || req.body?.password;

    if (!token || typeof token !== 'string' || !token.trim()) {
      return res.status(400).json({
        success: false,
        message: 'This password reset link is invalid.',
        error: { code: 'INVALID_TOKEN', message: 'This password reset link is invalid.' },
      });
    }

    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters.',
        error: {
          code: 'WEAK_PASSWORD',
          message: 'Password must be at least 6 characters.',
          details: [{ field: 'newPassword', message: 'Password must be at least 6 characters' }],
        },
      });
    }

    // Compute SHA-256 hash of the supplied token for lookup
    const hashedToken = crypto
      .createHash('sha256')
      .update(token.trim())
      .digest('hex');

    // Check token existence in database
    const existingToken = await PasswordResetToken.findOne({ hashedToken });

    if (!existingToken) {
      return res.status(400).json({
        success: false,
        message: 'This password reset link is invalid.',
        error: {
          code: 'INVALID_TOKEN',
          message: 'This password reset link is invalid.',
        },
      });
    }

    if (existingToken.isUsed) {
      return res.status(400).json({
        success: false,
        message: 'This password reset link has already been used.',
        error: {
          code: 'TOKEN_ALREADY_USED',
          message: 'This password reset link has already been used.',
        },
      });
    }

    if (new Date(existingToken.expiresAt) <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'This password reset link has expired. Please request a new one.',
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'This password reset link has expired. Please request a new one.',
        },
      });
    }

    // Atomic single-use consumption: guarantees that concurrent duplicate requests fail
    const consumedToken = await PasswordResetToken.findOneAndUpdate(
      {
        _id: existingToken._id,
        isUsed: false,
        expiresAt: { $gt: new Date() },
      },
      {
        $set: { isUsed: true },
      },
      { new: false }
    );

    if (!consumedToken) {
      return res.status(400).json({
        success: false,
        message: 'This password reset link has already been used.',
        error: {
          code: 'TOKEN_ALREADY_USED',
          message: 'This password reset link has already been used.',
        },
      });
    }

    // Retrieve the associated user
    const user = await User.findById(consumedToken.user);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'This password reset link is invalid.',
        error: {
          code: 'USER_NOT_FOUND',
          message: 'This password reset link is invalid.',
        },
      });
    }

    // Update password (pre-save middleware on User hashes the password with bcrypt)
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    // Invalidate all remaining tokens for this user
    await PasswordResetToken.updateMany(
      { user: user._id, isUsed: false },
      { $set: { isUsed: true } }
    );

    return res.status(200).json({
      success: true,
      message:
        'Your password has been reset successfully. You can now log in using your new password.',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @desc    Verify user email using secure verification token
 * @route   POST /api/auth/verify-email
 * @route   GET /api/auth/verify-email
 * @access  Public
 */
export async function verifyEmail(req, res, next) {
  try {
    const rawToken = req.query?.token || req.body?.token;

    if (!rawToken || typeof rawToken !== 'string' || !rawToken.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Email verification token is missing or invalid.',
        error: { code: 'INVALID_TOKEN', message: 'Email verification token is missing or invalid.' },
      });
    }

    const hashedToken = crypto
      .createHash('sha256')
      .update(rawToken.trim())
      .digest('hex');

    const tokenRecord = await EmailVerificationToken.findOne({ hashedToken });

    if (!tokenRecord) {
      return res.status(400).json({
        success: false,
        message: 'This email verification link is invalid or has already been used.',
        error: { code: 'INVALID_TOKEN', message: 'This email verification link is invalid or has already been used.' },
      });
    }

    if (tokenRecord.isUsed) {
      return res.status(400).json({
        success: false,
        message: 'This email verification link has already been used.',
        error: { code: 'TOKEN_ALREADY_USED', message: 'This email verification link has already been used.' },
      });
    }

    if (new Date(tokenRecord.expiresAt) <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'This email verification link has expired. Please request a new one.',
        error: { code: 'TOKEN_EXPIRED', message: 'This email verification link has expired. Please request a new one.' },
      });
    }

    // Atomic consumption
    const consumed = await EmailVerificationToken.findOneAndUpdate(
      { _id: tokenRecord._id, isUsed: false, expiresAt: { $gt: new Date() } },
      { $set: { isUsed: true } },
      { new: false }
    );

    if (!consumed) {
      return res.status(400).json({
        success: false,
        message: 'This email verification link has already been used.',
        error: { code: 'TOKEN_ALREADY_USED', message: 'This email verification link has already been used.' },
      });
    }

    const user = await User.findById(consumed.user);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'User account associated with this verification link was not found.',
        error: { code: 'USER_NOT_FOUND', message: 'User account associated with this verification link was not found.' },
      });
    }

    user.isVerified = true;
    user.verificationMethod = user.verificationMethod || 'Work_Email';
    await user.save();

    // Invalidate all other verification tokens for this user
    await EmailVerificationToken.updateMany(
      { user: user._id, isUsed: false },
      { $set: { isUsed: true } }
    );

    return res.status(200).json({
      success: true,
      message: 'Your email address has been successfully verified! You can now access all verified member privileges.',
      data: {
        isVerified: true,
        email: user.email,
        fullName: user.fullName,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @desc    Resend email verification link
 * @route   POST /api/auth/resend-verification
 * @access  Public or Authenticated
 */
export async function resendVerification(req, res, next) {
  try {
    const email = req.body?.email || req.user?.email;
    const normalizedEmail = email ? email.toLowerCase().trim() : '';

    if (!normalizedEmail) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.',
        error: { code: 'EMAIL_REQUIRED', message: 'Please provide a valid email address.' },
      });
    }

    const user = await User.findOne({ email: normalizedEmail });

    // Anti-enumeration: return generic response even if account is not registered
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If an account exists with this email address, a verification link has been sent.',
      });
    }

    if (user.isVerified) {
      return res.status(200).json({
        success: true,
        message: 'This email address is already verified. No action required.',
        data: { isVerified: true },
      });
    }

    // Invalidate prior verification tokens
    await EmailVerificationToken.updateMany(
      { user: user._id, isUsed: false },
      { $set: { isUsed: true } }
    );

    const verificationRawToken = crypto.randomBytes(32).toString('hex');
    const hashedVerificationToken = crypto
      .createHash('sha256')
      .update(verificationRawToken)
      .digest('hex');

    await EmailVerificationToken.create({
      user: user._id,
      hashedToken: hashedVerificationToken,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      isUsed: false,
    });

    try {
      await sendVerificationEmail({
        to: user.email,
        verificationToken: verificationRawToken,
        userName: user.fullName,
      });
    } catch (emailErr) {
      return res.status(500).json({
        success: false,
        message: 'Unable to send verification email. Please check SMTP configuration.',
        error: { code: 'EMAIL_DELIVERY_FAILED', message: emailErr.message },
      });
    }

    return res.status(200).json({
      success: true,
      message: 'A verification link has been dispatched to your email address.',
    });
  } catch (error) {
    next(error);
  }
}
