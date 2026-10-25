import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';

/**
 * Configure Socket.IO authentication and event listeners
 * @param {import('socket.io').Server} io - Socket.IO server instance
 */
export function setupSocketIO(io) {
  // Authentication middleware for Socket.IO
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        (socket.handshake.headers?.authorization?.startsWith('Bearer ')
          ? socket.handshake.headers.authorization.split(' ')[1]
          : null);

      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const secret = process.env.JWT_SECRET;
      if (!secret) {
        return next(new Error('Authentication error: Server configuration missing'));
      }

      const decoded = jwt.verify(token, secret);
      const user = await User.findById(decoded.id).select(
        'fullName email role avatar isVerified'
      );

      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.user = user;
      next();
    } catch (error) {
      return next(new Error(`Authentication error: ${error.message}`));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.user;
    if (process.env.NODE_ENV !== 'test') {
      console.log(
        `[Socket.IO] User connected: ${user.fullName} (${user._id}) [Socket: ${socket.id}]`
      );
    }

    /**
     * Join a specific conversation room after verifying membership
     */
    socket.on('join_room', async (data, callback) => {
      try {
        const { conversationId } = data || {};

        if (!conversationId || !mongoose.Types.ObjectId.isValid(conversationId)) {
          if (typeof callback === 'function') {
            return callback({
              success: false,
              error: 'Invalid conversation ID format',
            });
          }
          return;
        }

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
          if (typeof callback === 'function') {
            return callback({
              success: false,
              error: 'Conversation not found',
            });
          }
          return;
        }

        const isParticipant = conversation.participants.some(
          (p) => p.toString() === user._id.toString()
        );

        if (!isParticipant) {
          if (typeof callback === 'function') {
            return callback({
              success: false,
              error: 'Unauthorized: You are not a participant in this conversation',
            });
          }
          return;
        }

        socket.join(conversationId.toString());

        if (typeof callback === 'function') {
          callback({
            success: true,
            conversationId: conversationId.toString(),
          });
        }
      } catch (err) {
        if (typeof callback === 'function') {
          callback({
            success: false,
            error: err.message,
          });
        }
      }
    });

    /**
     * Send and persist a chat message
     */
    socket.on('send_message', async (data, callback) => {
      try {
        const { conversationId, text, messageType } = data || {};

        if (!conversationId || !mongoose.Types.ObjectId.isValid(conversationId)) {
          if (typeof callback === 'function') {
            return callback({
              success: false,
              error: 'Invalid conversation ID',
            });
          }
          return;
        }

        if (!text || typeof text !== 'string' || text.trim() === '') {
          if (typeof callback === 'function') {
            return callback({
              success: false,
              error: 'Message text cannot be empty',
            });
          }
          return;
        }

        if (text.length > 2000) {
          if (typeof callback === 'function') {
            return callback({
              success: false,
              error: 'Message exceeds maximum length of 2000 characters',
            });
          }
          return;
        }

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
          if (typeof callback === 'function') {
            return callback({
              success: false,
              error: 'Conversation not found',
            });
          }
          return;
        }

        const isParticipant = conversation.participants.some(
          (p) => p.toString() === user._id.toString()
        );

        if (!isParticipant) {
          if (typeof callback === 'function') {
            return callback({
              success: false,
              error: 'Unauthorized to send message to this conversation',
            });
          }
          return;
        }

        // Persist message to database
        const message = await Message.create({
          conversation: conversationId,
          sender: user._id,
          text: text.trim(),
          messageType: messageType || 'text',
        });

        // Update conversation last message timestamp
        conversation.lastMessage = text.trim();
        conversation.lastMessageAt = message.createdAt;
        await conversation.save();

        const messagePayload = {
          id: message._id.toString(),
          conversationId: conversationId.toString(),
          sender: {
            id: user._id.toString(),
            fullName: user.fullName,
            avatar: user.avatar,
          },
          text: message.text,
          messageType: message.messageType,
          createdAt: message.createdAt.toISOString(),
        };

        // Broadcast to other participants in the conversation room
        socket.to(conversationId.toString()).emit('receive_message', messagePayload);

        // Acknowledge back to sender
        if (typeof callback === 'function') {
          callback({
            success: true,
            data: messagePayload,
          });
        } else {
          // If sender did not supply a callback, deliver to sender socket directly
          socket.emit('receive_message', messagePayload);
        }
      } catch (err) {
        if (typeof callback === 'function') {
          callback({
            success: false,
            error: err.message,
          });
        }
      }
    });

    socket.on('disconnect', () => {
      if (process.env.NODE_ENV !== 'test') {
        console.log(`[Socket.IO] User disconnected: ${user.fullName} (${socket.id})`);
      }
    });
  });
}
