import express from 'express';
import { body } from 'express-validator';
import {
  getAgreementById,
  getAgreementByBooking,
  signAgreement,
  downloadAgreementPDF,
} from '../controllers/agreementController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validateRequest.js';

const router = express.Router();

router.get('/:id', protect, getAgreementById);
router.get('/booking/:bookingId', protect, getAgreementByBooking);
router.post(
  '/:id/sign',
  protect,
  [
    body('accepted')
      .isBoolean()
      .custom((val) => val === true)
      .withMessage('You must review and accept the agreement terms.'),
    validateRequest,
  ],
  signAgreement
);
router.get('/:id/pdf', protect, downloadAgreementPDF);

export default router;

