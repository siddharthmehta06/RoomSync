import express from 'express';
import { body } from 'express-validator';
import {
  getRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
  uploadListingImages,
  getMyListings,
  getRoomQuestionnaire,
  updateRoomQuestionnaire,
} from '../controllers/roomController.js';
import { getCompatibilityPreview } from '../controllers/matchController.js';
import { protect, authorize, requireVerifiedOwner, optionalAuth } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { handleListingImageUpload } from '../middleware/uploadMiddleware.js';
import { upsertRoomReview } from '../controllers/roomReviewController.js';

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

// Owner-only endpoints strictly guarded by requireVerifiedOwner
router.post(
  '/upload-images',
  protect,
  authorize('owner', 'admin'),
  requireVerifiedOwner,
  handleListingImageUpload,
  uploadListingImages
);
router.get(
  '/owner/my-listings',
  protect,
  authorize('owner', 'admin'),
  getMyListings
);
router.get('/:id', optionalAuth, getRoomById);
router.get('/:id/questionnaire', optionalAuth, getRoomQuestionnaire);
router.put('/:id/questionnaire', protect, authorize('owner', 'admin'), requireVerifiedOwner, updateRoomQuestionnaire);

router.post(
  '/:id/reviews',
  protect,
  authorize('seeker'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be from 1 to 5.'),
  body('feedback').optional().isString().trim().isLength({ max: 1000 }).withMessage('Feedback cannot exceed 1000 characters.'),
  validateRequest,
  upsertRoomReview
);
router.post(
  '/',
  protect,
  authorize('owner', 'admin'),
  requireVerifiedOwner,
  createRoomValidation,
  createRoom
);
router.post('/:id/compatibility-preview', protect, getCompatibilityPreview);
router.put('/:id', protect, authorize('owner', 'admin'), requireVerifiedOwner, updateRoomValidation, updateRoom);
router.delete('/:id', protect, authorize('owner', 'admin'), requireVerifiedOwner, deleteRoom);

export default router;
