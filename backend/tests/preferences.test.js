import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import User from '../src/models/User.js';
import PreferenceProfile from '../src/models/PreferenceProfile.js';
import { connectDB, disconnectDB } from '../src/config/db.js';

const TEST_DB_URI =
  process.env.MONGODB_PREFERENCES_TEST_URI ||
  'mongodb://localhost:27017/roomsync_test_preferences';

describe('RoomSync Preference Profile API (/api/preferences)', () => {
  let userToken1;
  let userId1;
  let userToken2;
  let userId2;

  beforeAll(async () => {
    await connectDB(TEST_DB_URI);
    await User.syncIndexes();
    await PreferenceProfile.syncIndexes();
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await User.deleteMany({});
      await PreferenceProfile.deleteMany({});
      await disconnectDB();
    }
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await PreferenceProfile.deleteMany({});

    // Register User 1
    const regRes1 = await request(app).post('/api/auth/register').send({
      fullName: 'Priya Sharma',
      email: 'priya.seeker@example.com',
      phone: '9876543210',
      password: 'Password123!',
      role: 'seeker',
    });
    userToken1 = regRes1.body.data.token;
    userId1 = regRes1.body.data.user.id;

    // Register User 2
    const regRes2 = await request(app).post('/api/auth/register').send({
      fullName: 'Vikram Malhotra',
      email: 'vikram.seeker@example.com',
      phone: '9876543211',
      password: 'Password123!',
      role: 'seeker',
    });
    userToken2 = regRes2.body.data.token;
    userId2 = regRes2.body.data.user.id;
  });

  describe('GET /api/preferences', () => {
    it('should reject unauthenticated request with 401', async () => {
      const res = await request(app).get('/api/preferences');

      expect(res.statusCode).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 404 PROFILE_NOT_FOUND if user has not created preferences yet', async () => {
      const res = await request(app)
        .get('/api/preferences')
        .set('Authorization', `Bearer ${userToken1}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('PROFILE_NOT_FOUND');
    });
  });

  describe('PUT /api/preferences (Create & Update Upsert)', () => {
    const validPreferences = {
      hardConstraints: {
        budgetCeiling: 22000,
        maxDeposit: 50000,
        dietaryRule: 'Pure-Veg',
        smokingPolicy: 'Strictly Non-Smoking',
        alcoholPolicy: 'Teetotaler',
        petPolicy: 'Strictly No Pets',
        maxCommuteMins: 45,
        latestMoveIn: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        stayDuration: 11,
      },
      flexiblePreferences: {
        sleepSchedule: 23.5,
        wakeSchedule: 7.5,
        cleanliness: 4,
        noiseTolerance: 3,
        guestPolicy: 'Occasional',
        overnightGuests: 'With Notice',
        socialPreference: 'Balanced',
        workSchedule: 'Regular Day',
        wfhDays: 2,
        studyHabits: 'Moderate Study',
        cookingHabit: 'Daily',
        foodSharing: 'Separate Groceries',
        personalSpace: 'High',
        rulesStrictness: 'Moderate',
      },
      importanceWeights: {
        budget: 5,
        diet: 5,
        sleepSync: 4,
        cleanliness: 4,
        noise: 3,
        guests: 3,
        wfh: 2,
      },
    };

    it('should create new preference profile and mark onboarding completed on User record', async () => {
      const res = await request(app)
        .put('/api/preferences')
        .set('Authorization', `Bearer ${userToken1}`)
        .send(validPreferences);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Preferences saved successfully.');

      const data = res.body.data;
      expect(data.id).toBeDefined();
      expect(data.hardConstraints.budgetCeiling).toBe(22000);
      expect(data.hardConstraints.dietaryRule).toBe('Pure-Veg');
      expect(data.flexiblePreferences.sleepSchedule).toBe(23.5);
      expect(data.importanceWeights.budget).toBe(5);

      // Verify user onboarding status was updated in DB
      const dbUser = await User.findById(userId1);
      expect(dbUser.hasCompletedOnboarding).toBe(true);
    });

    it('should update existing preference profile idempotently without creating duplicate documents', async () => {
      // First save
      await request(app)
        .put('/api/preferences')
        .set('Authorization', `Bearer ${userToken1}`)
        .send(validPreferences);

      // Second save with updated budget ceiling
      const res = await request(app)
        .put('/api/preferences')
        .set('Authorization', `Bearer ${userToken1}`)
        .send({
          ...validPreferences,
          hardConstraints: {
            ...validPreferences.hardConstraints,
            budgetCeiling: 25000,
          },
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.hardConstraints.budgetCeiling).toBe(25000);

      // Verify only ONE document exists for this user in DB
      const count = await PreferenceProfile.countDocuments({ user: userId1 });
      expect(count).toBe(1);
    });

    it('should enforce user isolation: User 2 cannot see User 1 preferences', async () => {
      // User 1 saves preferences
      await request(app)
        .put('/api/preferences')
        .set('Authorization', `Bearer ${userToken1}`)
        .send(validPreferences);

      // User 2 requests preferences before saving their own
      const res2 = await request(app)
        .get('/api/preferences')
        .set('Authorization', `Bearer ${userToken2}`);

      expect(res2.statusCode).toBe(404);
      expect(res2.body.error.code).toBe('PROFILE_NOT_FOUND');
    });

    it('should reject invalid budgetCeiling below minimum (₹1000)', async () => {
      const res = await request(app)
        .put('/api/preferences')
        .set('Authorization', `Bearer ${userToken1}`)
        .send({
          ...validPreferences,
          hardConstraints: {
            ...validPreferences.hardConstraints,
            budgetCeiling: 500, // Invalid: < 1000
          },
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject invalid importance weight outside 1 to 5', async () => {
      const res = await request(app)
        .put('/api/preferences')
        .set('Authorization', `Bearer ${userToken1}`)
        .send({
          ...validPreferences,
          importanceWeights: {
            ...validPreferences.importanceWeights,
            budget: 9, // Invalid: > 5
          },
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject invalid sleepSchedule outside 0.0 to 23.5', async () => {
      const res = await request(app)
        .put('/api/preferences')
        .set('Authorization', `Bearer ${userToken1}`)
        .send({
          ...validPreferences,
          flexiblePreferences: {
            ...validPreferences.flexiblePreferences,
            sleepSchedule: 26, // Invalid
          },
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject invalid enum value for dietaryRule', async () => {
      const res = await request(app)
        .put('/api/preferences')
        .set('Authorization', `Bearer ${userToken1}`)
        .send({
          ...validPreferences,
          hardConstraints: {
            ...validPreferences.hardConstraints,
            dietaryRule: 'InvalidDietType',
          },
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/preferences/validate', () => {
    it('should return isValid: true and warnings for unusual parameters', async () => {
      const res = await request(app)
        .post('/api/preferences/validate')
        .send({
          hardConstraints: {
            budgetCeiling: 3000, // Low budget warning
          },
          flexiblePreferences: {
            sleepSchedule: 23,
            wakeSchedule: 2, // 3 hours sleep duration warning
          },
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.isValid).toBe(true);
      expect(Array.isArray(res.body.warnings)).toBe(true);
      expect(res.body.warnings.length).toBeGreaterThan(0);
    });
  });
});
