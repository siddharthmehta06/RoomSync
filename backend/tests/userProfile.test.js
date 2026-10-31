import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import User from '../src/models/User.js';
import { connectDB, disconnectDB } from '../src/config/db.js';

const TEST_DB_URI =
  process.env.MONGODB_PROFILE_TEST_URI ||
  'mongodb://localhost:27017/roomsync_test_userprofile';

describe('RoomSync User Profile API (/api/users/profile)', () => {
  let userToken;
  let userId;

  beforeAll(async () => {
    await connectDB(TEST_DB_URI);
    await User.syncIndexes();
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await User.deleteMany({});
      await disconnectDB();
    }
  });

  beforeEach(async () => {
    await User.deleteMany({});

    // Register a test user
    const regRes = await request(app).post('/api/auth/register').send({
      fullName: 'Aarav Patel',
      email: 'aarav.patel@example.com',
      phone: '9876543210',
      password: 'SecurePassword123!',
      role: 'seeker',
    });

    userToken = regRes.body.data.token;
    userId = regRes.body.data.user.id;
  });

  describe('GET /api/users/profile', () => {
    it('should reject unauthenticated request with 401', async () => {
      const res = await request(app).get('/api/users/profile');

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return the authenticated user profile with safe fields', async () => {
      const res = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();

      const data = res.body.data;
      expect(data.id).toBe(userId);
      expect(data.fullName).toBe('Aarav Patel');
      expect(data.email).toBe('aarav.patel@example.com');
      expect(data.phone).toBe('9876543210');
      expect(data.role).toBe('seeker');
      expect(data.city).toBe('Mumbai');
      expect(data.isVerified).toBe(false);

      // Sensitive fields must NOT be returned
      expect(data.password).toBeUndefined();
    });
  });

  describe('PUT /api/users/profile', () => {
    it('should reject unauthenticated profile update with 401', async () => {
      const res = await request(app).put('/api/users/profile').send({
        fullName: 'Aarav Kumar Patel',
      });

      expect(res.statusCode).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should update permitted profile fields successfully', async () => {
      const res = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          fullName: 'Aarav Kumar Patel',
          phone: '9876501234',
          occupation: 'Senior Software Engineer',
          company: 'Swiggy',
          city: 'Bengaluru',
          bio: 'Passionate about distributed systems and quiet evenings.',
          avatar: 'https://images.unsplash.com/photo-test-avatar',
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Profile updated successfully.');

      const data = res.body.data;
      expect(data.fullName).toBe('Aarav Kumar Patel');
      expect(data.phone).toBe('9876501234');
      expect(data.occupation).toBe('Senior Software Engineer');
      expect(data.company).toBe('Swiggy');
      expect(data.bio).toBe(
        'Passionate about distributed systems and quiet evenings.'
      );
      expect(data.avatar).toBe('https://images.unsplash.com/photo-test-avatar');

      // Verify persistence in DB
      const dbUser = await User.findById(userId);
      expect(dbUser.fullName).toBe('Aarav Kumar Patel');
      expect(dbUser.phone).toBe('9876501234');
      expect(dbUser.company).toBe('Swiggy');
    });

    it('should ignore attempts to update protected fields (role, password, isVerified, email)', async () => {
      const dbUserBefore = await User.findById(userId).select('+password');
      const originalPasswordHash = dbUserBefore.password;

      const res = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          role: 'admin', // Attempted role escalation
          isVerified: true, // Attempted verification spoof
          email: 'hacked@example.com', // Attempted email change
          password: 'NewPlainPassword!', // Attempted password injection
          hasCompletedOnboarding: true,
        });

      expect(res.statusCode).toBe(200);

      // Verify protected fields were NOT modified
      const dbUserAfter = await User.findById(userId).select('+password');
      expect(dbUserAfter.role).toBe('seeker');
      expect(dbUserAfter.isVerified).toBe(false);
      expect(dbUserAfter.email).toBe('aarav.patel@example.com');
      expect(dbUserAfter.password).toBe(originalPasswordHash);
    });

    it('should reject invalid phone format with 400 validation error', async () => {
      const res = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          phone: '12345', // Invalid phone
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(
        res.body.error.details.some((d) => d.field === 'phone')
      ).toBe(true);
    });

    it('should reject invalid fullName length with 400 validation error', async () => {
      const res = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          fullName: 'A', // Too short (min 2)
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(
        res.body.error.details.some((d) => d.field === 'fullName')
      ).toBe(true);
    });
  });
});
