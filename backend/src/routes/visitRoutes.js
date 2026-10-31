import express from 'express';
import { body } from 'express-validator';
import {
  createVisitRequest,
  getMyVisits,
  updateVisitStatus,
} from '../controllers/visitController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validateRequest.js';

const router = express.Router();

// Validation for creating visit request
const createVisitValidation = [
  body('roomId').notEmpty().withMessage('Room ID is required'),
  body('visitDate').notEmpty().withMessage('Visit date is required'),
  body('visitTime').trim().notEmpty().withMessage('Visit time slot is required'),
  body('message')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Message cannot exceed 500 characters'),
  validateRequest,
];

// Validation for status update
const updateStatusValidation = [
  body('status')
    .notEmpty()
    .isIn(['Accepted', 'Rejected', 'Cancelled'])
    .withMessage('Status must be Accepted, Rejected, or Cancelled'),
  body('ownerResponseNote')
    .optional()
    .trim()
    .isLength({ max: 300 })
    .withMessage('Response note cannot exceed 300 characters'),
  validateRequest,
];

// All visit routes require authentication
router.use(protect);

router.post('/', createVisitValidation, createVisitRequest);
router.get('/my', getMyVisits);
router.patch('/:id/status', updateStatusValidation, updateVisitStatus);

export default router;
