import express from 'express';
import { body } from 'express-validator';
import {
  getConversations,
  createConversation,
  getMessages,
  sendMessage,
} from '../controllers/conversationController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validateRequest.js';

const router = express.Router();

const createConversationValidation = [
  body('recipientId')
    .optional()
    .isMongoId()
    .withMessage('Invalid recipient ID format'),
  body('roomId')
    .optional()
    .isMongoId()
    .withMessage('Invalid room ID format'),
  body().custom((value) => {
    if (!value.recipientId && !value.roomId) {
      throw new Error('Either recipientId or roomId must be provided to start a conversation');
    }
    return true;
  }),
  validateRequest,
];

const sendMessageValidation = [
  body('text')
    .trim()
    .notEmpty()
    .withMessage('Message text cannot be empty')
    .isLength({ max: 2000 })
    .withMessage('Message text cannot exceed 2000 characters'),
  body('messageType')
    .optional()
    .isIn(['text', 'visit_invite', 'system_event'])
    .withMessage('Invalid message type'),
  validateRequest,
];

router.get('/', protect, getConversations);
router.post('/', protect, createConversationValidation, createConversation);
router.get('/:id/messages', protect, getMessages);
router.post('/:id/messages', protect, sendMessageValidation, sendMessage);

export default router;
