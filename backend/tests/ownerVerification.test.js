import request from 'supertest';
import mongoose from 'mongoose';
import { jest } from '@jest/globals';
import app from '../src/app.js';
import User from '../src/models/User.js';
import OwnerVerification from '../src/models/OwnerVerification.js';
import RoomListing from '../src/models/RoomListing.js';
import { connectDB, disconnectDB } from '../src/config/db.js';

const TEST_DB_URI =
  process.env.MONGODB_VERIFY_TEST_URI || 'mongodb://localhost:27017/roomsync_test_verification';

describe('RoomSync Owner Identity Verification & RBAC (/api/verification)', () => {
  jest.setTimeout(35000);
  let seekerToken, seekerId;
  let ownerToken, ownerId;
  let adminToken, adminId;

  beforeAll(async () => {
    await connectDB(TEST_DB_URI);
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await User.deleteMany({});
      await OwnerVerification.deleteMany({});
      await RoomListing.deleteMany({});
      await disconnectDB();
    }
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await OwnerVerification.deleteMany({});
    await RoomListing.deleteMany({});

    // 1. Register Seeker
    const seekerRes = await request(app).post('/api/auth/register').send({
      fullName: 'Sneha Seeker',
      email: 'sneha@example.com',
      phone: '9876543210',
      password: 'Password123!',
      role: 'seeker',
    });
    seekerToken = seekerRes.body.data.token;
    seekerId = seekerRes.body.data.user.id;

    // 2. Register Owner
    const ownerRes = await request(app).post('/api/auth/register').send({
      fullName: 'Vikram Owner',
      email: 'vikram@example.com',
      phone: '9876543211',
      password: 'Password123!',
      role: 'owner',
    });
    ownerToken = ownerRes.body.data.token;
    ownerId = ownerRes.body.data.user.id;

    // 3. Create Admin
    const adminUser = await User.create({
      fullName: 'Admin Superuser',
      email: 'admin@roomsync.in',
      phone: '9876543299',
      password: 'Password123!',
      role: 'admin',
    });
    const adminLoginRes = await request(app).post('/api/auth/login').send({
      email: 'admin@roomsync.in',
      password: 'Password123!',
    });
    adminToken = adminLoginRes.body.data.token;
    adminId = adminUser._id.toString();
  });

  const sampleRoomPayload = {
    title: 'Sunny Master Bedroom in Bandra West',
    locality: 'Pali Hill, Bandra West',
    city: 'Mumbai',
    pinCode: '400050',
    rent: 28000,
    deposit: 56000,
    roomType: 'Private Room with Attached Bath',
    furnishing: 'Fully Furnished',
    availableFrom: '2026-11-01T00:00:00.000Z',
    minStayMonths: 6,
    livingConditions: {
      foodPreference: 'Eggetarian / Flexible Non-veg',
      smoking: 'Strictly Non-Smoking',
      alcohol: 'Social Drinking OK',
      sleepSchedule: 23.0,
      wakeSchedule: 7.0,
      cleanliness: 4.0,
      noiseTolerance: 3.0,
      wfhFrequency: 2,
    },
  };

  it('should reject room creation from a room seeker with 403 FORBIDDEN', async () => {
    const res = await request(app)
      .post('/api/rooms')
      .set('Authorization', `Bearer ${seekerToken}`)
      .send(sampleRoomPayload);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('should reject room creation from an unverified owner (Not Started) with 403 OWNER_NOT_VERIFIED', async () => {
    const res = await request(app)
      .post('/api/rooms')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send(sampleRoomPayload);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('OWNER_NOT_VERIFIED');
    expect(res.body.error.status).toBe('Not Started');
  });

  it('should allow seeker to initiate becoming an owner via /become-owner', async () => {
    const res = await request(app)
      .post('/api/verification/become-owner')
      .set('Authorization', `Bearer ${seekerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.verificationStatus).toBe('Not Started');
    expect(res.body.data.nextStep).toBe('SUBMIT_VERIFICATION');
  });

  it('should reject verification submission if explicit consent is missing', async () => {
    const res = await request(app)
      .post('/api/verification/submit')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        legalFullName: 'Vikram Malhotra',
        currentAddress: 'Flat 402, Sea Breeze, Bandra West, Mumbai',
        idDocumentType: 'Passport',
        idNumber: 'Z1234567',
        consentGiven: false, // Must be true!
      });

    expect(res.status).toBe(400);
    expect(res.body.error.details.some((d) => d.field === 'consentGiven')).toBe(true);
  });

  it('should accept valid verification submission, mask the ID number, and set status to Pending', async () => {
    const res = await request(app)
      .post('/api/verification/submit')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        legalFullName: 'Vikram Malhotra',
        currentAddress: 'Flat 402, Sea Breeze, Bandra West, Mumbai',
        idDocumentType: 'Aadhaar_Virtual_ID_Masked',
        idNumber: '1234-5678-9012',
        consentGiven: true,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('Pending');
    // Ensure raw ID is masked (never raw)
    expect(res.body.data.maskedIdNumber).toBe('XXXX-XXXX-9012');

    // Owner cannot create listing while status is Pending
    const createRes = await request(app)
      .post('/api/rooms')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send(sampleRoomPayload);

    expect(createRes.status).toBe(403);
    expect(createRes.body.error.code).toBe('OWNER_NOT_VERIFIED');
    expect(createRes.body.error.status).toBe('Pending');
  });

  it('should reject non-admin access to admin verification review endpoints', async () => {
    const res = await request(app)
      .get('/api/verification/admin/pending')
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(res.status).toBe(403);
  });

  it('should allow admin to review and approve verification, enabling room creation', async () => {
    // 1. Submit verification
    await request(app)
      .post('/api/verification/submit')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        legalFullName: 'Vikram Malhotra',
        currentAddress: 'Flat 402, Sea Breeze, Bandra West, Mumbai',
        idDocumentType: 'Passport',
        idNumber: 'A9876543',
        consentGiven: true,
      });

    // 2. Admin fetches pending verifications
    const pendingRes = await request(app)
      .get('/api/verification/admin/pending')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(pendingRes.status).toBe(200);
    expect(pendingRes.body.data.length).toBe(1);
    const applicationId = pendingRes.body.data[0].id || pendingRes.body.data[0]._id;

    // 3. Admin approves verification
    const reviewRes = await request(app)
      .patch(`/api/verification/admin/${applicationId}/review`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        status: 'Verified',
        reviewerNotes: 'Government passport verified successfully against national registry.',
      });

    expect(reviewRes.status).toBe(200);
    expect(reviewRes.body.data.status).toBe('Verified');
    expect(reviewRes.body.data.auditLogs.length).toBe(2);

    // 4. Now owner creates listing successfully!
    const roomRes = await request(app)
      .post('/api/rooms')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send(sampleRoomPayload);

    expect(roomRes.status).toBe(201);
    expect(roomRes.body.success).toBe(true);
    expect(roomRes.body.data.title).toBe(sampleRoomPayload.title);
  });
});
