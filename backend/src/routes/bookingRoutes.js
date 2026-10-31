import express from 'express';
import { body } from 'express-validator';
import {
  reserveRoom,
  getMyBookings,
  getOwnerBookings,
  getBookingById,
  cancelBooking,
  confirmBooking,
} from '../controllers/bookingController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validateRequest.js';

const router = express.Router();

const reserveValidation = [
  body('roomId')
    .notEmpty()
    .withMessage('Room ID is required')
    .isMongoId()
    .withMessage('Invalid Room ID format'),
  body('bookingType')
    .optional()
    .isIn(['visit', 'tenancy_reservation'])
    .withMessage('Invalid booking type'),
  body('tokenAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Token amount must be a positive number'),
  body('scheduledDate')
    .optional()
    .isISO8601()
    .withMessage('Scheduled date must be a valid date'),
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters'),
  validateRequest,
];

router.post('/reserve', protect, reserveValidation, reserveRoom);
router.get('/my-bookings', protect, getMyBookings);
router.get('/owner-bookings', protect, authorize('owner', 'admin'), getOwnerBookings);
router.get('/:id', protect, getBookingById);
router.patch('/:id/cancel', protect, cancelBooking);
router.patch('/:id/confirm', protect, authorize('owner', 'admin'), confirmBooking);

export default router;
