import request from 'supertest';
import mongoose from 'mongoose';
import { jest } from '@jest/globals';
import app from '../src/app.js';
import User from '../src/models/User.js';
import RoomListing from '../src/models/RoomListing.js';
import Booking from '../src/models/Booking.js';
import { connectDB, disconnectDB } from '../src/config/db.js';

const TEST_DB_URI =
  process.env.MONGODB_BOOKINGS_TEST_URI ||
  'mongodb://localhost:27017/roomsync_test_concurrency_bookings';

describe('RoomSync Booking Concurrency & Synchronization Tests', () => {
  jest.setTimeout(45000);
  let ownerToken;
  let ownerId;
  let seekers = [];
  let testRoom;

  beforeAll(async () => {
    await connectDB(TEST_DB_URI);
    try {
      await mongoose.connection.dropDatabase();
    } catch (e) {}
    await User.syncIndexes();
    await RoomListing.syncIndexes();
    await Booking.syncIndexes();
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await User.deleteMany({});
      await RoomListing.deleteMany({});
      await Booking.deleteMany({});
      await disconnectDB();
    }
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await RoomListing.deleteMany({});
    await Booking.deleteMany({});

    // Register 1 Owner
    const ownerRes = await request(app).post('/api/auth/register').send({
      fullName: 'Host Aditya',
      email: 'host.aditya@example.com',
      phone: '9876543200',
      password: 'Password123!',
      role: 'owner',
    });
    ownerToken = ownerRes.body.data.token;
    ownerId = ownerRes.body.data.user.id;

    // Create 1 Active Room Listing
    const roomRes = await request(app)
      .post('/api/rooms')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        title: 'Master Bedroom in Indiranagar Luxury Flat',
        locality: 'Indiranagar 100ft Road',
        city: 'Bengaluru',
        pinCode: '560038',
        rent: 22000,
        deposit: 60000,
        roomType: 'Private Room with Attached Bath',
        furnishing: 'Fully Furnished',
        availableFrom: new Date().toISOString(),
        minStayMonths: 6,
      });
    testRoom = roomRes.body.data;

    // Register 10 distinct Seekers
    seekers = [];
    for (let i = 1; i <= 10; i++) {
      const seekerRes = await request(app).post('/api/auth/register').send({
        fullName: `Seeker ${i}`,
        email: `seeker${i}@example.com`,
        phone: `98765432${i < 10 ? '0' + i : i}`,
        password: 'Password123!',
        role: 'seeker',
      });
      seekers.push({
        id: seekerRes.body.data.user.id,
        token: seekerRes.body.data.token,
      });
    }
  }, 35000);

  test('Simultaneous Bookings: When 10 users book the same room concurrently, EXACTLY 1 succeeds and 9 receive 409 Conflict', async () => {
    // Fire all 10 reservation requests simultaneously via Promise.all
    const reservationPromises = seekers.map((seeker) =>
      request(app)
        .post('/api/bookings/reserve')
        .set('Authorization', `Bearer ${seeker.token}`)
        .send({
          roomId: testRoom._id || testRoom.id,
          bookingType: 'tenancy_reservation',
          tokenAmount: 5000,
          notes: `Simultaneous booking attempt by ${seeker.id}`,
        })
    );

    const responses = await Promise.all(reservationPromises);

    // Collect responses by HTTP status
    const successfulReservations = responses.filter((r) => r.status === 201);
    const conflictReservations = responses.filter((r) => r.status === 409);

    // 1. Exactly 1 user MUST win the reservation
    expect(successfulReservations.length).toBe(1);
    expect(successfulReservations[0].body.success).toBe(true);
    expect(successfulReservations[0].body.data.status).toBe('pending');
    expect(successfulReservations[0].body.data.tokenAmount).toBe(5000);

    // 2. All other 9 concurrent attempts MUST receive 409 Conflict
    expect(conflictReservations.length).toBe(9);
    conflictReservations.forEach((res) => {
      expect(res.body.success).toBe(false);
      expect(['ROOM_ALREADY_RESERVED', 'DUPLICATE_ACTIVE_BOOKING']).toContain(
        res.body.error.code
      );
    });

    // 3. Database State Verification: Zero double bookings
    const bookingsInDb = await Booking.find({ room: testRoom._id || testRoom.id });
    expect(bookingsInDb.length).toBe(1);

    // 4. Room State Verification: Marked 'reserved'
    const roomInDb = await RoomListing.findById(testRoom._id || testRoom.id);
    expect(roomInDb.status).toBe('reserved');
    expect(roomInDb.reservedBy.toString()).toBe(
      successfulReservations[0].body.data.seeker
    );
    expect(roomInDb.reservedUntil).not.toBeNull();
  });

  test('Host cannot book their own property listing', async () => {
    const res = await request(app)
      .post('/api/bookings/reserve')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        roomId: testRoom._id || testRoom.id,
        tokenAmount: 5000,
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('CANNOT_BOOK_OWN_LISTING');
  });

  test('Cancellation & Lock Release: When a reservation is cancelled, room atomically returns to active', async () => {
    // Seeker 1 books the room
    const bookRes = await request(app)
      .post('/api/bookings/reserve')
      .set('Authorization', `Bearer ${seekers[0].token}`)
      .send({ roomId: testRoom._id || testRoom.id });
    expect(bookRes.status).toBe(201);
    const bookingId = bookRes.body.data.id || bookRes.body.data._id;

    // Room is now reserved
    let room = await RoomListing.findById(testRoom._id || testRoom.id);
    expect(room.status).toBe('reserved');

    // Seeker 1 cancels the booking
    const cancelRes = await request(app)
      .patch(`/api/bookings/${bookingId}/cancel`)
      .set('Authorization', `Bearer ${seekers[0].token}`);
    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.data.status).toBe('cancelled');

    // Room is immediately active again
    room = await RoomListing.findById(testRoom._id || testRoom.id);
    expect(room.status).toBe('active');
    expect(room.reservedBy).toBeNull();

    // Seeker 2 can now reserve the room cleanly
    const rebookRes = await request(app)
      .post('/api/bookings/reserve')
      .set('Authorization', `Bearer ${seekers[1].token}`)
      .send({ roomId: testRoom._id || testRoom.id });
    expect(rebookRes.status).toBe(201);
    expect(rebookRes.body.data.seeker).toBe(seekers[1].id);
  });

  test('Host Confirmation: Property host can confirm a pending booking', async () => {
    const bookRes = await request(app)
      .post('/api/bookings/reserve')
      .set('Authorization', `Bearer ${seekers[0].token}`)
      .send({ roomId: testRoom._id || testRoom.id });
    const bookingId = bookRes.body.data.id || bookRes.body.data._id;

    const confirmRes = await request(app)
      .patch(`/api/bookings/${bookingId}/confirm`)
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(confirmRes.status).toBe(200);
    expect(confirmRes.body.data.status).toBe('confirmed');

    const updatedBooking = await Booking.findById(bookingId);
    expect(updatedBooking.status).toBe('confirmed');
  });
});
