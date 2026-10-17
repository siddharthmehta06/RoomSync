import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import User from '../src/models/User.js';
import RoomListing from '../src/models/RoomListing.js';
import { connectDB, disconnectDB } from '../src/config/db.js';

const TEST_DB_URI =
  process.env.MONGODB_ROOMS_TEST_URI ||
  'mongodb://localhost:27017/roomsync_test_rooms';

describe('RoomSync Room Listings API (/api/rooms)', () => {
  let ownerToken;
  let ownerId;
  let seekerToken;
  let seekerId;
  let otherOwnerToken;
  let otherOwnerId;

  beforeAll(async () => {
    await connectDB(TEST_DB_URI);
    await User.syncIndexes();
    await RoomListing.syncIndexes();
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

    // Register Owner 1
    const ownerRes = await request(app).post('/api/auth/register').send({
      fullName: 'Aditya Sharma',
      email: 'aditya.owner@example.com',
      phone: '9876543210',
      password: 'Password123!',
      role: 'owner',
    });
    ownerToken = ownerRes.body.data.token;
    ownerId = ownerRes.body.data.user.id;

    // Register Seeker
    const seekerRes = await request(app).post('/api/auth/register').send({
      fullName: 'Priya Seeker',
      email: 'priya.seeker@example.com',
      phone: '9876543211',
      password: 'Password123!',
      role: 'seeker',
    });
    seekerToken = seekerRes.body.data.token;
    seekerId = seekerRes.body.data.user.id;

    // Register Owner 2
    const otherRes = await request(app).post('/api/auth/register').send({
      fullName: 'Karan Mehra',
      email: 'karan.owner@example.com',
      phone: '9876543212',
      password: 'Password123!',
      role: 'owner',
    });
    otherOwnerToken = otherRes.body.data.token;
    otherOwnerId = otherRes.body.data.user.id;
  });

  const sampleListingPayload = {
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
    availableFrom: '2026-11-01T00:00:00.000Z',
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
  };

  // ==========================================
  // CREATE LISTING TESTS (POST /api/rooms)
  // ==========================================
  describe('POST /api/rooms', () => {
    it('should reject unauthenticated room creation with 401', async () => {
      const res = await request(app)
        .post('/api/rooms')
        .send(sampleListingPayload);

      expect(res.statusCode).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should reject room creation from non-owner (seeker) with 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/rooms')
        .set('Authorization', `Bearer ${seekerToken}`)
        .send(sampleListingPayload);

      expect(res.statusCode).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('should create room listing successfully with server-assigned owner', async () => {
      const res = await request(app)
        .post('/api/rooms')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          ...sampleListingPayload,
          owner: seekerId, // Attacking by attempting to spoof another owner ID
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Listing published successfully.');

      const data = res.body.data;
      expect(data.id).toBeDefined();
      expect(data.title).toBe('Sunlit Master Bedroom in 3BHK Penthouse');
      expect(data.rent).toBe(18500);
      expect(data.status).toBe('active');

      // Crucial: Owner MUST be set to authenticated user, not spoofed body
      expect(data.owner).toBe(ownerId);
    });

    it('should reject room creation with invalid PIN code', async () => {
      const res = await request(app)
        .post('/api/rooms')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          ...sampleListingPayload,
          pinCode: 'ABC', // Invalid
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(
        res.body.error.details.some((d) => d.field === 'pinCode')
      ).toBe(true);
    });

    it('should reject room creation with negative rent', async () => {
      const res = await request(app)
        .post('/api/rooms')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          ...sampleListingPayload,
          rent: -500, // Invalid
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.details.some((d) => d.field === 'rent')).toBe(true);
    });

    it('should reject room creation with invalid roomType', async () => {
      const res = await request(app)
        .post('/api/rooms')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          ...sampleListingPayload,
          roomType: 'Penthouse Suite Luxury', // Not in enum
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  // ==========================================
  // GET ROOMS & SEARCH (GET /api/rooms)
  // ==========================================
  describe('GET /api/rooms', () => {
    beforeEach(async () => {
      // Seed 3 rooms in Bengaluru and 1 in Pune
      await RoomListing.create([
        {
          ...sampleListingPayload,
          owner: ownerId,
          title: 'Koramangala Luxury Room 1',
          locality: 'Koramangala 4th Block',
          city: 'Bengaluru',
          rent: 18000,
          roomType: 'Private Room with Attached Bath',
          furnishing: 'Fully Furnished',
          status: 'active',
        },
        {
          ...sampleListingPayload,
          owner: ownerId,
          title: 'HSR Layout Budget Room 2',
          locality: 'HSR Sector 2',
          city: 'Bengaluru',
          rent: 14000,
          roomType: 'Private Room (Shared Bath)',
          furnishing: 'Semi-Furnished',
          livingConditions: {
            ...sampleListingPayload.livingConditions,
            foodPreference: 'Pure Vegetarian',
          },
          status: 'active',
        },
        {
          ...sampleListingPayload,
          owner: otherOwnerId,
          title: 'Indiranagar Premium Room 3',
          locality: 'Indiranagar 100ft Rd',
          city: 'Bengaluru',
          rent: 24000,
          roomType: 'Private Room with Attached Bath',
          furnishing: 'Fully Furnished',
          status: 'active',
        },
        {
          ...sampleListingPayload,
          owner: otherOwnerId,
          title: 'Pune Viman Nagar Room 4',
          locality: 'Viman Nagar',
          city: 'Pune',
          rent: 12000,
          status: 'active',
        },
        {
          ...sampleListingPayload,
          owner: ownerId,
          title: 'Deactivated Hidden Room',
          locality: 'Koramangala',
          city: 'Bengaluru',
          rent: 15000,
          status: 'deactivated', // Inactive
        },
      ]);
    });

    it('should return all active rooms and exclude deactivated rooms', async () => {
      const res = await request(app).get('/api/rooms');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(4); // 4 active, 1 deactivated excluded
      expect(res.body.meta.total).toBe(4);
    });

    it('should filter by city case-insensitively', async () => {
      const res = await request(app).get('/api/rooms?city=bengaluru');

      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBe(3);
      expect(res.body.data.every((r) => r.city === 'Bengaluru')).toBe(true);
    });

    it('should filter by rent range (minRent and maxRent)', async () => {
      const res = await request(app).get('/api/rooms?minRent=15000&maxRent=20000');

      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].rent).toBe(18000);
    });

    it('should filter by roomType and foodPreference', async () => {
      const res = await request(app).get(
        '/api/rooms?roomType=Private Room (Shared Bath)&foodPreference=Pure Vegetarian'
      );

      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].title).toBe('HSR Layout Budget Room 2');
    });

    it('should support sorting by rent ascending', async () => {
      const res = await request(app).get('/api/rooms?sortBy=rent_asc');

      expect(res.statusCode).toBe(200);
      const rents = res.body.data.map((r) => r.rent);
      expect(rents).toEqual([12000, 14000, 18000, 24000]);
    });

    it('should support pagination (page and limit)', async () => {
      const res = await request(app).get('/api/rooms?page=1&limit=2');

      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBe(2);
      expect(res.body.meta.page).toBe(1);
      expect(res.body.meta.limit).toBe(2);
      expect(res.body.meta.total).toBe(4);
      expect(res.body.meta.totalPages).toBe(2);
    });
  });

  // ==========================================
  // GET ROOM BY ID (GET /api/rooms/:id)
  // ==========================================
  describe('GET /api/rooms/:id', () => {
    let createdRoomId;

    beforeEach(async () => {
      const room = await RoomListing.create({
        ...sampleListingPayload,
        owner: ownerId,
      });
      createdRoomId = room._id.toString();
    });

    it('should retrieve single room listing by ID with populated owner', async () => {
      const res = await request(app).get(`/api/rooms/${createdRoomId}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(createdRoomId);
      expect(res.body.data.owner).toBeDefined();
      expect(res.body.data.owner.fullName).toBe('Aditya Sharma');
      expect(res.body.data.owner.password).toBeUndefined();
    });

    it('should return 404 for invalid ObjectId format', async () => {
      const res = await request(app).get('/api/rooms/invalid-id-format');

      expect(res.statusCode).toBe(404);
      expect(res.body.error.code).toBe('ROOM_NOT_FOUND');
    });

    it('should return 404 for non-existent room ID', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const res = await request(app).get(`/api/rooms/${nonExistentId}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.error.code).toBe('ROOM_NOT_FOUND');
    });

    it('should return 404 if room is deactivated and viewer is not the owner', async () => {
      await RoomListing.findByIdAndUpdate(createdRoomId, {
        status: 'deactivated',
      });

      // Anonymous view
      const resAnon = await request(app).get(`/api/rooms/${createdRoomId}`);
      expect(resAnon.statusCode).toBe(404);

      // Other user view
      const resOther = await request(app)
        .get(`/api/rooms/${createdRoomId}`)
        .set('Authorization', `Bearer ${seekerToken}`);
      expect(resOther.statusCode).toBe(404);

      // Owner view succeeds
      const resOwner = await request(app)
        .get(`/api/rooms/${createdRoomId}`)
        .set('Authorization', `Bearer ${ownerToken}`);
      expect(resOwner.statusCode).toBe(200);
    });
  });

  // ==========================================
  // UPDATE ROOM (PUT /api/rooms/:id)
  // ==========================================
  describe('PUT /api/rooms/:id', () => {
    let createdRoomId;

    beforeEach(async () => {
      const room = await RoomListing.create({
        ...sampleListingPayload,
        owner: ownerId,
      });
      createdRoomId = room._id.toString();
    });

    it('should reject unauthenticated update with 401', async () => {
      const res = await request(app)
        .put(`/api/rooms/${createdRoomId}`)
        .send({ rent: 20000 });

      expect(res.statusCode).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should reject update from a user who does not own the listing with 403', async () => {
      const res = await request(app)
        .put(`/api/rooms/${createdRoomId}`)
        .set('Authorization', `Bearer ${otherOwnerToken}`)
        .send({ rent: 20000 });

      expect(res.statusCode).toBe(403);
      expect(res.body.error.code).toBe('NOT_LISTING_OWNER');
    });

    it('should allow listing owner to update permitted fields successfully', async () => {
      const res = await request(app)
        .put(`/api/rooms/${createdRoomId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          rent: 19500,
          title: 'Updated Sunlit Master Bedroom in Koramangala',
          livingConditions: {
            cleanliness: 5.0,
          },
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.rent).toBe(19500);
      expect(res.body.data.title).toBe(
        'Updated Sunlit Master Bedroom in Koramangala'
      );
      expect(res.body.data.livingConditions.cleanliness).toBe(5.0);

      // Verify owner was NOT changed
      expect(res.body.data.owner.toString()).toBe(ownerId);
    });
  });

  // ==========================================
  // DELETE / DEACTIVATE ROOM (DELETE /api/rooms/:id)
  // ==========================================
  describe('DELETE /api/rooms/:id', () => {
    let createdRoomId;

    beforeEach(async () => {
      const room = await RoomListing.create({
        ...sampleListingPayload,
        owner: ownerId,
      });
      createdRoomId = room._id.toString();
    });

    it('should reject unauthenticated deactivation with 401', async () => {
      const res = await request(app).delete(`/api/rooms/${createdRoomId}`);

      expect(res.statusCode).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should reject deactivation from a non-owner with 403', async () => {
      const res = await request(app)
        .delete(`/api/rooms/${createdRoomId}`)
        .set('Authorization', `Bearer ${otherOwnerToken}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.error.code).toBe('NOT_LISTING_OWNER');
    });

    it('should deactivate listing successfully when requested by owner', async () => {
      const res = await request(app)
        .delete(`/api/rooms/${createdRoomId}`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Listing deactivated successfully.');

      // Verify status is deactivated in DB
      const dbRoom = await RoomListing.findById(createdRoomId);
      expect(dbRoom.status).toBe('deactivated');
    });
  });
});
