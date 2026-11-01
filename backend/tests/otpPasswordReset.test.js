import request from 'supertest';
import mongoose from 'mongoose';
import { jest } from '@jest/globals';
import app from '../src/app.js';
import User from '../src/models/User.js';
import { connectDB, disconnectDB } from '../src/config/db.js';

const TEST_DB_URI =
  process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/roomsync_test_otp';

describe('RoomSync Email OTP-Based Forgot Password API', () => {
  jest.setTimeout(35000);
  beforeAll(async () => {
    await connectDB(TEST_DB_URI);
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await User.deleteMany({});
      await disconnectDB();
    }
  });

  beforeEach(async () => {
    await User.deleteMany({});
  });

  const testUser = {
    fullName: 'Shivam Poddar',
    email: 'shivam.test@roomsync.in',
    phone: '9876543210',
    password: 'InitialPassword123!',
    role: 'seeker',
  };

  it('should generate secure 6-digit OTP, store SHA-256 hash, and return generic safe response', async () => {
    await User.create(testUser);

    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: testUser.email });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('6-digit verification code has been sent');

    // Verify DB state
    const userInDb = await User.findOne({ email: testUser.email }).select(
      '+passwordResetOTP +passwordResetOTPExpires +passwordResetAttempts'
    );
    expect(userInDb.passwordResetOTP).toBeDefined();
    // Verify SHA-256 hex string length is 64 characters
    expect(userInDb.passwordResetOTP).toHaveLength(64);
    // Expires ~5 minutes from now
    expect(userInDb.passwordResetOTPExpires.getTime()).toBeGreaterThan(Date.now() + 4 * 60 * 1000);
    expect(userInDb.passwordResetOTPExpires.getTime()).toBeLessThanOrEqual(Date.now() + 5 * 60 * 1000 + 2000);
    expect(userInDb.passwordResetAttempts).toBe(0);
  });

  it('should return 200 generic message even if email is not registered (prevent enumeration)', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'nonexistent.user@random.com' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('6-digit verification code has been sent');
  });

  it('should enforce 60-second cooldown on rapid resend requests', async () => {
    await User.create(testUser);

    // First request
    const firstRes = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: testUser.email });
    expect(firstRes.status).toBe(200);

    // Immediate second request within cooldown
    const secondRes = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: testUser.email });
    expect(secondRes.status).toBe(429);
    expect(secondRes.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
  });

  it('should track failed attempts and reject incorrect OTP', async () => {
    const user = await User.create(testUser);
    const plainOtp = user.createPasswordResetOTP();
    await user.save({ validateBeforeSave: false });

    // Attempt with incorrect OTP
    const res = await request(app)
      .post('/api/auth/verify-otp')
      .send({ email: testUser.email, otp: '000000' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INCORRECT_OTP');
    expect(res.body.error.remainingAttempts).toBe(4);

    const userInDb = await User.findOne({ email: testUser.email }).select('+passwordResetAttempts');
    expect(userInDb.passwordResetAttempts).toBe(1);
  });

  it('should invalidate OTP after 5 failed attempts (brute-force protection)', async () => {
    const user = await User.create(testUser);
    user.createPasswordResetOTP();
    user.passwordResetAttempts = 5;
    await user.save({ validateBeforeSave: false });

    const res = await request(app)
      .post('/api/auth/verify-otp')
      .send({ email: testUser.email, otp: '123456' });

    expect(res.status).toBe(429);
    expect(res.body.error.code).toBe('MAX_ATTEMPTS_EXCEEDED');

    const userInDb = await User.findOne({ email: testUser.email }).select('+passwordResetOTP');
    expect(userInDb.passwordResetOTP).toBeUndefined();
  });

  it('should reject expired OTP (older than 5 minutes)', async () => {
    const user = await User.create(testUser);
    const plainOtp = user.createPasswordResetOTP();
    // Backdate expiration
    user.passwordResetOTPExpires = new Date(Date.now() - 1000);
    await user.save({ validateBeforeSave: false });

    const res = await request(app)
      .post('/api/auth/verify-otp')
      .send({ email: testUser.email, otp: plainOtp });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('OTP_EXPIRED');
  });

  it('should verify valid OTP, invalidate OTP for single-use, and issue reset token', async () => {
    const user = await User.create(testUser);
    const plainOtp = user.createPasswordResetOTP();
    await user.save({ validateBeforeSave: false });

    const res = await request(app)
      .post('/api/auth/verify-otp')
      .send({ email: testUser.email, otp: plainOtp });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.resetToken).toBeDefined();

    const resetToken = res.body.data.resetToken;

    // Verify OTP was cleared (single-use)
    const userInDb = await User.findOne({ email: testUser.email }).select(
      '+passwordResetOTP +tempResetToken'
    );
    expect(userInDb.passwordResetOTP).toBeUndefined();
    expect(userInDb.tempResetToken).toBeDefined();

    // Replay attempt with same OTP must fail
    const replayRes = await request(app)
      .post('/api/auth/verify-otp')
      .send({ email: testUser.email, otp: plainOtp });
    expect(replayRes.status).toBe(400);

    // Now reset password using the reset token
    const newPassword = 'BrandNewSecurePassword456!';
    const resetRes = await request(app)
      .post('/api/auth/reset-password-otp')
      .send({
        email: testUser.email,
        resetToken,
        password: newPassword,
        confirmPassword: newPassword,
      });

    expect(resetRes.status).toBe(200);
    expect(resetRes.body.success).toBe(true);
    expect(resetRes.body.data.token).toBeDefined();

    // Verify user can now log in with new password
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: newPassword });
    expect(loginRes.status).toBe(200);

    // Verify reset token was invalidated (cannot be reused)
    const reusedResetRes = await request(app)
      .post('/api/auth/reset-password-otp')
      .send({
        email: testUser.email,
        resetToken,
        password: 'AnotherPassword789!',
      });
    expect(reusedResetRes.status).toBe(400);
  });
});
