import mongoose from 'mongoose';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import RoomListing from '../models/RoomListing.js';

/**
 * @desc    Get all conversations for the authenticated user
 * @route   GET /api/conversations
 * @access  Private
 */
export async function getConversations(req, res, next) {
  try {
    const userId = req.user._id;

    const conversations = await Conversation.find({
      participants: userId,
    })
      .populate('participants', 'fullName role avatar isVerified phone occupation company')
      .populate('room', 'title locality city rent deposit images')
      .sort({ lastMessageAt: -1 });

    res.status(200).json({
      success: true,
      data: conversations,
      meta: {
        total: conversations.length,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @desc    Create a new conversation or get existing one
 * @route   POST /api/conversations
 * @access  Private
 */
export async function createConversation(req, res, next) {
  try {
    const { recipientId, roomId } = req.body;
    let targetRecipientId = recipientId;
    let targetRoom = null;

    if (roomId) {
      if (!mongoose.Types.ObjectId.isValid(roomId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid room ID format.',
          error: {
            code: 'INVALID_ROOM',
            message: 'Invalid room ID format.',
            details: [{ field: 'roomId', message: 'Room ID must be a valid ObjectId' }],
          },
        });
      }

      targetRoom = await RoomListing.findById(roomId);
      if (!targetRoom) {
        return res.status(404).json({
          success: false,
          message: 'Room listing not found.',
          error: {
            code: 'ROOM_NOT_FOUND',
            message: 'Room listing not found.',
            details: [],
          },
        });
      }

      if (targetRoom.status !== 'active') {
        return res.status(400).json({
          success: false,
          message: 'This room listing is currently not available for enquiries.',
          error: {
            code: 'ROOM_UNAVAILABLE',
            message: 'This room listing is currently not available for enquiries.',
            details: [],
          },
        });
      }

      // If recipientId is not supplied, use the room's owner ID
      if (!targetRecipientId) {
        targetRecipientId = targetRoom.owner;
      }
    }

    if (!targetRecipientId || !mongoose.Types.ObjectId.isValid(targetRecipientId)) {
      return res.status(400).json({
        success: false,
        message: 'A valid recipient ID is required.',
        error: {
          code: 'INVALID_RECIPIENT',
          message: 'A valid recipient ID is required.',
          details: [{ field: 'recipientId', message: 'Invalid recipient ID' }],
        },
      });
    }

    if (targetRecipientId.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot start an enquiry on your own property or conversation with yourself.',
        error: {
          code: 'SELF_CONVERSATION',
          message: 'Cannot start an enquiry on your own property or conversation with yourself.',
          details: [],
        },
      });
    }

    const recipient = await User.findById(targetRecipientId);
    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: 'Recipient user not found.',
        error: {
          code: 'USER_NOT_FOUND',
          message: 'Recipient user not found.',
          details: [],
        },
      });
    }

    // Check if conversation already exists between these participants for this room
    const query = {
      participants: { $all: [req.user._id, targetRecipientId], $size: 2 },
    };
    if (targetRoom) {
      query.room = targetRoom._id;
    }

    let conversation = await Conversation.findOne(query)
      .populate('participants', 'fullName role avatar isVerified phone occupation company')
      .populate('room', 'title locality city rent deposit images');

    if (conversation) {
      return res.status(200).json({
        success: true,
        data: conversation,
        message: 'Existing conversation retrieved.',
      });
    }

    // Create new conversation
    conversation = await Conversation.create({
      participants: [req.user._id, targetRecipientId],
      room: targetRoom ? targetRoom._id : null,
      lastMessage: '',
      lastMessageAt: new Date(),
    });

    await conversation.populate([
      { path: 'participants', select: 'fullName role avatar isVerified phone occupation company' },
      { path: 'room', select: 'title locality city rent deposit images' },
    ]);

    res.status(201).json({
      success: true,
      data: conversation,
      message: 'Conversation initialized successfully.',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @desc    Get paginated message history for a conversation
 * @route   GET /api/conversations/:id/messages
 * @access  Private (Participants only)
 */
export async function getMessages(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found.',
        error: {
          code: 'CONVERSATION_NOT_FOUND',
          message: 'Conversation not found.',
          details: [],
        },
      });
    }

    const conversation = await Conversation.findById(id);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found.',
        error: {
          code: 'CONVERSATION_NOT_FOUND',
          message: 'Conversation not found.',
          details: [],
        },
      });
    }

    // Verify authenticated user is a participant
    const isParticipant = conversation.participants.some(
      (p) => p.toString() === req.user._id.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view messages in this conversation.',
        error: {
          code: 'FORBIDDEN',
          message: 'You are not authorized to view messages in this conversation.',
          details: [],
        },
      });
    }

    // Pagination
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));
    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      Message.find({ conversation: id })
        .populate('sender', 'fullName avatar role isVerified')
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(limit),
      Message.countDocuments({ conversation: id }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    res.status(200).json({
      success: true,
      data: messages,
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @desc    Send a message in a conversation (REST fallback)
 * @route   POST /api/conversations/:id/messages
 * @access  Private (Participants only)
 */
export async function sendMessage(req, res, next) {
  try {
    const { id } = req.params;
    const { text, messageType } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found.',
        error: {
          code: 'CONVERSATION_NOT_FOUND',
          message: 'Conversation not found.',
          details: [],
        },
      });
    }

    const conversation = await Conversation.findById(id);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found.',
        error: {
          code: 'CONVERSATION_NOT_FOUND',
          message: 'Conversation not found.',
          details: [],
        },
      });
    }

    // Verify participant
    const isParticipant = conversation.participants.some(
      (p) => p.toString() === req.user._id.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to send messages in this conversation.',
        error: {
          code: 'FORBIDDEN',
          message: 'You are not authorized to send messages in this conversation.',
          details: [],
        },
      });
    }

    if (!text || typeof text !== 'string' || text.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Message text cannot be empty.',
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Message text cannot be empty.',
          details: [{ field: 'text', message: 'Message text is required' }],
        },
      });
    }

    if (text.length > 2000) {
      return res.status(400).json({
        success: false,
        message: 'Message text exceeds maximum length of 2000 characters.',
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Message text cannot exceed 2000 characters.',
          details: [{ field: 'text', message: 'Exceeds 2000 characters limit' }],
        },
      });
    }

    const message = await Message.create({
      conversation: id,
      sender: req.user._id,
      text: text.trim(),
      messageType: messageType || 'text',
    });

    await message.populate('sender', 'fullName avatar role isVerified');

    // Update conversation metadata
    conversation.lastMessage = text.trim();
    conversation.lastMessageAt = message.createdAt;
    await conversation.save();

    // Broadcast through Socket.IO if attached to the express app
    const io = req.app.get('io');
    if (io) {
      io.to(id.toString()).emit('receive_message', {
        id: message._id.toString(),
        conversationId: id.toString(),
        sender: {
          id: req.user._id.toString(),
          fullName: req.user.fullName,
          avatar: req.user.avatar,
        },
        text: message.text,
        messageType: message.messageType,
        createdAt: message.createdAt.toISOString(),
      });
    }

    res.status(201).json({
      success: true,
      message: 'Message sent successfully.',
      data: message,
    });
  } catch (error) {
    next(error);
  }
}
