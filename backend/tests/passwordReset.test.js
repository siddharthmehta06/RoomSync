import request from 'supertest';
import mongoose from 'mongoose';
import crypto from 'crypto';
import app from '../src/app.js';
import User from '../src/models/User.js';
import PasswordResetToken from '../src/models/PasswordResetToken.js';
import EmailVerificationToken from '../src/models/EmailVerificationToken.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { setMockSendHandler } from '../src/services/emailService.js';
import { resetRateLimits } from '../src/middleware/rateLimiter.js';

const TEST_DB_URI =
  process.env.MONGODB_TEST_URI_PWD ||
  'mongodb://localhost:27017/roomsync_test_password_reset';

describe('RoomSync Password Reset with Nodemailer Gmail SMTP & Email Verification', () => {
  let verifiedUser;
  let unverifiedUser;
  let sentEmails = [];

  beforeAll(async () => {
    await connectDB(TEST_DB_URI);
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await User.deleteMany({});
      await PasswordResetToken.deleteMany({});
      await EmailVerificationToken.deleteMany({});
      await disconnectDB();
    }
  });

  beforeEach(async () => {
    resetRateLimits();
    sentEmails = [];

    // Configure mock Resend handler to avoid external network calls during testing
    setMockSendHandler(async (emailOptions) => {
      sentEmails.push(emailOptions);
      return { success: true, id: `mock-resend-${Date.now()}` };
    });

    await User.deleteMany({});
    await PasswordResetToken.deleteMany({});
    await EmailVerificationToken.deleteMany({});

    // 1. Create a verified active user
    verifiedUser = await User.create({
      fullName: 'Ananya Sharma',
      email: 'ananya.verified@example.com',
      phone: '9812345678',
      password: 'OldPassword123!',
      role: 'seeker',
      isVerified: true,
      verificationMethod: 'Govt_ID',
    });

    // 2. Create an unverified user
    unverifiedUser = await User.create({
      fullName: 'Rohan Verma',
      email: 'rohan.unverified@example.com',
      phone: '9812345679',
      password: 'OldPassword123!',
      role: 'seeker',
      isVerified: false,
    });
  });

  afterEach(() => {
    setMockSendHandler(null);
  });

  // ========================================================
  // PHASE 3 & 10: FORGOT PASSWORD TESTS
  // ========================================================
  describe('POST /api/auth/forgot-password', () => {
    it('should submit a valid registered and verified email and dispatch reset link', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'ananya.verified@example.com' });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe(
        'If an account exists with this email address, you will receive a password reset link shortly. Please check your inbox.'
      );

      // Verify token is stored in database as SHA-256 hash
      const tokenRecords = await PasswordResetToken.find({ user: verifiedUser._id });
      expect(tokenRecords.length).toBe(1);
      expect(tokenRecords[0].isUsed).toBe(false);
      expect(tokenRecords[0].hashedToken).toHaveLength(64); // SHA-256 hex string

      // Verify email was dispatched via Resend mock
      expect(sentEmails.length).toBe(1);
      expect(sentEmails[0].to).toBe('ananya.verified@example.com');
      expect(sentEmails[0].subject).toBe('Reset Your RoomSync Password');
      expect(sentEmails[0].text).toContain('/reset-password?token=');
      expect(sentEmails[0].html).toContain('Reset Password');
    });

    it('should submit an unregistered email and return identical generic success without leaking info', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'nonexistent.user@example.com' });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe(
        'If an account exists with this email address, you will receive a password reset link shortly. Please check your inbox.'
      );

      // No token created in database
      const tokenCount = await PasswordResetToken.countDocuments();
      expect(tokenCount).toBe(0);

      // No email sent
      expect(sentEmails.length).toBe(0);
    });

    it('should reject invalid email format with 400 VALIDATION_ERROR', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'invalid-email-address' });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject empty email with 400 VALIDATION_ERROR', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: '   ' });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return generic success but NOT send reset link for unverified account', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'rohan.unverified@example.com' });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe(
        'If an account exists with this email address, you will receive a password reset link shortly. Please check your inbox.'
      );

      // Verify no token created
      const tokenCount = await PasswordResetToken.countDocuments();
      expect(tokenCount).toBe(0);

      // Verify no email sent
      expect(sentEmails.length).toBe(0);
    });

    it('should enforce rate limiting on repeated requests (5 allowed, 6th blocked with 429)', async () => {
      for (let i = 0; i < 5; i++) {
        const res = await request(app)
          .post('/api/auth/forgot-password')
          .send({ email: 'ananya.verified@example.com' });
        expect(res.statusCode).toBe(200);
      }

      // 6th request exceeds the rate limit
      const blockedRes = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'ananya.verified@example.com' });

      expect(blockedRes.statusCode).toBe(429);
      expect(blockedRes.body.success).toBe(false);
      expect(blockedRes.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
    });

    it('should simulate a Resend provider failure securely and clean up generated token', async () => {
      // Mock failure from Resend
      setMockSendHandler(async () => {
        throw new Error('Resend rate limit exceeded on upstream domain');
      });

      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'ananya.verified@example.com' });

      expect(res.statusCode).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('EMAIL_DELIVERY_FAILED');
      expect(res.body.message).toBe(
        'Unable to send password reset email at this time. Please try again later.'
      );

      // Verify token record was rolled back/deleted so no active orphaned token remains
      const tokens = await PasswordResetToken.find({ user: verifiedUser._id });
      expect(tokens.length).toBe(0);
    });
  });

  // ========================================================
  // PHASE 7, 8 & 10: RESET PASSWORD TESTS
  // ========================================================
  describe('POST /api/auth/reset-password', () => {
    let rawToken;
    let hashedToken;

    beforeEach(async () => {
      rawToken = crypto.randomBytes(32).toString('hex');
      hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

      await PasswordResetToken.create({
        user: verifiedUser._id,
        hashedToken,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 mins validity
        isUsed: false,
      });
    });

    it('should successfully reset a password using a valid token and hash new password', async () => {
      const res = await request(app).post('/api/auth/reset-password').send({
        token: rawToken,
        newPassword: 'BrandNewSecurePassword456!',
      });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe(
        'Your password has been reset successfully. You can now log in using your new password.'
      );

      // Verify token marked as used in database
      const dbToken = await PasswordResetToken.findOne({ hashedToken });
      expect(dbToken.isUsed).toBe(true);

      // Verify user password was changed in DB
      const updatedUser = await User.findById(verifiedUser._id).select('+password');
      const isMatch = await updatedUser.matchPassword('BrandNewSecurePassword456!');
      expect(isMatch).toBe(true);
    });

    it('should reject reset with an invalid token string', async () => {
      const res = await request(app).post('/api/auth/reset-password').send({
        token: 'completely-fake-or-tampered-token',
        newPassword: 'NewPassword123!',
      });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_TOKEN');
      expect(res.body.message).toBe('This password reset link is invalid.');
    });

    it('should reject reset with an expired token', async () => {
      const expiredRawToken = crypto.randomBytes(32).toString('hex');
      const expiredHash = crypto
        .createHash('sha256')
        .update(expiredRawToken)
        .digest('hex');

      await PasswordResetToken.create({
        user: verifiedUser._id,
        hashedToken: expiredHash,
        expiresAt: new Date(Date.now() - 60 * 1000), // Expired 1 minute ago
        isUsed: false,
      });

      const res = await request(app).post('/api/auth/reset-password').send({
        token: expiredRawToken,
        newPassword: 'NewPassword123!',
      });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('TOKEN_EXPIRED');
      expect(res.body.message).toBe(
        'This password reset link has expired. Please request a new one.'
      );
    });

    it('should reject reset with an already-used token', async () => {
      const usedRawToken = crypto.randomBytes(32).toString('hex');
      const usedHash = crypto
        .createHash('sha256')
        .update(usedRawToken)
        .digest('hex');

      await PasswordResetToken.create({
        user: verifiedUser._id,
        hashedToken: usedHash,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        isUsed: true, // Already used
      });

      const res = await request(app).post('/api/auth/reset-password').send({
        token: usedRawToken,
        newPassword: 'NewPassword123!',
      });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('TOKEN_ALREADY_USED');
      expect(res.body.message).toBe('This password reset link has already been used.');
    });

    it('should reject reset with an empty or weak password', async () => {
      const res = await request(app).post('/api/auth/reset-password').send({
        token: rawToken,
        newPassword: '123', // Shorter than 6 chars
      });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should prevent token reuse after a successful password reset', async () => {
      // 1st request succeeds
      const firstRes = await request(app).post('/api/auth/reset-password').send({
        token: rawToken,
        newPassword: 'FirstNewPassword123!',
      });
      expect(firstRes.statusCode).toBe(200);

      // 2nd request with same token must fail
      const secondRes = await request(app).post('/api/auth/reset-password').send({
        token: rawToken,
        newPassword: 'SecondNewPassword123!',
      });

      expect(secondRes.statusCode).toBe(400);
      expect(secondRes.body.error.code).toBe('TOKEN_ALREADY_USED');
      expect(secondRes.body.message).toBe(
        'This password reset link has already been used.'
      );
    });

    it('should atomically process two simultaneous requests so only one succeeds', async () => {
      // Dispatch 2 concurrent requests with the identical token
      const [res1, res2] = await Promise.all([
        request(app).post('/api/auth/reset-password').send({
          token: rawToken,
          newPassword: 'ConcurrentPasswordA1!',
        }),
        request(app).post('/api/auth/reset-password').send({
          token: rawToken,
          newPassword: 'ConcurrentPasswordB2!',
        }),
      ]);

      const statusCodes = [res1.statusCode, res2.statusCode].sort();
      expect(statusCodes).toEqual([200, 400]);

      const failedRes = res1.statusCode === 400 ? res1 : res2;
      expect(failedRes.body.error.code).toBe('TOKEN_ALREADY_USED');
    });
  });

  // ========================================================
  // LOGIN TESTS WITH UPDATED PASSWORD
  // ========================================================
  describe('Login verification with new vs old password', () => {
    it('should succeed with new password and fail with old password', async () => {
      const rawToken = crypto.randomBytes(32).toString('hex');
      const hashed = crypto.createHash('sha256').update(rawToken).digest('hex');

      await PasswordResetToken.create({
        user: verifiedUser._id,
        hashedToken: hashed,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        isUsed: false,
      });

      // Reset password
      const resetRes = await request(app).post('/api/auth/reset-password').send({
        token: rawToken,
        newPassword: 'ModernReplacementPassword789!',
      });
      expect(resetRes.statusCode).toBe(200);

      // Attempt login with old password - MUST FAIL
      const oldLoginRes = await request(app).post('/api/auth/login').send({
        email: 'ananya.verified@example.com',
        password: 'OldPassword123!',
      });
      expect(oldLoginRes.statusCode).toBe(401);
      expect(oldLoginRes.body.error.code).toBe('INVALID_CREDENTIALS');

      // Attempt login with new password - MUST SUCCEED
      const newLoginRes = await request(app).post('/api/auth/login').send({
        email: 'ananya.verified@example.com',
        password: 'ModernReplacementPassword789!',
      });
      expect(newLoginRes.statusCode).toBe(200);
      expect(newLoginRes.body.success).toBe(true);
      expect(newLoginRes.body.data.token).toBeDefined();
    });
  });

  // ========================================================
  // PHASE 7: COMPLETE ARBITRARY RECIPIENT WORKFLOW
  // (Register -> Verify Email -> Forgot Password -> Reset -> Login)
  // ========================================================
  describe('Full Arbitrary Recipient Lifecycle (Gmail & College Domains)', () => {
    it('executes full flow: friend@gmail.com registers, verifies email, resets password, and logs in', async () => {
      // 1. Register new account with friend@gmail.com
      const regRes = await request(app).post('/api/auth/register').send({
        fullName: 'Friend User',
        email: 'friend@gmail.com',
        phone: '9876500001',
        password: 'InitialPassword123!',
        role: 'seeker',
      });
      expect(regRes.statusCode).toBe(201);
      expect(regRes.body.success).toBe(true);

      // Verify account starts unverified
      const registeredUser = await User.findOne({ email: 'friend@gmail.com' });
      expect(registeredUser.isVerified).toBe(false);

      // Verify email verification token was created and email sent
      const verifTokenDoc = await EmailVerificationToken.findOne({ user: registeredUser._id });
      expect(verifTokenDoc).toBeDefined();
      expect(verifTokenDoc.isUsed).toBe(false);

      // Extract raw token from sent verification emails
      expect(sentEmails.length).toBeGreaterThanOrEqual(1);
      const verifEmail = sentEmails.find(
        (e) => e.to === 'friend@gmail.com' && e.subject.includes('Verify')
      );
      expect(verifEmail).toBeDefined();
      const verifTokenMatch = verifEmail.verificationUrl.match(/token=([a-f0-9]+)/);
      expect(verifTokenMatch).toBeTruthy();
      const rawVerifToken = verifTokenMatch[1];

      // Prior to email verification, forgot-password should NOT dispatch reset link
      sentEmails = [];
      const unverifiedForgotRes = await request(app).post('/api/auth/forgot-password').send({
        email: 'friend@gmail.com',
      });
      expect(unverifiedForgotRes.statusCode).toBe(200);
      expect(sentEmails.length).toBe(0); // Not dispatched to unverified account

      // 2. Complete email verification using token
      const verifyRes = await request(app).post('/api/auth/verify-email').send({
        token: rawVerifToken,
      });
      expect(verifyRes.statusCode).toBe(200);
      expect(verifyRes.body.success).toBe(true);
      expect(verifyRes.body.data.isVerified).toBe(true);

      const verifiedFriend = await User.findOne({ email: 'friend@gmail.com' });
      expect(verifiedFriend.isVerified).toBe(true);

      // Verification token cannot be reused
      const duplicateVerifyRes = await request(app).post('/api/auth/verify-email').send({
        token: rawVerifToken,
      });
      expect(duplicateVerifyRes.statusCode).toBe(400);
      expect(duplicateVerifyRes.body.error.code).toBe('TOKEN_ALREADY_USED');

      // 3. User logs out and requests password reset
      sentEmails = [];
      const forgotRes = await request(app).post('/api/auth/forgot-password').send({
        email: 'friend@gmail.com',
      });
      expect(forgotRes.statusCode).toBe(200);
      expect(forgotRes.body.success).toBe(true);

      // 4. Verify password reset email delivered to friend@gmail.com
      expect(sentEmails.length).toBe(1);
      expect(sentEmails[0].to).toBe('friend@gmail.com');
      const resetTokenMatch = sentEmails[0].resetUrl.match(/token=([a-f0-9]+)/);
      expect(resetTokenMatch).toBeTruthy();
      const rawResetToken = resetTokenMatch[1];

      // 5. Friend clicks reset link and changes password
      const resetRes = await request(app).post('/api/auth/reset-password').send({
        token: rawResetToken,
        newPassword: 'FriendNewSecurePassword999!',
      });
      expect(resetRes.statusCode).toBe(200);
      expect(resetRes.body.success).toBe(true);

      // 6. Old password no longer works
      const oldLoginRes = await request(app).post('/api/auth/login').send({
        email: 'friend@gmail.com',
        password: 'InitialPassword123!',
      });
      expect(oldLoginRes.statusCode).toBe(401);

      // 7. Login with new password succeeds
      const newLoginRes = await request(app).post('/api/auth/login').send({
        email: 'friend@gmail.com',
        password: 'FriendNewSecurePassword999!',
      });
      expect(newLoginRes.statusCode).toBe(200);
      expect(newLoginRes.body.success).toBe(true);
      expect(newLoginRes.body.data.token).toBeDefined();

      // 8. Reset token cannot be reused
      const reuseResetRes = await request(app).post('/api/auth/reset-password').send({
        token: rawResetToken,
        newPassword: 'AnotherPassword123!',
      });
      expect(reuseResetRes.statusCode).toBe(400);
      expect(reuseResetRes.body.error.code).toBe('TOKEN_ALREADY_USED');
    });

    it('works seamlessly with college email address (@spit.ac.in)', async () => {
      const regRes = await request(app).post('/api/auth/register').send({
        fullName: 'College Student',
        email: 'student@spit.ac.in',
        phone: '9876500002',
        password: 'InitialStudentPass123!',
        role: 'seeker',
      });
      expect(regRes.statusCode).toBe(201);

      const verifEmail = sentEmails.find((e) => e.to === 'student@spit.ac.in');
      expect(verifEmail).toBeDefined();
      const rawVerifToken = verifEmail.verificationUrl.match(/token=([a-f0-9]+)/)[1];

      // Verify email
      const verifyRes = await request(app).post('/api/auth/verify-email').send({ token: rawVerifToken });
      expect(verifyRes.statusCode).toBe(200);

      // Request password reset
      sentEmails = [];
      await request(app).post('/api/auth/forgot-password').send({ email: 'student@spit.ac.in' });
      expect(sentEmails.length).toBe(1);
      expect(sentEmails[0].to).toBe('student@spit.ac.in');
    });
  });
});

