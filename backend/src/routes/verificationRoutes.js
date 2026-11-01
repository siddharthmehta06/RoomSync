import express from 'express';
import { body } from 'express-validator';
import {
  submitVerification,
  getMyVerificationStatus,
  becomeOwner,
  getPendingVerifications,
  reviewVerification,
} from '../controllers/verificationController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validateRequest.js';

const router = express.Router();

const submitValidation = [
  body('legalFullName')
    .trim()
    .notEmpty()
    .withMessage('Full legal name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Legal name must be between 2 and 100 characters'),
  body('currentAddress')
    .trim()
    .notEmpty()
    .withMessage('Current address is required')
    .isLength({ min: 10, max: 300 })
    .withMessage('Address must be at least 10 characters'),
  body('idDocumentType')
    .notEmpty()
    .withMessage('Identity document type is required')
    .customSanitizer((val) => {
      if (val === 'Aadhaar' || val === 'Aadhaar Card') return 'Aadhaar_Virtual_ID_Masked';
      return val;
    })
    .isIn([
      'Aadhaar',
      'Aadhaar_Virtual_ID_Masked',
      'Passport',
      'Voter_ID',
      'Driving_License',
    ])
    .withMessage('Invalid document type'),
  body('idNumber')
    .trim()
    .notEmpty()
    .withMessage('Document identification number is required'),
  body('consentGiven')
    .custom((val, { req }) => {
      return val === true || req.body.explicitConsent === true;
    })
    .withMessage('Explicit consent is required for identity verification'),
  validateRequest,
];

router.post('/submit', protect, submitValidation, submitVerification);
router.get('/my-status', protect, getMyVerificationStatus);
router.get('/me', protect, getMyVerificationStatus);
router.post('/become-owner', protect, becomeOwner);

// Admin / Safety Reviewer routes
router.get('/admin/pending', protect, authorize('admin'), getPendingVerifications);
router.patch('/admin/:id/review', protect, authorize('admin'), reviewVerification);

export default router;

