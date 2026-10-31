import express from 'express';
import { body } from 'express-validator';
import {
  register,
  login,
  getMe,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validateRequest.js';

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

import {
  forgotPasswordLimiter,
  resetPasswordLimiter,
} from '../middleware/rateLimiter.js';

/**
 * Validation rules for forgot password
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
 * Validation rules for password reset
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

// Mount endpoints
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.get('/me', protect, getMe);
router.post('/verify-email', verifyEmail);
router.get('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerification);
router.post('/forgot-password', forgotPasswordLimiter, forgotPasswordValidation, forgotPassword);
router.post('/reset-password', resetPasswordLimiter, resetPasswordValidation, resetPassword);
router.post('/reset-password/:token', resetPasswordLimiter, resetPasswordValidation, resetPassword);
router.put('/reset-password/:token', resetPasswordLimiter, resetPasswordValidation, resetPassword);

export default router;

