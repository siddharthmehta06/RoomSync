import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import User from '../src/models/User.js';
import RoomListing from '../src/models/RoomListing.js';
import PreferenceProfile from '../src/models/PreferenceProfile.js';
import Interaction from '../src/models/Interaction.js';
import { connectDB, disconnectDB } from '../src/config/db.js';

const TEST_DB_URI =
  process.env.MONGODB_MATCHES_TEST_URI ||
  'mongodb://localhost:27017/roomsync_test_matches';

describe('RoomSync Explainable Matching API (/api/matches & compatibility-preview)', () => {
  let seeker1Token;
  let seeker1Id;
  let seeker2Token;
  let seeker2Id;
  let ownerToken;
  let ownerId;
  let eligibleRoomId;
  let expensiveRoomId;
  let nonVegRoomId;
  let inactiveRoomId;

  beforeAll(async () => {
    await connectDB(TEST_DB_URI);
    await User.syncIndexes();
    await RoomListing.syncIndexes();
    await PreferenceProfile.syncIndexes();
    await Interaction.syncIndexes();
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await User.deleteMany({});
      await RoomListing.deleteMany({});
      await PreferenceProfile.deleteMany({});
      await Interaction.deleteMany({});
      await disconnectDB();
    }
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await RoomListing.deleteMany({});
    await PreferenceProfile.deleteMany({});
    await Interaction.deleteMany({});

    // 1. Register Seeker 1 (Strict Pure-Veg, non-smoking, max rent 25000)
    const s1Res = await request(app).post('/api/auth/register').send({
      fullName: 'Ananya Sharma',
      email: 'ananya.sharma@example.com',
      phone: '9876543201',
      password: 'Password123!',
      role: 'seeker',
    });
    seeker1Token = s1Res.body.data.token;
    seeker1Id = s1Res.body.data.user.id;

    // 2. Register Seeker 2 (Flexible, non-veg, night owl)
    const s2Res = await request(app).post('/api/auth/register').send({
      fullName: 'Vikram Joshi',
      email: 'vikram.joshi@example.com',
      phone: '9876543202',
      password: 'Password123!',
      role: 'seeker',
    });
    seeker2Token = s2Res.body.data.token;
    seeker2Id = s2Res.body.data.user.id;

    // 3. Register Owner
    const ownerRes = await request(app).post('/api/auth/register').send({
      fullName: 'Karthik Rao',
      email: 'karthik.rao@example.com',
      phone: '9876543203',
      password: 'Password123!',
      role: 'owner',
    });
    ownerToken = ownerRes.body.data.token;
    ownerId = ownerRes.body.data.user.id;
    await User.findByIdAndUpdate(ownerId, { ownerVerificationStatus: 'Verified', isVerified: true });

    // 4. Save PreferenceProfile for Seeker 1
    await request(app)
      .put('/api/preferences')
      .set('Authorization', `Bearer ${seeker1Token}`)
      .send({
        hardConstraints: {
          budgetCeiling: 25000,
          maxDeposit: 50000,
          dietaryRule: 'Pure-Veg',
          smokingPolicy: 'Strictly Non-Smoking',
          alcoholPolicy: 'Teetotaler',
          petPolicy: 'Strictly No Pets',
          maxCommuteMins: 30,
          earliestMoveIn: new Date(),
          latestMoveIn: new Date(Date.now() + 30 * 24 * 3600 * 1000),
          stayDuration: 6,
        },
        flexiblePreferences: {
          sleepSchedule: 23.0,
          wakeSchedule: 7.0,
          cleanliness: 4,
          noiseTolerance: 2,
          wfhDays: 3,
          guestPolicy: 'Occasional',
          overnightGuests: 'With Notice',
          socialPreference: 'Balanced',
          workSchedule: 'Standard corporate day shifts',
          studyHabits: 'Quiet evening reading',
          cookingHabit: 'Daily',
          foodSharing: 'Separate Groceries',
          personalSpace: 'High',
          rulesStrictness: 'Moderate',
        },
        importanceWeights: {
          budget: 5,
          diet: 5,
          sleepSync: 5,
          cleanliness: 4,
          noise: 4,
          guests: 3,
          wfh: 3,
        },
      });

    // 5. Create Listings
    // Listing A: Perfect match for Seeker 1 (Pure Veg, Non-Smoking, Rent 20000)
    const roomARes = await request(app)
      .post('/api/rooms')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        title: 'Sunlit Master Bedroom in Pure Veg Apartment',
        locality: 'Koramangala 4th Block',
        city: 'Bengaluru',
        pinCode: '560034',
        rent: 20000,
        maintenance: 1500,
        deposit: 40000,
        roomType: 'Private Room with Attached Bath',
        furnishing: 'Fully Furnished',
        availableFrom: '2026-11-01T00:00:00.000Z',
        livingConditions: {
          foodPreference: 'Pure Vegetarian',
          smoking: 'Strictly Non-Smoking',
          alcohol: 'Teetotaler',
          sleepSchedule: 23.0,
          wakeSchedule: 7.0,
          cleanliness: 4.0,
          noiseTolerance: 2.0,
          wfhFrequency: 3,
          petsPreference: 'Strictly no pets allowed',
        },
      });
    eligibleRoomId = roomARes.body.data.id;

    // Listing B: Exceeds budget (Rent 35000)
    const roomBRes = await request(app)
      .post('/api/rooms')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        title: 'Luxury Penthouse Room in Indiranagar',
        locality: 'Indiranagar 100ft Road',
        city: 'Bengaluru',
        pinCode: '560038',
        rent: 35000,
        maintenance: 3000,
        deposit: 70000,
        roomType: 'Private Room with Attached Bath',
        furnishing: 'Fully Furnished',
        availableFrom: '2026-11-01T00:00:00.000Z',
        livingConditions: {
          foodPreference: 'Pure Vegetarian',
          smoking: 'Strictly Non-Smoking',
          alcohol: 'Teetotaler',
          petsPreference: 'No pets allowed',
        },
      });
    expensiveRoomId = roomBRes.body.data.id;

    // Listing C: Dietary mismatch for Seeker 1 (Non-Veg Welcome)
    const roomCRes = await request(app)
      .post('/api/rooms')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        title: 'Cozy Room in Foodie Flat HSR Layout',
        locality: 'HSR Layout Sector 2',
        city: 'Bengaluru',
        pinCode: '560102',
        rent: 18000,
        maintenance: 1000,
        deposit: 36000,
        roomType: 'Private Room (Shared Bath)',
        furnishing: 'Semi-Furnished',
        availableFrom: '2026-11-01T00:00:00.000Z',
        livingConditions: {
          foodPreference: 'Non-Veg Welcome',
          smoking: 'Strictly Non-Smoking',
          alcohol: 'Social Drinking OK',
          petsPreference: 'Cat-friendly',
        },
      });
    nonVegRoomId = roomCRes.body.data.id;

    // Listing D: Inactive / Occupied Room
    const roomDRes = await request(app)
      .post('/api/rooms')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        title: 'Occupied Studio in Whitefield',
        locality: 'Whitefield Main Road',
        city: 'Bengaluru',
        pinCode: '560066',
        rent: 15000,
        deposit: 30000,
        roomType: 'Shared Room',
        furnishing: 'Fully Furnished',
        availableFrom: '2026-11-01T00:00:00.000Z',
      });
    inactiveRoomId = roomDRes.body.data.id;
    await RoomListing.findByIdAndUpdate(inactiveRoomId, { status: 'occupied' });
  });

  // ==========================================
  // 1. AUTHENTICATION & ACCESS CONTROL
  // ==========================================
  describe('GET /api/matches — Authentication & Authorization', () => {
    it('should reject unauthenticated requests with 401 Unauthorized', async () => {
      const res = await request(app).get('/api/matches');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 400 PROFILE_INCOMPLETE if seeker has not completed onboarding', async () => {
      // Seeker 2 has no PreferenceProfile
      const res = await request(app)
        .get('/api/matches')
        .set('Authorization', `Bearer ${seeker2Token}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('PROFILE_INCOMPLETE');
      expect(res.body.message).toContain('onboarding');
    });

    it('should ignore any spoofed userId query parameters and strictly enforce authenticated identity', async () => {
      // Attacker tries to query using someone else's preferences
      const res = await request(app)
        .get(`/api/matches?userId=${seeker1Id}`)
        .set('Authorization', `Bearer ${seeker2Token}`);

      // Must fail because authenticated user (seeker2) has no profile
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('PROFILE_INCOMPLETE');
    });
  });

  // ==========================================
  // 2. MATCH CALCULATION & FILTERING
  // ==========================================
  describe('GET /api/matches — Candidate Loading & Matching Execution', () => {
    it('should return eligible matches for authenticated seeker adhering to contract', async () => {
      const res = await request(app)
        .get('/api/matches')
        .set('Authorization', `Bearer ${seeker1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);

      const firstMatch = res.body.data[0];
      expect(firstMatch).toHaveProperty('room');
      expect(firstMatch.room.id).toBe(eligibleRoomId);
      expect(firstMatch).toHaveProperty('compatibilityScore');
      expect(firstMatch).toHaveProperty('rankingScore');
      expect(firstMatch).toHaveProperty('strengths');
      expect(firstMatch).toHaveProperty('mismatches');
      expect(firstMatch).toHaveProperty('factorBreakdown');
      expect(firstMatch).toHaveProperty('algorithmMetadata');

      // Check metadata counts
      expect(res.body.meta).toHaveProperty('totalEvaluated');
      expect(res.body.meta).toHaveProperty('eligibleMatches');
      expect(res.body.meta).toHaveProperty('disqualifiedByHardConstraints');
    });

    it('should strictly exclude occupied or deactivated listings from candidate pool', async () => {
      const res = await request(app)
        .get('/api/matches?includeDisqualified=true')
        .set('Authorization', `Bearer ${seeker1Token}`);

      expect(res.status).toBe(200);
      const matchRoomIds = res.body.data.map((m) => m.room.id);
      expect(matchRoomIds).not.toContain(inactiveRoomId);
    });

    it('should strictly separate compatibilityScore and rankingScore metrics', async () => {
      const res = await request(app)
        .get('/api/matches')
        .set('Authorization', `Bearer ${seeker1Token}`);

      expect(res.status).toBe(200);
      const match = res.body.data[0];

      expect(typeof match.compatibilityScore).toBe('number');
      expect(match.compatibilityScore).toBeGreaterThanOrEqual(0);
      expect(match.compatibilityScore).toBeLessThanOrEqual(100);

      expect(typeof match.rankingScore).toBe('number');
      expect(match.rankingScore).toBeGreaterThanOrEqual(0.0);
      expect(match.rankingScore).toBeLessThanOrEqual(10.0);
    });

    it('should exclude disqualified listings when includeDisqualified is omitted or false', async () => {
      const res = await request(app)
        .get('/api/matches')
        .set('Authorization', `Bearer ${seeker1Token}`);

      expect(res.status).toBe(200);
      const returnedIds = res.body.data.map((m) => m.room.id);
      // Expensive and non-veg rooms fail Seeker 1 hard constraints
      expect(returnedIds).not.toContain(expensiveRoomId);
      expect(returnedIds).not.toContain(nonVegRoomId);
    });

    it('should include disqualified listings with exclusionReasons when includeDisqualified=true', async () => {
      const res = await request(app)
        .get('/api/matches?includeDisqualified=true')
        .set('Authorization', `Bearer ${seeker1Token}`);

      expect(res.status).toBe(200);
      const returnedIds = res.body.data.map((m) => m.room.id);
      expect(returnedIds).toContain(expensiveRoomId);
      expect(returnedIds).toContain(nonVegRoomId);

      const expensiveMatch = res.body.data.find(
        (m) => m.room.id === expensiveRoomId
      );
      expect(expensiveMatch.algorithmMetadata.hardConstraintPassed).toBe(false);
      expect(expensiveMatch.exclusionReasons).toContain(
        'EXCEEDS_BUDGET_CEILING'
      );

      const nonVegMatch = res.body.data.find((m) => m.room.id === nonVegRoomId);
      expect(nonVegMatch.algorithmMetadata.hardConstraintPassed).toBe(false);
      expect(nonVegMatch.exclusionReasons).toContain('DIETARY_RULE_MISMATCH');
    });
  });

  // ==========================================
  // 3. QUERY PARAMETERS & PAGINATION
  // ==========================================
  describe('GET /api/matches — Query Validation & Pagination', () => {
    it('should reject malformed or negative page and limit parameters', async () => {
      const res1 = await request(app)
        .get('/api/matches?page=-1')
        .set('Authorization', `Bearer ${seeker1Token}`);
      expect(res1.status).toBe(400);
      expect(res1.body.error.code).toBe('VALIDATION_ERROR');

      const res2 = await request(app)
        .get('/api/matches?limit=0')
        .set('Authorization', `Bearer ${seeker1Token}`);
      expect(res2.status).toBe(400);
      expect(res2.body.error.code).toBe('VALIDATION_ERROR');

      const res3 = await request(app)
        .get('/api/matches?limit=101')
        .set('Authorization', `Bearer ${seeker1Token}`);
      expect(res3.status).toBe(400);
      expect(res3.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject unsupported sortBy values', async () => {
      const res = await request(app)
        .get('/api/matches?sortBy=unsupported_metric')
        .set('Authorization', `Bearer ${seeker1Token}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should accept sortBy=topsis_rank and return matches in TOPSIS ranking order', async () => {
      // Create a second eligible room to verify multi-room TOPSIS ranking order
      await request(app)
        .post('/api/rooms')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          title: 'Quiet Room in BTM Layout Pure Veg Flat',
          locality: 'BTM 2nd Stage',
          city: 'Bengaluru',
          pinCode: '560076',
          rent: 16000,
          maintenance: 1000,
          deposit: 32000,
          roomType: 'Private Room (Shared Bath)',
          furnishing: 'Semi-Furnished',
          availableFrom: '2026-11-01T00:00:00.000Z',
          livingConditions: {
            foodPreference: 'Pure Vegetarian',
            smoking: 'Strictly Non-Smoking',
            alcohol: 'Teetotaler',
            sleepSchedule: 23.0,
            wakeSchedule: 7.0,
            cleanliness: 4.5,
            noiseTolerance: 2.0,
            wfhFrequency: 3,
            petsPreference: 'Strictly no pets allowed',
          },
        });

      const res = await request(app)
        .get('/api/matches?sortBy=topsis_rank')
        .set('Authorization', `Bearer ${seeker1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
      // Verify matches are in descending order of rankingScore
      for (let i = 0; i < res.body.data.length - 1; i++) {
        expect(res.body.data[i].rankingScore).toBeGreaterThanOrEqual(
          res.body.data[i + 1].rankingScore
        );
      }
    });

    it('should preserve ranking_desc behavior matching topsis_rank order', async () => {
      const resTopsis = await request(app)
        .get('/api/matches?sortBy=topsis_rank')
        .set('Authorization', `Bearer ${seeker1Token}`);

      const resRankingDesc = await request(app)
        .get('/api/matches?sortBy=ranking_desc')
        .set('Authorization', `Bearer ${seeker1Token}`);

      expect(resTopsis.status).toBe(200);
      expect(resRankingDesc.status).toBe(200);
      expect(resTopsis.body.data.map((m) => m.room.id)).toEqual(
        resRankingDesc.body.data.map((m) => m.room.id)
      );
    });

    it('should sort correctly by compatibility_desc when requested', async () => {
      const res = await request(app)
        .get('/api/matches?sortBy=compatibility_desc')
        .set('Authorization', `Bearer ${seeker1Token}`);

      expect(res.status).toBe(200);
      if (res.body.data.length > 1) {
        expect(
          res.body.data[0].compatibilityScore
        ).toBeGreaterThanOrEqual(res.body.data[1].compatibilityScore);
      }
    });

    it('should filter candidate listings by city query parameter', async () => {
      const res = await request(app)
        .get('/api/matches?city=Mumbai')
        .set('Authorization', `Bearer ${seeker1Token}`);

      expect(res.status).toBe(200);
      // All created rooms were in Bengaluru, so Mumbai should return 0 evaluated
      expect(res.body.data).toHaveLength(0);
      expect(res.body.meta.totalEvaluated).toBe(0);
    });

    it('should filter by minScore parameter', async () => {
      const res = await request(app)
        .get('/api/matches?minScore=99')
        .set('Authorization', `Bearer ${seeker1Token}`);

      expect(res.status).toBe(200);
      // Only returns rooms with score >= 99
      for (const match of res.body.data) {
        expect(match.compatibilityScore).toBeGreaterThanOrEqual(99);
      }
    });
  });

  // ==========================================
  // 4. EMPTY CANDIDATE POOLS
  // ==========================================
  describe('GET /api/matches — Empty Candidate Pools', () => {
    it('should return empty array with correct zero counts when no active listings exist', async () => {
      await RoomListing.deleteMany({});

      const res = await request(app)
        .get('/api/matches')
        .set('Authorization', `Bearer ${seeker1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual([]);
      expect(res.body.meta.totalEvaluated).toBe(0);
      expect(res.body.meta.eligibleMatches).toBe(0);
      expect(res.body.meta.disqualifiedByHardConstraints).toBe(0);
    });
  });

  // ==========================================
  // 5. COMPATIBILITY PREVIEW ENDPOINT
  // ==========================================
  describe('POST /api/rooms/:id/compatibility-preview', () => {
    it('should reject unauthenticated requests with 401', async () => {
      const res = await request(app).post(
        `/api/rooms/${eligibleRoomId}/compatibility-preview`
      );
      expect(res.status).toBe(401);
    });

    it('should reject invalid ObjectId formats with 400', async () => {
      const res = await request(app)
        .post('/api/rooms/invalid-id-format/compatibility-preview')
        .set('Authorization', `Bearer ${seeker1Token}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_ROOM_ID');
    });

    it('should return 404 for nonexistent room listing ID', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .post(`/api/rooms/${nonExistentId}/compatibility-preview`)
        .set('Authorization', `Bearer ${seeker1Token}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('ROOM_NOT_FOUND');
    });

    it('should return 400 for inactive room listings', async () => {
      const res = await request(app)
        .post(`/api/rooms/${inactiveRoomId}/compatibility-preview`)
        .set('Authorization', `Bearer ${seeker1Token}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('ROOM_INACTIVE');
    });

    it('should return 400 PROFILE_INCOMPLETE if user has not completed onboarding', async () => {
      const res = await request(app)
        .post(`/api/rooms/${eligibleRoomId}/compatibility-preview`)
        .set('Authorization', `Bearer ${seeker2Token}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('PROFILE_INCOMPLETE');
    });

    it('should return comprehensive compatibility preview for an active room', async () => {
      const res = await request(app)
        .post(`/api/rooms/${eligibleRoomId}/compatibility-preview`)
        .set('Authorization', `Bearer ${seeker1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('roomId', eligibleRoomId);
      expect(res.body.data).toHaveProperty('eligible', true);
      expect(res.body.data).toHaveProperty('compatibilityScore');
      expect(res.body.data).toHaveProperty('rankingScore');
      expect(res.body.data).toHaveProperty('strengths');
      expect(res.body.data).toHaveProperty('mismatches');
      expect(res.body.data).toHaveProperty('factorBreakdown');
      expect(res.body.data).toHaveProperty('algorithmMetadata');
    });

    it('should flag hard constraint violations in preview response', async () => {
      const res = await request(app)
        .post(`/api/rooms/${expensiveRoomId}/compatibility-preview`)
        .set('Authorization', `Bearer ${seeker1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.eligible).toBe(false);
      expect(res.body.data.exclusionReasons).toContain(
        'EXCEEDS_BUDGET_CEILING'
      );
    });
  });
});
