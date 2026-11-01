import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import User from '../src/models/User.js';
import RoomListing from '../src/models/RoomListing.js';
import PreferenceProfile from '../src/models/PreferenceProfile.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { 
  CANONICAL_22_FACTORS, 
  getDefaultFlexible22Factors, 
  validate22Factors 
} from '../src/utils/factorValidation.js';

const TEST_DB_URI =
  process.env.MONGODB_QUESTIONNAIRE_TEST_URI ||
  'mongodb://localhost:27017/roomsync_test_questionnaire';

describe('PHASE 2 – 22-Factor Questionnaire Engine Tests', () => {
  let seekerToken;
  let seekerId;
  let ownerToken;
  let ownerId;

  beforeAll(async () => {
    await connectDB(TEST_DB_URI);
    await User.syncIndexes();
    await RoomListing.syncIndexes();
    await PreferenceProfile.syncIndexes();
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await User.deleteMany({});
      await RoomListing.deleteMany({});
      await PreferenceProfile.deleteMany({});
      await disconnectDB();
    }
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await RoomListing.deleteMany({});
    await PreferenceProfile.deleteMany({});

    // Register Seeker
    const seekerRes = await request(app).post('/api/auth/register').send({
      fullName: 'Ananya Seeker',
      email: 'ananya.seeker@example.com',
      phone: '9876543001',
      password: 'Password123!',
      role: 'seeker',
    });
    seekerToken = seekerRes.body.data.token;
    seekerId = seekerRes.body.data.user.id;

    // Register Verified Owner
    const ownerRes = await request(app).post('/api/auth/register').send({
      fullName: 'Vikram Landlord',
      email: 'vikram.landlord@example.com',
      phone: '9876543002',
      password: 'Password123!',
      role: 'owner',
    });
    ownerToken = ownerRes.body.data.token;
    ownerId = ownerRes.body.data.user.id;
    await User.findByIdAndUpdate(ownerId, { ownerVerificationStatus: 'Verified', isVerified: true });
  });

  describe('1. Canonical 22 Factors Specification & Defaults', () => {
    test('All 22 factor identifiers exist in canonical definitions', () => {
      expect(CANONICAL_22_FACTORS).toHaveLength(22);

      const expectedKeys = [
        'location',
        'budget',
        'foodPreference',
        'smoking',
        'alcohol',
        'sleepSchedule',
        'wakeSchedule',
        'cleanliness',
        'noiseTolerance',
        'guestsDay',
        'guestsOvernight',
        'socialPreference',
        'workSchedule',
        'wfhFrequency',
        'studyHabits',
        'cookingFrequency',
        'pets',
        'foodSharing',
        'moveInDate',
        'stayDuration',
        'personalSpace',
        'rulesStrictness',
      ];

      const actualKeys = CANONICAL_22_FACTORS.map((f) => f.key);
      expectedKeys.forEach((key) => {
        expect(actualKeys).toContain(key);
      });
    });

    test('Flexible is the universal default for all 22 factors', () => {
      const defaults = getDefaultFlexible22Factors();
      expect(Object.keys(defaults)).toHaveLength(22);

      Object.entries(defaults).forEach(([key, val]) => {
        expect(val).toBe('Flexible');
      });

      const validation = validate22Factors(defaults);
      expect(validation.isComplete).toBe(true);
      expect(validation.completedCount).toBe(22);
      expect(validation.flexibleFactors).toHaveLength(22);
      expect(validation.missingFactors).toHaveLength(0);
    });

    test('Incomplete/Unanswered is strictly distinguished from Flexible', () => {
      // Empty input has 0 answered factors
      const emptyValidation = validate22Factors({});
      expect(emptyValidation.isComplete).toBe(false);
      expect(emptyValidation.completedCount).toBe(0);
      expect(emptyValidation.missingFactors).toHaveLength(22);

      // Partial input with only 2 factors answered
      const partial = {
        budget: 25000,
        smoking: 'Strictly Non-Smoking',
      };
      const partialValidation = validate22Factors(partial);
      expect(partialValidation.isComplete).toBe(false);
      expect(partialValidation.completedCount).toBe(2);
      expect(partialValidation.missingFactors).toHaveLength(20);
      expect(partialValidation.specificFactors).toContain('budget');
      expect(partialValidation.specificFactors).toContain('smoking');
      // Unanswered fields are NOT silently converted into Flexible
      expect(partialValidation.flexibleFactors).toHaveLength(0);
    });
  });

  describe('2. Seeker Questionnaire (Save, Edit, Resume & Progress)', () => {
    test('Seeker can save partial questionnaire responses and resume later', async () => {
      // Step 1: Save draft with 5 factors answered
      const draftFactors = {
        location: 'Within 15 mins of Metro',
        budget: 22000,
        foodPreference: 'Pure Vegetarian',
        smoking: 'Strictly Non-Smoking',
        alcohol: 'Teetotaler',
      };

      const putRes1 = await request(app)
        .put('/api/preferences')
        .set('Authorization', `Bearer ${seekerToken}`)
        .send({ factors: draftFactors });

      expect(putRes1.status).toBe(200);
      expect(putRes1.body.success).toBe(true);
      expect(putRes1.body.completion.isComplete).toBe(false);
      expect(putRes1.body.completion.completedCount).toBe(5);
      expect(putRes1.body.completion.missingFactors).toHaveLength(17);

      // User onboarding flag is still false because questionnaire is incomplete
      const seekerDoc1 = await User.findById(seekerId);
      expect(seekerDoc1.hasCompletedOnboarding).toBe(false);

      // Step 2: Resume questionnaire (GET returns saved responses)
      const getRes = await request(app)
        .get('/api/preferences')
        .set('Authorization', `Bearer ${seekerToken}`);

      expect(getRes.status).toBe(200);
      expect(getRes.body.completion.completedCount).toBe(5);
      expect(getRes.body.data.factors.budget).toBe(22000);
      expect(getRes.body.data.factors.foodPreference).toBe('Pure Vegetarian');

      // Step 3: Complete remaining 17 factors with Flexible and specific choices
      const remainingFactors = getDefaultFlexible22Factors();
      remainingFactors.budget = 22000;
      remainingFactors.foodPreference = 'Pure Vegetarian';
      remainingFactors.smoking = 'Strictly Non-Smoking';
      remainingFactors.alcohol = 'Teetotaler';
      remainingFactors.location = 'Within 15 mins of Metro';
      remainingFactors.cleanliness = 5;

      const putRes2 = await request(app)
        .put('/api/preferences')
        .set('Authorization', `Bearer ${seekerToken}`)
        .send({ factors: remainingFactors });

      expect(putRes2.status).toBe(200);
      expect(putRes2.body.completion.isComplete).toBe(true);
      expect(putRes2.body.completion.completedCount).toBe(22);
      expect(putRes2.body.completion.missingFactors).toHaveLength(0);

      // Now onboarding is marked complete
      const seekerDoc2 = await User.findById(seekerId);
      expect(seekerDoc2.hasCompletedOnboarding).toBe(true);
    });

    test('Seeker can edit previously saved questionnaire answers', async () => {
      const allFlex = getDefaultFlexible22Factors();
      await request(app)
        .put('/api/preferences')
        .set('Authorization', `Bearer ${seekerToken}`)
        .send({ factors: allFlex });

      // Edit cleanliness from Flexible to 5 and foodPreference to Non-Veg Welcome
      const editRes = await request(app)
        .put('/api/preferences')
        .set('Authorization', `Bearer ${seekerToken}`)
        .send({
          factors: {
            cleanliness: 5,
            foodPreference: 'Non-Veg Welcome',
          },
        });

      expect(editRes.status).toBe(200);
      const getRes = await request(app)
        .get('/api/preferences')
        .set('Authorization', `Bearer ${seekerToken}`);

      expect(getRes.body.data.factors.cleanliness).toBe(5);
      expect(getRes.body.data.factors.foodPreference).toBe('Non-Veg Welcome');
      // Other 20 factors remain intact
      expect(getRes.body.data.factors.smoking).toBe('Flexible');
      expect(getRes.body.completion.completedCount).toBe(22);
    });
  });

  describe('3. Owner Questionnaire (Separate per Room Listing & Validation)', () => {
    test('Listing publishing validates questionnaire completion (blocks incomplete questionnaire)', async () => {
      // Incomplete questionnaire with only 3 factors
      const incompleteQuestionnaire = {
        budget: 20000,
        cleanliness: 4,
        foodPreference: 'Flexible',
      };

      const res = await request(app)
        .post('/api/rooms')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          title: 'Premium Master Bedroom in Andheri West Flat',
          locality: 'Lokhandwala',
          city: 'Mumbai',
          pinCode: '400053',
          rent: 20000,
          deposit: 50000,
          roomType: 'Private Room with Attached Bath',
          furnishing: 'Fully Furnished',
          availableFrom: new Date().toISOString(),
          minStayMonths: 6,
          questionnaire: incompleteQuestionnaire,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('QUESTIONNAIRE_INCOMPLETE');
      expect(res.body.error.completedCount).toBe(3);
      expect(res.body.error.missingFactors).toHaveLength(19);
    });

    test('Owner responses persist separately for every listing', async () => {
      // Room 1: Strict non-smoking vegetarian apartment
      const room1Q = getDefaultFlexible22Factors();
      room1Q.foodPreference = 'Pure Vegetarian';
      room1Q.smoking = 'Strictly Non-Smoking';
      room1Q.alcohol = 'Teetotaler';
      room1Q.pets = 'Strictly No Pets';
      room1Q.cleanliness = 5;

      const room1Res = await request(app)
        .post('/api/rooms')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          title: 'Room 1 - Vegetarian Pure Sanctuary in Lokhandwala',
          locality: 'Lokhandwala',
          city: 'Mumbai',
          pinCode: '400053',
          rent: 24000,
          deposit: 60000,
          roomType: 'Private Room with Attached Bath',
          furnishing: 'Fully Furnished',
          availableFrom: new Date().toISOString(),
          minStayMonths: 6,
          questionnaire: room1Q,
        });

      expect(room1Res.status).toBe(201);
      const room1Id = room1Res.body.data.id || room1Res.body.data._id;

      // Room 2: Social, pet-friendly flat
      const room2Q = getDefaultFlexible22Factors();
      room2Q.foodPreference = 'Non-Veg Welcome';
      room2Q.smoking = 'Balcony Only';
      room2Q.alcohol = 'Moderate / Social Drinking';
      room2Q.pets = 'Pet-Friendly Flat';
      room2Q.cleanliness = 3;

      const room2Res = await request(app)
        .post('/api/rooms')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          title: 'Room 2 - Pet-Friendly Studio in Versova',
          locality: 'Versova',
          city: 'Mumbai',
          pinCode: '400061',
          rent: 19000,
          deposit: 45000,
          roomType: 'Private Room with Attached Bath',
          furnishing: 'Fully Furnished',
          availableFrom: new Date().toISOString(),
          minStayMonths: 6,
          questionnaire: room2Q,
        });

      expect(room2Res.status).toBe(201);
      const room2Id = room2Res.body.data.id || room2Res.body.data._id;

      // Verify Room 1 has its own separate questionnaire
      const fetchRoom1Q = await request(app).get(`/api/rooms/${room1Id}/questionnaire`);
      expect(fetchRoom1Q.status).toBe(200);
      expect(fetchRoom1Q.body.data.foodPreference).toBe('Pure Vegetarian');
      expect(fetchRoom1Q.body.data.smoking).toBe('Strictly Non-Smoking');
      expect(fetchRoom1Q.body.data.pets).toBe('Strictly No Pets');
      expect(fetchRoom1Q.body.data.cleanliness).toBe(5);

      // Verify Room 2 has its own separate questionnaire
      const fetchRoom2Q = await request(app).get(`/api/rooms/${room2Id}/questionnaire`);
      expect(fetchRoom2Q.status).toBe(200);
      expect(fetchRoom2Q.body.data.foodPreference).toBe('Non-Veg Welcome');
      expect(fetchRoom2Q.body.data.smoking).toBe('Balcony Only');
      expect(fetchRoom2Q.body.data.pets).toBe('Pet-Friendly Flat');
      expect(fetchRoom2Q.body.data.cleanliness).toBe(3);

      // Verify Room 1 and Room 2 are independent documents in MongoDB
      expect(fetchRoom1Q.body.data.pets).not.toBe(fetchRoom2Q.body.data.pets);
    });

    test('Owner can edit questionnaire for a specific listing', async () => {
      const q = getDefaultFlexible22Factors();
      q.smoking = 'Strictly Non-Smoking';

      const createRes = await request(app)
        .post('/api/rooms')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          title: 'Modern Room in Andheri East Tech Hub',
          locality: 'Chakala',
          city: 'Mumbai',
          pinCode: '400099',
          rent: 21000,
          deposit: 50000,
          roomType: 'Private Room with Attached Bath',
          furnishing: 'Fully Furnished',
          availableFrom: new Date().toISOString(),
          minStayMonths: 6,
          questionnaire: q,
        });

      const roomId = createRes.body.data.id || createRes.body.data._id;

      // Edit questionnaire: change smoking to Balcony Only and update quiet hours
      const updateRes = await request(app)
        .put(`/api/rooms/${roomId}/questionnaire`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          questionnaire: {
            smoking: 'Balcony Only',
            studyHabits: 'Quiet Focused Study Hours Required',
          },
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.success).toBe(true);

      const checkRes = await request(app).get(`/api/rooms/${roomId}/questionnaire`);
      expect(checkRes.body.data.smoking).toBe('Balcony Only');
      expect(checkRes.body.data.studyHabits).toBe('Quiet Focused Study Hours Required');
    });
  });
});

