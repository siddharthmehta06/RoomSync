import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import User from '../src/models/User.js';
import RoomListing from '../src/models/RoomListing.js';
import Interaction from '../src/models/Interaction.js';
import { connectDB, disconnectDB } from '../src/config/db.js';

const TEST_DB_URI =
  process.env.MONGODB_SAVED_TEST_URI ||
  'mongodb://localhost:27017/roomsync_test_saved';

describe('RoomSync Saved Rooms (Bookmarks) API (/api/saved-rooms)', () => {
  let user1Token;
  let user1Id;
  let user2Token;
  let user2Id;
  let ownerToken;
  let ownerId;
  let activeRoomId;
  let secondRoomId;
  let deactivatedRoomId;

  beforeAll(async () => {
    await connectDB(TEST_DB_URI);
    await User.syncIndexes();
    await RoomListing.syncIndexes();
    await Interaction.syncIndexes();
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await User.deleteMany({});
      await RoomListing.deleteMany({});
      await Interaction.deleteMany({});
      await disconnectDB();
    }
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await RoomListing.deleteMany({});
    await Interaction.deleteMany({});

    // Register User 1 (Seeker)
    const user1Res = await request(app).post('/api/auth/register').send({
      fullName: 'Aanya Sen',
      email: 'aanya.sen@example.com',
      phone: '9876543210',
      password: 'Password123!',
      role: 'seeker',
    });
    user1Token = user1Res.body.data.token;
    user1Id = user1Res.body.data.user.id;

    // Register User 2 (Seeker)
    const user2Res = await request(app).post('/api/auth/register').send({
      fullName: 'Rohan Mehra',
      email: 'rohan.mehra@example.com',
      phone: '9876543211',
      password: 'Password123!',
      role: 'seeker',
    });
    user2Token = user2Res.body.data.token;
    user2Id = user2Res.body.data.user.id;

    // Register Owner
    const ownerRes = await request(app).post('/api/auth/register').send({
      fullName: 'Deepak Verma',
      email: 'deepak.verma@example.com',
      phone: '9876543212',
      password: 'Password123!',
      role: 'owner',
    });
    ownerToken = ownerRes.body.data.token;
    ownerId = ownerRes.body.data.user.id;

    // Create 2 active rooms and 1 deactivated room
    const room1 = await RoomListing.create({
      owner: ownerId,
      title: 'Spacious 1BHK in Indiranagar',
      locality: 'Indiranagar 100ft Road',
      city: 'Bengaluru',
      state: 'Karnataka',
      pinCode: '560038',
      rent: 22000,
      deposit: 60000,
      roomType: 'Private Room with Attached Bath',
      furnishing: 'Fully Furnished',
      availableFrom: new Date('2026-11-15'),
      images: ['https://images.unsplash.com/photo-1'],
      status: 'active',
      livingConditions: {
        foodPreference: 'Pure Vegetarian',
        smoking: 'Strictly Non-Smoking',
      },
    });
    activeRoomId = room1._id.toString();

    const room2 = await RoomListing.create({
      owner: ownerId,
      title: 'Cozy Room in Koramangala 5th Block',
      locality: 'Koramangala 5th Block',
      city: 'Bengaluru',
      state: 'Karnataka',
      pinCode: '560095',
      rent: 16500,
      deposit: 45000,
      roomType: 'Private Room (Shared Bath)',
      furnishing: 'Semi-Furnished',
      availableFrom: new Date('2026-12-01'),
      images: ['https://images.unsplash.com/photo-2'],
      status: 'active',
      livingConditions: {
        foodPreference: 'Non-Veg Welcome',
        smoking: 'Balcony Only',
      },
    });
    secondRoomId = room2._id.toString();

    const room3 = await RoomListing.create({
      owner: ownerId,
      title: 'Deactivated Penthouse Room',
      locality: 'MG Road',
      city: 'Bengaluru',
      state: 'Karnataka',
      pinCode: '560001',
      rent: 30000,
      deposit: 90000,
      roomType: 'Private Room with Attached Bath',
      furnishing: 'Fully Furnished',
      availableFrom: new Date('2026-11-01'),
      status: 'deactivated',
      livingConditions: {
        foodPreference: 'Pure Vegetarian',
        smoking: 'Strictly Non-Smoking',
      },
    });
    deactivatedRoomId = room3._id.toString();
  });

  // ==========================================
  // AUTHENTICATION GUARDS
  // ==========================================
  describe('Authentication requirements', () => {
    it('should reject GET /api/saved-rooms without authentication', async () => {
      const res = await request(app).get('/api/saved-rooms');
      expect(res.statusCode).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should reject POST /api/saved-rooms/:roomId without authentication', async () => {
      const res = await request(app).post(`/api/saved-rooms/${activeRoomId}`);
      expect(res.statusCode).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should reject DELETE /api/saved-rooms/:roomId without authentication', async () => {
      const res = await request(app).delete(`/api/saved-rooms/${activeRoomId}`);
      expect(res.statusCode).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  // ==========================================
  // SAVE ROOM (POST /api/saved-rooms/:roomId)
  // ==========================================
  describe('POST /api/saved-rooms/:roomId', () => {
    it('should successfully save an active room and record save interaction', async () => {
      const res = await request(app)
        .post(`/api/saved-rooms/${activeRoomId}`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Room saved to bookmarks.');

      // Verify interaction was recorded in DB
      const interaction = await Interaction.findOne({
        user: user1Id,
        room: activeRoomId,
        action: 'save',
      });
      expect(interaction).toBeDefined();
    });

    it('should handle duplicate save idempotently without failing', async () => {
      // First save
      await request(app)
        .post(`/api/saved-rooms/${activeRoomId}`)
        .set('Authorization', `Bearer ${user1Token}`);

      // Second save on same room
      const res = await request(app)
        .post(`/api/saved-rooms/${activeRoomId}`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Room is already saved in bookmarks.');
    });

    it('should return 404 when saving a non-existent room ID', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .post(`/api/saved-rooms/${nonExistentId}`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.error.code).toBe('ROOM_NOT_FOUND');
    });

    it('should return 404 when saving an invalid ObjectId string', async () => {
      const res = await request(app)
        .post('/api/saved-rooms/invalid-id-format')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.error.code).toBe('ROOM_NOT_FOUND');
    });

    it('should return 404 when trying to save a deactivated room', async () => {
      const res = await request(app)
        .post(`/api/saved-rooms/${deactivatedRoomId}`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.error.code).toBe('ROOM_NOT_FOUND');
    });
  });

  // ==========================================
  // GET SAVED ROOMS (GET /api/saved-rooms)
  // ==========================================
  describe('GET /api/saved-rooms', () => {
    it('should return empty array if user has not saved any rooms', async () => {
      const res = await request(app)
        .get('/api/saved-rooms')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual([]);
    });

    it('should return list of saved rooms with details and savedAt timestamp', async () => {
      // User 1 saves room 1 and room 2
      await request(app)
        .post(`/api/saved-rooms/${activeRoomId}`)
        .set('Authorization', `Bearer ${user1Token}`);

      await request(app)
        .post(`/api/saved-rooms/${secondRoomId}`)
        .set('Authorization', `Bearer ${user1Token}`);

      const res = await request(app)
        .get('/api/saved-rooms')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(2);

      const item1 = res.body.data.find((r) => r.id === activeRoomId);
      expect(item1).toBeDefined();
      expect(item1.title).toBe('Spacious 1BHK in Indiranagar');
      expect(item1.rent).toBe(22000);
      expect(item1.savedAt).toBeDefined();

      const item2 = res.body.data.find((r) => r.id === secondRoomId);
      expect(item2).toBeDefined();
      expect(item2.title).toBe('Cozy Room in Koramangala 5th Block');
    });

    it('should enforce user isolation: User 2 cannot see User 1 saved rooms', async () => {
      // User 1 saves room 1
      await request(app)
        .post(`/api/saved-rooms/${activeRoomId}`)
        .set('Authorization', `Bearer ${user1Token}`);

      // User 2 requests saved rooms
      const res2 = await request(app)
        .get('/api/saved-rooms')
        .set('Authorization', `Bearer ${user2Token}`);

      expect(res2.statusCode).toBe(200);
      expect(res2.body.data).toEqual([]);
    });

    it('should automatically exclude deactivated rooms from saved rooms', async () => {
      // User 1 saves room 1
      await request(app)
        .post(`/api/saved-rooms/${activeRoomId}`)
        .set('Authorization', `Bearer ${user1Token}`);

      // Owner deactivates room 1
      await RoomListing.findByIdAndUpdate(activeRoomId, { status: 'deactivated' });

      // User 1 requests saved rooms
      const res = await request(app)
        .get('/api/saved-rooms')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBe(0);
    });
  });

  // ==========================================
  // REMOVE SAVED ROOM (DELETE /api/saved-rooms/:roomId)
  // ==========================================
  describe('DELETE /api/saved-rooms/:roomId', () => {
    it('should remove room from bookmarks and record unsave interaction', async () => {
      // Save room first
      await request(app)
        .post(`/api/saved-rooms/${activeRoomId}`)
        .set('Authorization', `Bearer ${user1Token}`);

      // Verify it is saved
      let listRes = await request(app)
        .get('/api/saved-rooms')
        .set('Authorization', `Bearer ${user1Token}`);
      expect(listRes.body.data.length).toBe(1);

      // Remove bookmark
      const delRes = await request(app)
        .delete(`/api/saved-rooms/${activeRoomId}`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(delRes.statusCode).toBe(200);
      expect(delRes.body.success).toBe(true);
      expect(delRes.body.message).toBe('Room removed from bookmarks.');

      // Verify it is no longer returned in saved list
      listRes = await request(app)
        .get('/api/saved-rooms')
        .set('Authorization', `Bearer ${user1Token}`);
      expect(listRes.body.data.length).toBe(0);

      // Verify unsave interaction was persisted for CF
      const unsaveInteraction = await Interaction.findOne({
        user: user1Id,
        room: activeRoomId,
        action: 'unsave',
      });
      expect(unsaveInteraction).toBeDefined();
    });

    it('should allow re-saving after unsaving', async () => {
      // Save
      await request(app)
        .post(`/api/saved-rooms/${activeRoomId}`)
        .set('Authorization', `Bearer ${user1Token}`);

      // Unsave
      await request(app)
        .delete(`/api/saved-rooms/${activeRoomId}`)
        .set('Authorization', `Bearer ${user1Token}`);

      // Re-save
      const res = await request(app)
        .post(`/api/saved-rooms/${activeRoomId}`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.statusCode).toBe(201);

      // Check saved list
      const listRes = await request(app)
        .get('/api/saved-rooms')
        .set('Authorization', `Bearer ${user1Token}`);
      expect(listRes.body.data.length).toBe(1);
    });
  });
});
