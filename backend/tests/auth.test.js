import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import User from '../src/models/User.js';
import { connectDB, disconnectDB } from '../src/config/db.js';

const TEST_DB_URI =
  process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/roomsync_test';
const JWT_SECRET =
  process.env.JWT_SECRET || 'roomsync_jwt_dev_secret_key_minimum_32_chars';

describe('RoomSync Authentication API & Security', () => {
  beforeAll(async () => {
    await connectDB(TEST_DB_URI);
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await User.deleteMany({});
      await disconnectDB();
    }
  });

  beforeEach(async () => {
    await User.deleteMany({});
  });

  // ==========================================
  // REGISTRATION ENDPOINT TESTS
  // ==========================================
  describe('POST /api/auth/register', () => {
    it('should register a new seeker successfully with hashed password and clean response', async () => {
      const res = await request(app).post('/api/auth/register').send({
        fullName: 'Priya Sharma',
        email: 'Priya.Sharma@Example.com',
        phone: '9876543210',
        password: 'Password123!',
        role: 'seeker',
      });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Account created successfully.');
      expect(res.body.data.token).toBeDefined();

      const user = res.body.data.user;
      expect(user).toBeDefined();
      expect(user.fullName).toBe('Priya Sharma');
      expect(user.email).toBe('priya.sharma@example.com'); // lowercased / normalized
      expect(user.phone).toBe('9876543210');
      expect(user.role).toBe('seeker');
      expect(user.id).toBeDefined();

      // Password and password hash MUST NOT be in response
      expect(user.password).toBeUndefined();

      // Verify in DB that password was hashed with bcrypt
      const dbUser = await User.findById(user.id).select('+password');
      expect(dbUser).toBeDefined();
      expect(dbUser.password).not.toBe('Password123!');
      expect(dbUser.password.startsWith('$2')).toBe(true); // bcrypt signature
    });

    it('should register a room owner successfully', async () => {
      const res = await request(app).post('/api/auth/register').send({
        fullName: 'Aditya Sharma',
        email: 'aditya.owner@example.com',
        phone: '9876543211',
        password: 'Password123!',
        role: 'owner',
      });

      expect(res.statusCode).toBe(201);
      expect(res.body.data.user.role).toBe('owner');
    });

    it('should reject registration with missing required fields', async () => {
      const res = await request(app).post('/api/auth/register').send({});

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(Array.isArray(res.body.error.details)).toBe(true);
      expect(res.body.error.details.length).toBeGreaterThan(0);
    });

    it('should reject registration with invalid email format', async () => {
      const res = await request(app).post('/api/auth/register').send({
        fullName: 'Priya Sharma',
        email: 'not-an-email',
        phone: '9876543210',
        password: 'Password123!',
      });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(
        res.body.error.details.some((d) => d.field === 'email')
      ).toBe(true);
    });

    it('should reject registration with invalid phone format (less than 10 digits)', async () => {
      const res = await request(app).post('/api/auth/register').send({
        fullName: 'Priya Sharma',
        email: 'priya@example.com',
        phone: '12345',
        password: 'Password123!',
      });

      expect(res.statusCode).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(
        res.body.error.details.some((d) => d.field === 'phone')
      ).toBe(true);
    });

    it('should reject registration with password shorter than 6 characters', async () => {
      const res = await request(app).post('/api/auth/register').send({
        fullName: 'Priya Sharma',
        email: 'priya@example.com',
        phone: '9876543210',
        password: '123',
      });

      expect(res.statusCode).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(
        res.body.error.details.some((d) => d.field === 'password')
      ).toBe(true);
    });

    it('should reject registration with invalid role', async () => {
      const res = await request(app).post('/api/auth/register').send({
        fullName: 'Priya Sharma',
        email: 'priya@example.com',
        phone: '9876543210',
        password: 'Password123!',
        role: 'superadmin',
      });

      expect(res.statusCode).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.details.some((d) => d.field === 'role')).toBe(true);
    });

    it('should reject duplicate email registration with 409 Conflict', async () => {
      // First registration
      await request(app).post('/api/auth/register').send({
        fullName: 'Priya Sharma',
        email: 'priya.sharma@example.com',
        phone: '9876543210',
        password: 'Password123!',
      });

      // Second registration with identical email (different case)
      const res = await request(app).post('/api/auth/register').send({
        fullName: 'Priya Sharma Duplicate',
        email: 'PRIYA.SHARMA@example.com',
        phone: '9876543299',
        password: 'AnotherPassword123!',
      });

      expect(res.statusCode).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('EMAIL_ALREADY_EXISTS');
    });
  });

  // ==========================================
  // LOGIN ENDPOINT TESTS
  // ==========================================
  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app).post('/api/auth/register').send({
        fullName: 'Shiva Seeker',
        email: 'shiva@example.com',
        phone: '9876543210',
        password: 'CorrectPassword123!',
        role: 'seeker',
      });
    });

    it('should authenticate with valid credentials and return signed token and user', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'SHIVA@example.com', // case-insensitive check
        password: 'CorrectPassword123!',
      });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Login successful.');
      expect(res.body.data.token).toBeDefined();

      const user = res.body.data.user;
      expect(user.email).toBe('shiva@example.com');
      expect(user.fullName).toBe('Shiva Seeker');
      expect(user.password).toBeUndefined(); // Never expose password

      // Verify token decodes to user ID
      const decoded = jwt.verify(res.body.data.token, JWT_SECRET);
      expect(decoded.id).toBe(user.id);
      expect(decoded.role).toBe('seeker');
    });

    it('should reject login with wrong password without revealing details', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'shiva@example.com',
        password: 'WrongPassword999!',
      });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
      expect(res.body.message).toBe('Invalid email or password.');
    });

    it('should reject login with non-existent email using the same generic error', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'nonexistent@example.com',
        password: 'SomePassword123!',
      });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
      expect(res.body.message).toBe('Invalid email or password.');
    });

    it('should reject login with missing credentials', async () => {
      const res = await request(app).post('/api/auth/login').send({});

      expect(res.statusCode).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  // ==========================================
  // GET /api/auth/me ENDPOINT TESTS
  // ==========================================
  describe('GET /api/auth/me', () => {
    let validToken;
    let registeredUser;

    beforeEach(async () => {
      const regRes = await request(app).post('/api/auth/register').send({
        fullName: 'Kavita Menon',
        email: 'kavita@example.com',
        phone: '9845112345',
        password: 'Password123!',
        role: 'seeker',
      });
      validToken = regRes.body.data.token;
      registeredUser = regRes.body.data.user;
    });

    it('should retrieve current user profile when given valid JWT', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(registeredUser.id);
      expect(res.body.data.email).toBe('kavita@example.com');
      expect(res.body.data.fullName).toBe('Kavita Menon');
      expect(res.body.data.password).toBeUndefined();
    });

    it('should reject request when Authorization header is missing', async () => {
      const res = await request(app).get('/api/auth/me');

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should reject request when Authorization header has invalid format', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Basic 12345');

      expect(res.statusCode).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should reject request when token is malformed or signature is invalid', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid.token.string');

      expect(res.statusCode).toBe(401);
      expect(res.body.error.code).toBe('INVALID_TOKEN');
    });

    it('should reject request when token has expired', async () => {
      // Create an expired token manually
      const expiredToken = jwt.sign(
        { id: registeredUser.id, role: 'seeker' },
        JWT_SECRET,
        { expiresIn: '-1s' }
      );

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(res.statusCode).toBe(401);
      expect(res.body.error.code).toBe('TOKEN_EXPIRED');
    });

    it('should return 401 USER_NOT_FOUND when valid token belongs to deleted user', async () => {
      // Delete user from database
      await User.findByIdAndDelete(registeredUser.id);

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.statusCode).toBe(401);
      expect(res.body.error.code).toBe('USER_NOT_FOUND');
    });
  });
});
