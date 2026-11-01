import express from 'express';
import { body } from 'express-validator';
import {
  register,
  login,
  getMe,
  forgotPassword,
  verifyResetOTP,
  resetPasswordWithOTP,
  resetPassword,
  verifyEmail,
  resendVerification,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validateRequest.js';
import {
  forgotPasswordLimiter,
  resetPasswordLimiter,
} from '../middleware/rateLimiter.js';

const router = express.Router();

/**
 * Validation rules for user registration
 */
const registerValidation = [
  body('fullName')
    .trim()
    .notEmpty()
    .withMessage('Full name is required')
    .isLength({ min: 2, max: 80 })
    .withMessage('Full name must be between 2 and 80 characters'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address'),
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^[0-9]{10}$/)
    .withMessage('Phone number must be a valid 10-digit number'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('role')
    .optional()
    .isIn(['seeker', 'owner'])
    .withMessage('Role must be either seeker or owner'),
  validateRequest,
];

/**
 * Validation rules for user login
 */
const loginValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address'),
  body('password').notEmpty().withMessage('Password is required'),
  validateRequest,
];

/**
 * Validation rules for forgot password request
 */
const forgotPasswordValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address'),
  validateRequest,
];

/**
 * Validation rules for verifying OTP
 */
const verifyOtpValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address'),
  body('otp')
    .trim()
    .notEmpty()
    .withMessage('OTP code is required')
    .matches(/^[0-9]{6}$/)
    .withMessage('OTP must be a 6-digit number'),
  validateRequest,
];

/**
 * Validation rules for resetting password with OTP token
 */
const resetPasswordWithOtpValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address'),
  body('resetToken')
    .trim()
    .notEmpty()
    .withMessage('Reset authorization token is required'),
    .optional()
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address'),
  body('resetToken')
    .optional()
    .trim(),
  body('tempToken')
    .optional()
    .trim(),
  body().custom((val, { req }) => {
    if (!req.body.resetToken && !req.body.tempToken) {
      throw new Error('Reset authorization token is required');
    }
    return true;
  }),
  body('password')
    .notEmpty()
    .withMessage('New password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('confirmPassword')
    .optional()
    .custom((val, { req }) => {
      if (val && val !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
  validateRequest,
];

/**
 * Validation rules for legacy URL token password reset
 * Validation rules for legacy URL token or body token password reset
 * Supports both newPassword and password fields in body
 */
const resetPasswordValidation = [
  body().custom((value, { req }) => {
    const password = req.body.newPassword || req.body.password;
    if (!password || typeof password !== 'string' || password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }
    const token = req.body.token || req.params.token;
    if (!token || typeof token !== 'string' || !token.trim()) {
      throw new Error('Password reset token is required');
    }
    return true;
  }),
  validateRequest,
];

// Core Auth Routes
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.get('/me', protect, getMe);

// OTP-Based Password Reset Routes
router.post('/forgot-password', forgotPasswordValidation, forgotPassword);
router.post('/verify-otp', verifyOtpValidation, verifyResetOTP);
router.post('/reset-password-otp', resetPasswordWithOtpValidation, resetPasswordWithOTP);

// Legacy URL Token Routes
router.post('/reset-password/:token', resetPasswordValidation, resetPassword);
router.put('/reset-password/:token', resetPasswordValidation, resetPassword);


// Email Verification Routes
router.post('/verify-email', verifyEmail);
router.get('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerification);

// OTP-Based Password Reset Routes
router.post('/forgot-password', forgotPasswordLimiter, forgotPasswordValidation, forgotPassword);
router.post('/verify-otp', verifyOtpValidation, verifyResetOTP);
router.post('/reset-password-otp', resetPasswordLimiter, resetPasswordWithOtpValidation, resetPasswordWithOTP);

// Link / Token-Based Password Reset Routes
router.post('/reset-password', resetPasswordLimiter, resetPasswordValidation, resetPassword);
router.post('/reset-password/:token', resetPasswordLimiter, resetPasswordValidation, resetPassword);
router.put('/reset-password/:token', resetPasswordLimiter, resetPasswordValidation, resetPassword);

export default router;
