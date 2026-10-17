import mongoose from 'mongoose';
import User from '../src/models/User.js';
import PreferenceProfile from '../src/models/PreferenceProfile.js';
import RoomListing from '../src/models/RoomListing.js';
import { connectDB, disconnectDB } from '../src/config/db.js';

const TEST_DB_URI =
  process.env.MONGODB_MODELS_TEST_URI ||
  'mongodb://localhost:27017/roomsync_test_models';

describe('RoomSync Core Mongoose Models Validation', () => {
  beforeAll(async () => {
    await connectDB(TEST_DB_URI);
    await User.syncIndexes();
    await PreferenceProfile.syncIndexes();
    await RoomListing.syncIndexes();
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await User.deleteMany({});
      await PreferenceProfile.deleteMany({});
      await RoomListing.deleteMany({});
      await disconnectDB();
    }
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await PreferenceProfile.deleteMany({});
    await RoomListing.deleteMany({});
  });

  // ==========================================
  // USER MODEL TESTS
  // ==========================================
  describe('User Model', () => {
    it('should hash the password before saving and not re-hash if unmodified', async () => {
      const user = new User({
        fullName: 'Test User',
        email: 'test@example.com',
        phone: '9876543210',
        password: 'PlainTextPassword123',
      });

      await user.save();
      expect(user.password).not.toBe('PlainTextPassword123');
      expect(user.password.startsWith('$2')).toBe(true);

      const isMatch = await user.matchPassword('PlainTextPassword123');
      expect(isMatch).toBe(true);

      const isNotMatch = await user.matchPassword('WrongPassword');
      expect(isNotMatch).toBe(false);

      // Save again with only name modification
      user.fullName = 'Updated Name';
      await user.save();
      const isMatchAfterUpdate = await user.matchPassword(
        'PlainTextPassword123'
      );
      expect(isMatchAfterUpdate).toBe(true);
    });

    it('should enforce unique normalized email', async () => {
      await User.create({
        fullName: 'First User',
        email: 'unique@example.com',
        phone: '9876543210',
        password: 'Password123',
      });

      const duplicate = new User({
        fullName: 'Second User',
        email: 'UNIQUE@example.com',
        phone: '9876543211',
        password: 'Password123',
      });

      await expect(duplicate.save()).rejects.toThrow();
    });
  });

  // ==========================================
  // PREFERENCE PROFILE MODEL TESTS (22 FACTORS)
  // ==========================================
  describe('PreferenceProfile Model', () => {
    it('should create valid preference profile with the canonical 22 factors and weights', async () => {
      const user = await User.create({
        fullName: 'Seeker One',
        email: 'seeker1@example.com',
        phone: '9876543210',
        password: 'Password123',
      });

      const profile = await PreferenceProfile.create({
        user: user._id,
        hardConstraints: {
          budgetCeiling: 22000,
          maxDeposit: 60000,
          dietaryRule: 'Pure-Veg',
          smokingPolicy: 'Strictly Non-Smoking',
          alcoholPolicy: 'Teetotaler',
          petPolicy: 'Strictly No Pets',
          maxCommuteMins: 45,
        },
        flexiblePreferences: {
          sleepSchedule: 23.5, // 11:30 PM
          wakeSchedule: 7.5,   // 7:30 AM
          cleanliness: 4,
          noiseTolerance: 3,
          guestPolicy: 'Occasional',
          overnightGuests: 'With Notice',
          socialPreference: 'Balanced',
          wfhDays: 2,
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
      });

      expect(profile._id).toBeDefined();
      expect(profile.hardConstraints.budgetCeiling).toBe(22000);
      expect(profile.flexiblePreferences.cleanliness).toBe(4);
      expect(profile.importanceWeights.budget).toBe(5);
    });

    it('should reject budget ceiling below minimum threshold', async () => {
      const user = await User.create({
        fullName: 'Seeker Low Budget',
        email: 'lowbudget@example.com',
        phone: '9876543210',
        password: 'Password123',
      });

      const profile = new PreferenceProfile({
        user: user._id,
        hardConstraints: {
          budgetCeiling: 500, // Below min 1000
        },
      });

      await expect(profile.save()).rejects.toThrow();
    });

    it('should reject importance weights outside 1 to 5 bounds', async () => {
      const user = await User.create({
        fullName: 'Seeker Invalid Weight',
        email: 'weight@example.com',
        phone: '9876543210',
        password: 'Password123',
      });

      const profile = new PreferenceProfile({
        user: user._id,
        hardConstraints: {
          budgetCeiling: 15000,
        },
        importanceWeights: {
          budget: 10, // Invalid: exceeds 5
        },
      });

      await expect(profile.save()).rejects.toThrow();
    });

    it('should reject sleep schedule outside 0.0 to 23.5 bounds', async () => {
      const user = await User.create({
        fullName: 'Seeker Invalid Sleep',
        email: 'sleep@example.com',
        phone: '9876543210',
        password: 'Password123',
      });

      const profile = new PreferenceProfile({
        user: user._id,
        hardConstraints: {
          budgetCeiling: 15000,
        },
        flexiblePreferences: {
          sleepSchedule: 25.0, // Invalid: exceeds 23.5
        },
      });

      await expect(profile.save()).rejects.toThrow();
    });
  });

  // ==========================================
  // ROOM LISTING MODEL TESTS
  // ==========================================
  describe('RoomListing Model', () => {
    it('should create valid listing preserving living conditions separate from preferences', async () => {
      const owner = await User.create({
        fullName: 'Owner One',
        email: 'owner1@example.com',
        phone: '9876543210',
        password: 'Password123',
        role: 'owner',
      });

      const listing = await RoomListing.create({
        owner: owner._id,
        title: 'Sunlit Master Bedroom in 3BHK Penthouse',
        locality: 'Koramangala 4th Block',
        city: 'Bengaluru',
        state: 'Karnataka',
        pinCode: '560034',
        rent: 18500,
        maintenance: 1500,
        deposit: 50000,
        roomType: 'Private Room with Attached Bath',
        furnishing: 'Fully Furnished',
        availableFrom: new Date('2026-11-01'),
        minStayMonths: 6,
        images: ['https://images.unsplash.com/photo-1598928506311'],
        amenities: ['High-speed WiFi', 'Power Backup', 'AC in Room'],
        livingConditions: {
          foodPreference: 'Eggetarian / Flexible Non-veg',
          smoking: 'Strictly Non-Smoking',
          alcohol: 'Social Drinking OK',
          sleepSchedule: 23.5,
          wakeSchedule: 7.5,
          cleanliness: 4.8,
          noiseTolerance: 3.5,
          guestsDay: 'Occasional friends',
          guestsOvernight: 'Allowed with notice',
          socialPreference: 'Balanced',
          wfhFrequency: 2,
        },
        status: 'active',
      });

      expect(listing._id).toBeDefined();
      expect(listing.title).toBe('Sunlit Master Bedroom in 3BHK Penthouse');
      expect(listing.livingConditions.cleanliness).toBe(4.8);
      expect(listing.status).toBe('active');
    });

    it('should reject invalid PIN code format', async () => {
      const owner = await User.create({
        fullName: 'Owner Pin',
        email: 'ownerpin@example.com',
        phone: '9876543210',
        password: 'Password123',
        role: 'owner',
      });

      const listing = new RoomListing({
        owner: owner._id,
        title: 'Sunlit Master Bedroom in 3BHK Penthouse',
        locality: 'Koramangala 4th Block',
        pinCode: 'ABC12', // Invalid PIN code
        rent: 18500,
        deposit: 50000,
        roomType: 'Private Room with Attached Bath',
        furnishing: 'Fully Furnished',
        availableFrom: new Date('2026-11-01'),
      });

      await expect(listing.save()).rejects.toThrow();
    });

    it('should reject invalid status value', async () => {
      const owner = await User.create({
        fullName: 'Owner Status',
        email: 'ownerstatus@example.com',
        phone: '9876543210',
        password: 'Password123',
        role: 'owner',
      });

      const listing = new RoomListing({
        owner: owner._id,
        title: 'Sunlit Master Bedroom in 3BHK Penthouse',
        locality: 'Koramangala 4th Block',
        pinCode: '560034',
        rent: 18500,
        deposit: 50000,
        roomType: 'Private Room with Attached Bath',
        furnishing: 'Fully Furnished',
        availableFrom: new Date('2026-11-01'),
        status: 'invalid_status_enum',
      });

      await expect(listing.save()).rejects.toThrow();
    });
  });
});
