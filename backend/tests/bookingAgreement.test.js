import request from 'supertest';
import mongoose from 'mongoose';
import { jest } from '@jest/globals';
import app from '../src/app.js';
import User from '../src/models/User.js';
import RoomListing from '../src/models/RoomListing.js';
import Booking from '../src/models/Booking.js';
import MutualAgreement from '../src/models/MutualAgreement.js';
import { connectDB, disconnectDB } from '../src/config/db.js';

const TEST_DB_URI =
  process.env.MONGODB_AGREEMENT_TEST_URI ||
  'mongodb://localhost:27017/roomsync_test_agreements';

describe('RoomSync Booking Request & Mutual Digital Agreement Workflow', () => {
  jest.setTimeout(35000);
  let ownerToken;
  let ownerId;
  let seekerToken;
  let seekerId;
  let otherSeekerToken;
  let testRoomId;

  beforeAll(async () => {
    await connectDB(TEST_DB_URI);
    try {
      await mongoose.connection.dropDatabase();
    } catch (e) {}
    await User.syncIndexes();
    await RoomListing.syncIndexes();
    await Booking.syncIndexes();
    await MutualAgreement.syncIndexes();
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await User.deleteMany({});
      await RoomListing.deleteMany({});
      await Booking.deleteMany({});
      await MutualAgreement.deleteMany({});
      await disconnectDB();
    }
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await RoomListing.deleteMany({});
    await Booking.deleteMany({});
    await MutualAgreement.deleteMany({});

    // 1. Register Verified Owner
    const ownerRes = await request(app).post('/api/auth/register').send({
      fullName: 'Vikramaditya Singhania',
      email: 'vikram.owner@example.com',
      phone: '9876543201',
      password: 'Password123!',
      role: 'owner',
    });
    ownerToken = ownerRes.body.data.token;
    ownerId = ownerRes.body.data.user.id;
    await User.findByIdAndUpdate(ownerId, { ownerVerificationStatus: 'Verified', isVerified: true });

    // 2. Register Primary Seeker
    const seekerRes = await request(app).post('/api/auth/register').send({
      fullName: 'Rhea Sen',
      email: 'rhea.seeker@example.com',
      phone: '9876543202',
      password: 'Password123!',
      role: 'seeker',
    });
    seekerToken = seekerRes.body.data.token;
    seekerId = seekerRes.body.data.user.id;

    // 3. Register Secondary Seeker (for testing access restrictions)
    const otherRes = await request(app).post('/api/auth/register').send({
      fullName: 'Other Seeker',
      email: 'other.seeker@example.com',
      phone: '9876543203',
      password: 'Password123!',
      role: 'seeker',
    });
    otherSeekerToken = otherRes.body.data.token;

    // 4. Create Active Room Listing
    const roomRes = await request(app)
      .post('/api/rooms')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        title: 'Spacious Master Bedroom in Bandra West',
        locality: 'Pali Hill, Bandra West',
        city: 'Mumbai',
        pinCode: '400050',
        rent: 32000,
        deposit: 90000,
        roomType: 'Private Room with Attached Bath',
        furnishing: 'Fully Furnished',
        availableFrom: new Date().toISOString(),
        minStayMonths: 6,
        livingConditions: {
          foodPreference: 'Flexible',
          smoking: 'Strictly Non-Smoking',
          alcohol: 'Social Drinking OK',
          cleanliness: 4.0,
        },
      });
    testRoomId = roomRes.body.data.id;
  });

  describe('Step 1: Booking Request Submission', () => {
    it('should allow seeker to submit a booking request without any token payment', async () => {
      const res = await request(app)
        .post('/api/bookings/request')
        .set('Authorization', `Bearer ${seekerToken}`)
        .send({
          roomId: testRoomId,
          moveInDate: '2026-11-15T00:00:00.000Z',
          stayDuration: 11,
          occupantsCount: 1,
          message: 'Hi Vikramaditya, I am a product designer working in BKC. Looking forward to moving in!',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('pending');
      expect(res.body.data.stayDuration).toBe(11);
      expect(res.body.data.message).toContain('product designer');
    });

    it('should reject booking requests if room does not exist', async () => {
      const res = await request(app)
        .post('/api/bookings/request')
        .set('Authorization', `Bearer ${seekerToken}`)
        .send({
          roomId: new mongoose.Types.ObjectId().toString(),
          moveInDate: '2026-11-15T00:00:00.000Z',
        });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('ROOM_NOT_FOUND');
    });

    it('should prevent owner from booking their own listing', async () => {
      const res = await request(app)
        .post('/api/bookings/request')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          roomId: testRoomId,
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('CANNOT_BOOK_OWN_LISTING');
    });
  });

  describe('Step 2 & 3: Owner Review, Acceptance & Mutual Agreement Generation', () => {
    let bookingId;

    beforeEach(async () => {
      const bookRes = await request(app)
        .post('/api/bookings/request')
        .set('Authorization', `Bearer ${seekerToken}`)
        .send({
          roomId: testRoomId,
          moveInDate: '2026-11-20T00:00:00.000Z',
          stayDuration: 6,
          message: 'Excited about the flat!',
        });
      bookingId = bookRes.body.data.id || bookRes.body.data._id;
    });

    it('should allow owner to view booking requests via /api/bookings/owner-bookings', async () => {
      const res = await request(app)
        .get('/api/bookings/owner-bookings')
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].seeker.fullName).toBe('Rhea Sen');
    });

    it('should allow owner to reject a booking request with a reason', async () => {
      const res = await request(app)
        .patch(`/api/bookings/${bookingId}/respond`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          action: 'reject',
          rejectionReason: 'Looking for someone who can move in earlier.',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('rejected');
      expect(res.body.data.rejectionReason).toBe('Looking for someone who can move in earlier.');
    });

    it('should generate a Mutual Agreement when owner accepts the booking request', async () => {
      const res = await request(app)
        .patch(`/api/bookings/${bookingId}/respond`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ action: 'accept' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.booking.status).toBe('accepted');
      expect(res.body.data.agreement).toBeDefined();

      const agreement = res.body.data.agreement;
      expect(agreement.agreementNumber).toMatch(/^RS-AGR-/);
      expect(agreement.monthlyRent).toBe(32000);
      expect(agreement.securityDeposit).toBe(90000);
      expect(agreement.legalDisclaimer).toContain('RoomSync is a matchmaking platform');
      expect(agreement.status).toBe('pending_signatures');
    });
  });

  describe('Step 4 & 5: Mutual Digital Signing & PDF Generation', () => {
    let agreementId;

    beforeEach(async () => {
      const bookRes = await request(app)
        .post('/api/bookings/request')
        .set('Authorization', `Bearer ${seekerToken}`)
        .send({
          roomId: testRoomId,
          moveInDate: '2026-11-20T00:00:00.000Z',
          stayDuration: 6,
        });
      const bookingId = bookRes.body.data.id || bookRes.body.data._id;

      const acceptRes = await request(app)
        .patch(`/api/bookings/${bookingId}/respond`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ action: 'accept' });

      agreementId = acceptRes.body.data.agreement.id || acceptRes.body.data.agreement._id;
    });

    it('should require explicit non-preselected consent checkbox to sign agreement', async () => {
      const res = await request(app)
        .post(`/api/agreements/${agreementId}/sign`)
        .set('Authorization', `Bearer ${seekerToken}`)
        .send({ accepted: false });

      expect(res.status).toBe(400);
    });

    it('should record digital signature with timestamp and client IP for seeker', async () => {
      const res = await request(app)
        .post(`/api/agreements/${agreementId}/sign`)
        .set('Authorization', `Bearer ${seekerToken}`)
        .send({ accepted: true });

      expect(res.status).toBe(200);
      expect(res.body.data.seekerAccepted).toBe(true);
      expect(res.body.data.seekerAcceptedAt).toBeDefined();
      expect(res.body.data.seekerIp).toBeDefined();
      // Owner hasn't signed yet, so status remains pending_signatures
      expect(res.body.data.status).toBe('pending_signatures');
    });

    it('should transition agreement and booking to completed when BOTH parties sign', async () => {
      // 1. Seeker signs
      await request(app)
        .post(`/api/agreements/${agreementId}/sign`)
        .set('Authorization', `Bearer ${seekerToken}`)
        .send({ accepted: true });

      // 2. Owner signs
      const ownerSignRes = await request(app)
        .post(`/api/agreements/${agreementId}/sign`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ accepted: true });

      expect(ownerSignRes.status).toBe(200);
      expect(ownerSignRes.body.data.ownerAccepted).toBe(true);
      expect(ownerSignRes.body.data.status).toBe('completed');
    });

    it('should stream downloadable PDF with application/pdf header for authorized participant', async () => {
      const res = await request(app)
        .get(`/api/agreements/${agreementId}/pdf`)
        .set('Authorization', `Bearer ${seekerToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('application/pdf');
      expect(res.headers['content-disposition']).toContain('attachment'); // or inline
    });

    it('should reject unauthorized third-party seekers from downloading agreement PDF with 403', async () => {
      const res = await request(app)
        .get(`/api/agreements/${agreementId}/pdf`)
        .set('Authorization', `Bearer ${otherSeekerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });
});

