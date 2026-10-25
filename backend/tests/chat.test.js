import http from 'http';
import request from 'supertest';
import mongoose from 'mongoose';
import { Server as SocketIOServer } from 'socket.io';
import { io as ClientIO } from 'socket.io-client';
import app from '../src/app.js';
import User from '../src/models/User.js';
import Conversation from '../src/models/Conversation.js';
import Message from '../src/models/Message.js';
import RoomListing from '../src/models/RoomListing.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { setupSocketIO } from '../src/services/socketHandler.js';

const TEST_DB_URI =
  process.env.MONGODB_CHAT_TEST_URI ||
  'mongodb://localhost:27017/roomsync_test_chat';

describe('RoomSync Real-Time Chat & Messaging API', () => {
  let server;
  let ioServer;
  let serverAddress;
  let port;

  let seekerToken;
  let seekerId;
  let ownerToken;
  let ownerId;
  let bystanderToken;
  let bystanderId;
  let testRoomId;
  let testConversationId;

  beforeAll(async () => {
    await connectDB(TEST_DB_URI);
    await User.syncIndexes();
    await Conversation.syncIndexes();
    await Message.syncIndexes();

    // Setup an ephemeral test HTTP server with Socket.IO
    server = http.createServer(app);
    ioServer = new SocketIOServer(server, {
      cors: { origin: '*' },
    });
    app.set('io', ioServer);
    setupSocketIO(ioServer);

    await new Promise((resolve) => {
      server.listen(0, () => {
        port = server.address().port;
        serverAddress = `http://localhost:${port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    if (ioServer) {
      ioServer.close();
    }
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    if (mongoose.connection.readyState !== 0) {
      await User.deleteMany({});
      await Conversation.deleteMany({});
      await Message.deleteMany({});
      await RoomListing.deleteMany({});
      await disconnectDB();
    }
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Conversation.deleteMany({});
    await Message.deleteMany({});
    await RoomListing.deleteMany({});

    // Register Seeker
    const seekerRes = await request(app).post('/api/auth/register').send({
      fullName: 'Chat Seeker',
      email: 'chat.seeker@example.com',
      phone: '9876543101',
      password: 'Password123!',
      role: 'seeker',
    });
    seekerToken = seekerRes.body.data.token;
    seekerId = seekerRes.body.data.user.id;

    // Register Owner
    const ownerRes = await request(app).post('/api/auth/register').send({
      fullName: 'Chat Owner',
      email: 'chat.owner@example.com',
      phone: '9876543102',
      password: 'Password123!',
      role: 'owner',
    });
    ownerToken = ownerRes.body.data.token;
    ownerId = ownerRes.body.data.user.id;

    // Register Bystander
    const bystanderRes = await request(app).post('/api/auth/register').send({
      fullName: 'Unrelated User',
      email: 'unrelated@example.com',
      phone: '9876543103',
      password: 'Password123!',
      role: 'seeker',
    });
    bystanderToken = bystanderRes.body.data.token;
    bystanderId = bystanderRes.body.data.user.id;

    // Create a Room Listing
    const room = await RoomListing.create({
      owner: ownerId,
      title: 'Penthouse Room in Koramangala',
      locality: 'Koramangala 4th Block',
      city: 'Bengaluru',
      pinCode: '560034',
      rent: 20000,
      deposit: 50000,
      roomType: 'Private Room with Attached Bath',
      furnishing: 'Fully Furnished',
      availableFrom: new Date('2026-11-01'),
      livingConditions: {
        foodPreference: 'Pure Vegetarian',
        smoking: 'Strictly Non-Smoking',
        alcohol: 'Teetotaler',
      },
    });
    testRoomId = room._id.toString();

    // Create a Conversation between Seeker and Owner
    const conversation = await Conversation.create({
      participants: [seekerId, ownerId],
      room: testRoomId,
      lastMessage: 'Initial enquiry',
    });
    testConversationId = conversation._id.toString();
  });

  describe('REST Endpoints: /api/conversations', () => {
    it('should reject unauthenticated requests with 401', async () => {
      const res = await request(app).get('/api/conversations');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return conversations for the authenticated user', async () => {
      const res = await request(app)
        .get('/api/conversations')
        .set('Authorization', `Bearer ${seekerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].id).toBe(testConversationId);
    });

    it('should return empty list for user with no conversations', async () => {
      const res = await request(app)
        .get('/api/conversations')
        .set('Authorization', `Bearer ${bystanderToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(0);
    });

    it('should allow creating or retrieving conversation with POST /api/conversations', async () => {
      const res = await request(app)
        .post('/api/conversations')
        .set('Authorization', `Bearer ${bystanderToken}`)
        .send({
          recipientId: ownerId,
          roomId: testRoomId,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.participants).toHaveLength(2);
    });

    it('should automatically derive owner and start enquiry when providing only roomId', async () => {
      const res = await request(app)
        .post('/api/conversations')
        .set('Authorization', `Bearer ${bystanderToken}`)
        .send({
          roomId: testRoomId,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.participants).toHaveLength(2);
      expect(res.body.data.room.id).toBe(testRoomId);
      const participantIds = res.body.data.participants.map((p) => p._id.toString());
      expect(participantIds).toContain(ownerId);
      expect(participantIds).toContain(bystanderId);
    });

    it('should reject owner attempting to start enquiry on their own room with 400', async () => {
      const res = await request(app)
        .post('/api/conversations')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          roomId: testRoomId,
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('SELF_CONVERSATION');
    });

    it('should reject creating conversation with oneself with 400', async () => {
      const res = await request(app)
        .post('/api/conversations')
        .set('Authorization', `Bearer ${seekerToken}`)
        .send({
          recipientId: seekerId,
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('SELF_CONVERSATION');
    });

    it('should allow participant to send and persist a message via REST', async () => {
      const res = await request(app)
        .post(`/api/conversations/${testConversationId}/messages`)
        .set('Authorization', `Bearer ${seekerToken}`)
        .send({
          text: 'Hi, is this room still available for visits?',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.text).toBe('Hi, is this room still available for visits?');
      expect(res.body.data.sender._id.toString()).toBe(seekerId);

      // Verify in MongoDB
      const dbMsg = await Message.findById(res.body.data.id);
      expect(dbMsg).not.toBeNull();
      expect(dbMsg.text).toBe('Hi, is this room still available for visits?');

      // Verify conversation metadata updated
      const conv = await Conversation.findById(testConversationId);
      expect(conv.lastMessage).toBe('Hi, is this room still available for visits?');
    });

    it('should reject message send from unauthorized user with 403', async () => {
      const res = await request(app)
        .post(`/api/conversations/${testConversationId}/messages`)
        .set('Authorization', `Bearer ${bystanderToken}`)
        .send({
          text: 'Intruder message',
        });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('should reject empty or whitespace-only messages with 400', async () => {
      const res = await request(app)
        .post(`/api/conversations/${testConversationId}/messages`)
        .set('Authorization', `Bearer ${seekerToken}`)
        .send({
          text: '   ',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return paginated message history to authorized participant', async () => {
      await Message.create({
        conversation: testConversationId,
        sender: seekerId,
        text: 'Message 1',
      });
      await Message.create({
        conversation: testConversationId,
        sender: ownerId,
        text: 'Message 2',
      });

      const res = await request(app)
        .get(`/api/conversations/${testConversationId}/messages?limit=10&page=1`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.meta.total).toBe(2);
    });
  });

  describe('Socket.IO Real-Time Delivery & Authentication', () => {
    it('should reject socket connection with invalid or missing token', (done) => {
      const client = ClientIO(serverAddress, {
        auth: { token: 'invalid_token_string' },
        transports: ['websocket'],
      });

      client.on('connect_error', (err) => {
        expect(err.message).toContain('Authentication error');
        client.close();
        done();
      });
    });

    it('should accept socket connection with valid JWT and allow authorized room join', (done) => {
      const client = ClientIO(serverAddress, {
        auth: { token: seekerToken },
        transports: ['websocket'],
      });

      client.on('connect', () => {
        client.emit(
          'join_room',
          { conversationId: testConversationId },
          (response) => {
            expect(response.success).toBe(true);
            expect(response.conversationId).toBe(testConversationId);
            client.close();
            done();
          }
        );
      });
    });

    it('should reject unauthorized user from joining a private conversation room', (done) => {
      const bystanderClient = ClientIO(serverAddress, {
        auth: { token: bystanderToken },
        transports: ['websocket'],
      });

      bystanderClient.on('connect', () => {
        bystanderClient.emit(
          'join_room',
          { conversationId: testConversationId },
          (response) => {
            expect(response.success).toBe(false);
            expect(response.error).toContain('Unauthorized');
            bystanderClient.close();
            done();
          }
        );
      });
    });

    it('should persist message and broadcast receive_message event in real-time', (done) => {
      const seekerClient = ClientIO(serverAddress, {
        auth: { token: seekerToken },
        transports: ['websocket'],
      });
      const ownerClient = ClientIO(serverAddress, {
        auth: { token: ownerToken },
        transports: ['websocket'],
      });

      let seekerJoined = false;
      let ownerJoined = false;

      function trySend() {
        if (seekerJoined && ownerJoined) {
          seekerClient.emit(
            'send_message',
            {
              conversationId: testConversationId,
              text: 'Real-time test message through Socket.IO',
            },
            (ack) => {
              expect(ack.success).toBe(true);
              expect(ack.data.text).toBe(
                'Real-time test message through Socket.IO'
              );
            }
          );
        }
      }

      seekerClient.on('connect', () => {
        seekerClient.emit('join_room', { conversationId: testConversationId }, () => {
          seekerJoined = true;
          trySend();
        });
      });

      ownerClient.on('connect', () => {
        ownerClient.emit('join_room', { conversationId: testConversationId }, () => {
          ownerJoined = true;
          trySend();
        });

        ownerClient.on('receive_message', async (msg) => {
          expect(msg.text).toBe('Real-time test message through Socket.IO');
          expect(msg.sender.id).toBe(seekerId);

          // Verify saved in MongoDB
          const savedInDb = await Message.findById(msg.id);
          expect(savedInDb).not.toBeNull();
          expect(savedInDb.text).toBe('Real-time test message through Socket.IO');

          seekerClient.close();
          ownerClient.close();
          done();
        });
      });
    });
  });
});
