import express from 'express';
import { body } from 'express-validator';
import {
  getRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
} from '../controllers/roomController.js';
import { getCompatibilityPreview } from '../controllers/matchController.js';
import { protect, authorize, optionalAuth } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validateRequest.js';

const router = express.Router();

const createRoomValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 10, max: 120 })
    .withMessage('Title must be between 10 and 120 characters'),
  body('locality')
    .trim()
    .notEmpty()
    .withMessage('Locality is required'),
  body('city')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('City cannot be empty'),
  body('pinCode')
    .trim()
    .notEmpty()
    .withMessage('PIN code is required')
    .matches(/^[0-9]{6}$/)
    .withMessage('PIN code must be a 6-digit number'),
  body('rent')
    .notEmpty()
    .withMessage('Rent is required')
    .isFloat({ min: 0 })
    .withMessage('Rent must be a positive number'),
  body('deposit')
    .notEmpty()
    .withMessage('Deposit is required')
    .isFloat({ min: 0 })
    .withMessage('Deposit must be a positive number'),
  body('roomType')
    .notEmpty()
    .withMessage('Room type is required')
    .isIn([
      'Private Room with Attached Bath',
      'Private Room (Shared Bath)',
      'Shared Room',
    ])
    .withMessage('Invalid room type'),
  body('furnishing')
    .notEmpty()
    .withMessage('Furnishing tier is required')
    .isIn(['Fully Furnished', 'Semi-Furnished', 'Unfurnished'])
    .withMessage('Invalid furnishing tier'),
  body('availableFrom')
    .notEmpty()
    .withMessage('Available from date is required')
    .isISO8601()
    .withMessage('Available from date must be a valid date'),
  body('minStayMonths')
    .optional()
    .isInt({ min: 1, max: 36 })
    .withMessage('Minimum stay must be between 1 and 36 months'),
  body('livingConditions.foodPreference')
    .optional()
    .isIn([
      'Pure Vegetarian',
      'Eggetarian / Flexible Non-veg',
      'Non-Veg Welcome',
    ])
    .withMessage('Invalid food preference rule'),
  body('livingConditions.smoking')
    .optional()
    .isIn(['Strictly Non-Smoking', 'Balcony Only', 'Allowed'])
    .withMessage('Invalid smoking rule'),
  body('livingConditions.alcohol')
    .optional()
    .isIn(['Teetotaler', 'Social Drinking OK', 'Allowed'])
    .withMessage('Invalid alcohol rule'),
  body('livingConditions.sleepSchedule')
    .optional()
    .isFloat({ min: 0.0, max: 23.5 })
    .withMessage('Sleep schedule hour must be between 0.0 and 23.5'),
  body('livingConditions.wakeSchedule')
    .optional()
    .isFloat({ min: 0.0, max: 23.5 })
    .withMessage('Wake schedule hour must be between 0.0 and 23.5'),
  body('livingConditions.cleanliness')
    .optional()
    .isFloat({ min: 1.0, max: 5.0 })
    .withMessage('Cleanliness rating must be between 1.0 and 5.0'),
  body('livingConditions.noiseTolerance')
    .optional()
    .isFloat({ min: 1.0, max: 5.0 })
    .withMessage('Noise tolerance must be between 1.0 and 5.0'),
  validateRequest,
];

const updateRoomValidation = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 10, max: 120 })
    .withMessage('Title must be between 10 and 120 characters'),
  body('pinCode')
    .optional()
    .trim()
    .matches(/^[0-9]{6}$/)
    .withMessage('PIN code must be a 6-digit number'),
  body('rent')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Rent must be a positive number'),
  body('deposit')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Deposit must be a positive number'),
  body('roomType')
    .optional()
    .isIn([
      'Private Room with Attached Bath',
      'Private Room (Shared Bath)',
      'Shared Room',
    ])
    .withMessage('Invalid room type'),
  body('furnishing')
    .optional()
    .isIn(['Fully Furnished', 'Semi-Furnished', 'Unfurnished'])
    .withMessage('Invalid furnishing tier'),
  body('minStayMonths')
    .optional()
    .isInt({ min: 1, max: 36 })
    .withMessage('Minimum stay must be between 1 and 36 months'),
  validateRequest,
];

router.get('/', getRooms);
router.get('/:id', optionalAuth, getRoomById);
router.post(
  '/',
  protect,
  authorize('owner', 'admin'),
  createRoomValidation,
  createRoom
);
router.post('/:id/compatibility-preview', protect, getCompatibilityPreview);
router.put('/:id', protect, updateRoomValidation, updateRoom);
router.delete('/:id', protect, deleteRoom);

export default router;
