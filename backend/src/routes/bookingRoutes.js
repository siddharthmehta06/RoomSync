import express from 'express';
import { body } from 'express-validator';
import {
  reserveRoom,
  respondBookingRequest,
  getMyBookings,
  getOwnerBookings,
  getBookingById,
  cancelBooking,
  confirmBooking,
} from '../controllers/bookingController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validateRequest.js';

const router = express.Router();

const bookingRequestValidation = [
  body('roomId')
    .notEmpty()
    .withMessage('Room ID is required')
    .isMongoId()
    .withMessage('Invalid Room ID format'),
  body('moveInDate')
    .optional()
    .isISO8601()
    .withMessage('Move-in date must be a valid date'),
  body('stayDuration')
    .optional()
    .isInt({ min: 1, max: 36 })
    .withMessage('Stay duration must be between 1 and 36 months'),
  body('occupantsCount')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Occupants count must be at least 1'),
  body('message')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Message cannot exceed 1000 characters'),
  validateRequest,
];

// Both /request and legacy /reserve point to request creation
router.post('/request', protect, bookingRequestValidation, reserveRoom);
router.post('/reserve', protect, bookingRequestValidation, reserveRoom);

router.get('/my-bookings', protect, getMyBookings);
router.get('/owner-bookings', protect, authorize('owner', 'admin'), getOwnerBookings);
router.get('/:id', protect, getBookingById);
router.patch(
  '/:id/respond',
  protect,
  authorize('owner', 'admin'),
  [
    body('action').isIn(['accept', 'reject']).withMessage('Action must be accept or reject'),
    validateRequest,
  ],
  respondBookingRequest
);
router.patch('/:id/cancel', protect, cancelBooking);
router.patch('/:id/confirm', protect, authorize('owner', 'admin'), confirmBooking);

export default router;
