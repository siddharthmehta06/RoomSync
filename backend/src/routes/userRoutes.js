import express from 'express';
import { body } from 'express-validator';
import { getProfile, updateProfile } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validateRequest.js';

const router = express.Router();

const updateProfileValidation = [
  body('fullName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 80 })
    .withMessage('Full name must be between 2 and 80 characters'),
  body('phone')
    .optional()
    .trim()
    .matches(/^[0-9]{10}$/)
    .withMessage('Phone number must be a valid 10-digit number'),
  body('occupation')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Occupation cannot exceed 100 characters'),
  body('company')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Company cannot exceed 100 characters'),
  body('city')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('City cannot exceed 50 characters'),
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio cannot exceed 500 characters'),
  validateRequest,
];

router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfileValidation, updateProfile);

export default router;
