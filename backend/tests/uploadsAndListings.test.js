import request from 'supertest';
import mongoose from 'mongoose';
import { jest } from '@jest/globals';
import app from '../src/app.js';
import User from '../src/models/User.js';
import RoomListing from '../src/models/RoomListing.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { cloudinaryService } from '../src/config/cloudinary.js';

const TEST_DB_URI =
  process.env.MONGODB_UPLOADS_TEST_URI ||
  'mongodb://localhost:27017/roomsync_test_uploads';

describe('RoomSync Image Uploads & Listing Creation API', () => {
  let ownerToken;
  let ownerId;
  let seekerToken;
  let otherOwnerToken;
  let validJpegBuffer;

  beforeAll(async () => {
    await connectDB(TEST_DB_URI);
    await User.syncIndexes();
    await RoomListing.syncIndexes();

    // Create a valid dummy JPEG buffer: FF D8 FF E0 + padding
    validJpegBuffer = Buffer.from([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
      0x01, 0x01, 0x00, 0x60, 0x00, 0x60, 0x00, 0x00,
    ]);
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await User.deleteMany({});
      await RoomListing.deleteMany({});
      await disconnectDB();
    }
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await RoomListing.deleteMany({});

    // Register primary owner
    const ownerRes = await request(app).post('/api/auth/register').send({
      fullName: 'Host Aditya',
      email: 'host.aditya@example.com',
      phone: '9876543201',
      password: 'Password123!',
      role: 'owner',
    });
    ownerToken = ownerRes.body.data.token;
    ownerId = ownerRes.body.data.user.id;

    // Register seeker
    const seekerRes = await request(app).post('/api/auth/register').send({
      fullName: 'Seeker Sneha',
      email: 'seeker.sneha@example.com',
      phone: '9876543202',
      password: 'Password123!',
      role: 'seeker',
    });
    seekerToken = seekerRes.body.data.token;

    // Register secondary owner
    const otherOwnerRes = await request(app).post('/api/auth/register').send({
      fullName: 'Other Owner',
      email: 'other.owner@example.com',
      phone: '9876543203',
      password: 'Password123!',
      role: 'owner',
    });
    otherOwnerToken = otherOwnerRes.body.data.token;
  });

  describe('POST /api/rooms/upload-images', () => {
    it('should reject unauthenticated upload requests with 401', async () => {
      const res = await request(app)
        .post('/api/rooms/upload-images')
        .attach('images', validJpegBuffer, 'room1.jpg');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should reject uploads from non-owner users (seeker) with 403', async () => {
      const res = await request(app)
        .post('/api/rooms/upload-images')
        .set('Authorization', `Bearer ${seekerToken}`)
        .attach('images', validJpegBuffer, 'room1.jpg');

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('should reject invalid file types with 400', async () => {
      const textBuffer = Buffer.from('This is a plain text file, not an image');
      const res = await request(app)
        .post('/api/rooms/upload-images')
        .set('Authorization', `Bearer ${ownerToken}`)
        .attach('images', textBuffer, 'notes.txt');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject files with corrupted or invalid magic bytes with 400', async () => {
      // Fake extension .jpg but with dummy ASCII text
      const fakeJpeg = Buffer.from('Not a real image header at all!');
      const res = await request(app)
        .post('/api/rooms/upload-images')
        .set('Authorization', `Bearer ${ownerToken}`)
        .attach('images', fakeJpeg, 'fake.jpg');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_IMAGE_CONTENT');
    });

    it('should reject empty upload requests with 400', async () => {
      const res = await request(app)
        .post('/api/rooms/upload-images')
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NO_FILES_PROVIDED');
    });

    it('should return 503 with CLOUDINARY_NOT_CONFIGURED when Cloudinary is not configured', async () => {
      const isConfiguredSpy = jest
        .spyOn(cloudinaryService, 'isConfigured')
        .mockReturnValue(false);

      const res = await request(app)
        .post('/api/rooms/upload-images')
        .set('Authorization', `Bearer ${ownerToken}`)
        .attach('images', validJpegBuffer, 'room1.jpg');

      expect(res.status).toBe(503);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('CLOUDINARY_NOT_CONFIGURED');

      isConfiguredSpy.mockRestore();
    });

    it('should successfully upload valid images and return secure HTTPS URLs', async () => {
      const isConfiguredSpy = jest
        .spyOn(cloudinaryService, 'isConfigured')
        .mockReturnValue(true);

      const uploadSpy = jest
        .spyOn(cloudinaryService, 'uploadToCloudinary')
        .mockResolvedValue({
          secure_url:
            'https://res.cloudinary.com/demo/image/upload/v12345/roomsync/listings/room1.jpg',
        });

      const res = await request(app)
        .post('/api/rooms/upload-images')
        .set('Authorization', `Bearer ${ownerToken}`)
        .attach('images', validJpegBuffer, 'room1.jpg');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.urls).toHaveLength(1);
      expect(res.body.data.urls[0]).toContain('https://res.cloudinary.com/');

      isConfiguredSpy.mockRestore();
      uploadSpy.mockRestore();
    });

    it('should handle upload-provider failures gracefully with 500 and UPLOAD_FAILED', async () => {
      const isConfiguredSpy = jest
        .spyOn(cloudinaryService, 'isConfigured')
        .mockReturnValue(true);

      const uploadSpy = jest
        .spyOn(cloudinaryService, 'uploadToCloudinary')
        .mockRejectedValue(new Error('Cloudinary connection timeout'));

      const res = await request(app)
        .post('/api/rooms/upload-images')
        .set('Authorization', `Bearer ${ownerToken}`)
        .attach('images', validJpegBuffer, 'room1.jpg');

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UPLOAD_FAILED');

      isConfiguredSpy.mockRestore();
      uploadSpy.mockRestore();
    });
  });

  describe('Listing Creation and Schema Integrity', () => {
    it('should successfully create a listing with canonical livingConditions schema', async () => {
      const listingData = {
        title: 'Sunlit Master Bedroom in Indiranagar 100ft Rd',
        locality: 'Indiranagar 12th Main',
        city: 'Bengaluru',
        pinCode: '560038',
        rent: 22000,
        maintenance: 2000,
        deposit: 60000,
        roomType: 'Private Room with Attached Bath',
        furnishing: 'Fully Furnished',
        availableFrom: '2026-12-01',
        minStayMonths: 6,
        images: [
          'https://res.cloudinary.com/demo/image/upload/v1/roomsync/listings/photo1.jpg',
        ],
        amenities: ['High-speed WiFi', 'AC', 'Power Backup'],
        livingConditions: {
          foodPreference: 'Eggetarian / Flexible Non-veg',
          smoking: 'Balcony Only',
          alcohol: 'Social Drinking OK',
          sleepSchedule: 23.5,
          wakeSchedule: 7.5,
          cleanliness: 4.5,
          noiseTolerance: 3.0,
          guestsDay: 'Occasional friends allowed',
          guestsOvernight: 'Notice required',
          workSchedule: 'Standard Day (9 AM - 6 PM)',
          wfhFrequency: 3,
        },
      };

      const res = await request(app)
        .post('/api/rooms')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(listingData);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.owner.toString()).toBe(ownerId);
      expect(res.body.data.livingConditions.foodPreference).toBe(
        'Eggetarian / Flexible Non-veg'
      );
      expect(res.body.data.livingConditions.sleepSchedule).toBe(23.5);
      expect(res.body.data.images).toEqual(listingData.images);
    });

    it('should reject listing creation with invalid roomType enum', async () => {
      const res = await request(app)
        .post('/api/rooms')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          title: 'Master Bedroom with Balcony Suite',
          locality: 'Indiranagar',
          pinCode: '560038',
          rent: 20000,
          deposit: 50000,
          roomType: 'Master Bedroom with Balcony', // Invalid enum
          furnishing: 'Fully Furnished',
          availableFrom: '2026-11-01',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject unauthorized owner from editing another owner listing', async () => {
      // Create listing as primary owner
      const createRes = await request(app)
        .post('/api/rooms')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          title: 'Cozy Room in Koramangala 5th Block',
          locality: 'Koramangala',
          pinCode: '560034',
          rent: 18000,
          deposit: 40000,
          roomType: 'Private Room (Shared Bath)',
          furnishing: 'Semi-Furnished',
          availableFrom: '2026-11-01',
        });
      const roomId = createRes.body.data.id;

      // Attempt to update listing with secondary owner's token
      const updateRes = await request(app)
        .put(`/api/rooms/${roomId}`)
        .set('Authorization', `Bearer ${otherOwnerToken}`)
        .send({
          rent: 19000,
        });

      expect(updateRes.status).toBe(403);
      expect(updateRes.body.success).toBe(false);
      expect(updateRes.body.error.code).toBe('NOT_LISTING_OWNER');
    });

    it('should allow owner to fetch only their listings via /api/rooms/owner/my-listings', async () => {
      // Primary owner creates a listing
      await request(app)
        .post('/api/rooms')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          title: 'Owner 1 Room in HSR Sector 3',
          locality: 'HSR Layout',
          pinCode: '560102',
          rent: 15000,
          deposit: 30000,
          roomType: 'Shared Room',
          furnishing: 'Unfurnished',
          availableFrom: '2026-11-01',
        });

      // Secondary owner creates a listing
      await request(app)
        .post('/api/rooms')
        .set('Authorization', `Bearer ${otherOwnerToken}`)
        .send({
          title: 'Owner 2 Room in Whitefield',
          locality: 'Whitefield',
          pinCode: '560066',
          rent: 25000,
          deposit: 60000,
          roomType: 'Private Room with Attached Bath',
          furnishing: 'Fully Furnished',
          availableFrom: '2026-11-01',
        });

      const res = await request(app)
        .get('/api/rooms/owner/my-listings')
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].title).toBe('Owner 1 Room in HSR Sector 3');
    });
  });
});
