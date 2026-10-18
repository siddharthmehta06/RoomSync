import express from 'express';
import { body } from 'express-validator';
import {
  getPreferences,
  savePreferences,
  validatePreferences,
} from '../controllers/preferenceController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validateRequest.js';

const router = express.Router();

const preferenceValidationRules = [
  body('hardConstraints.budgetCeiling')
    .optional()
    .isInt({ min: 1000 })
    .withMessage('Budget ceiling must be an integer of at least ₹1,000'),
  body('hardConstraints.maxDeposit')
    .optional({ nullable: true })
    .isInt({ min: 0 })
    .withMessage('Max deposit must be a non-negative integer'),
  body('hardConstraints.dietaryRule')
    .optional()
    .isIn(['Pure-Veg', 'Veg-Only Flat', 'Flexible', 'Any'])
    .withMessage('Invalid dietary rule'),
  body('hardConstraints.smokingPolicy')
    .optional()
    .isIn(['Strictly Non-Smoking', 'Balcony Only', 'Flexible'])
    .withMessage('Invalid smoking policy'),
  body('hardConstraints.alcoholPolicy')
    .optional()
    .isIn(['Teetotaler', 'Moderate', 'Flexible'])
    .withMessage('Invalid alcohol policy'),
  body('hardConstraints.petPolicy')
    .optional()
    .isIn(['Strictly No Pets', 'Pet-Friendly', 'Has Pet', 'Flexible'])
    .withMessage('Invalid pet policy'),
  body('flexiblePreferences.sleepSchedule')
    .optional()
    .isFloat({ min: 0.0, max: 23.5 })
    .withMessage('Sleep schedule must be a decimal hour between 0.0 and 23.5'),
  body('flexiblePreferences.wakeSchedule')
    .optional()
    .isFloat({ min: 0.0, max: 23.5 })
    .withMessage('Wake schedule must be a decimal hour between 0.0 and 23.5'),
  body('flexiblePreferences.cleanliness')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Cleanliness standard must be between 1 and 5'),
  body('flexiblePreferences.noiseTolerance')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Noise tolerance must be between 1 and 5'),
  body('flexiblePreferences.guestPolicy')
    .optional()
    .isIn(['Rare', 'Occasional', 'Frequent'])
    .withMessage('Invalid guest policy'),
  body('flexiblePreferences.overnightGuests')
    .optional()
    .isIn(['Not Allowed', 'With Notice', 'Frequent'])
    .withMessage('Invalid overnight guest policy'),
  body('flexiblePreferences.socialPreference')
    .optional()
    .isIn(['Quiet Retreat', 'Balanced', 'Social Hub'])
    .withMessage('Invalid social preference'),
  body('flexiblePreferences.wfhDays')
    .optional()
    .isInt({ min: 0, max: 7 })
    .withMessage('WFH days must be between 0 and 7'),
  body('flexiblePreferences.cookingHabit')
    .optional()
    .isIn(['Daily', 'Occasional', 'Tiffin / Delivery'])
    .withMessage('Invalid cooking habit'),
  body('flexiblePreferences.foodSharing')
    .optional()
    .isIn(['Separate Groceries', 'Shared Staples', 'Full Communal'])
    .withMessage('Invalid food sharing preference'),
  body('flexiblePreferences.personalSpace')
    .optional()
    .isIn(['High', 'Balanced', 'Communal'])
    .withMessage('Invalid personal space preference'),
  body('flexiblePreferences.rulesStrictness')
    .optional()
    .isIn(['Strict Curfew', 'Moderate', 'Self-Managed'])
    .withMessage('Invalid house rules strictness'),
  body('importanceWeights.budget')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Importance weight for budget must be between 1 and 5'),
  body('importanceWeights.diet')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Importance weight for diet must be between 1 and 5'),
  body('importanceWeights.sleepSync')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Importance weight for sleep sync must be between 1 and 5'),
  body('importanceWeights.cleanliness')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Importance weight for cleanliness must be between 1 and 5'),
  body('importanceWeights.noise')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Importance weight for noise must be between 1 and 5'),
  body('importanceWeights.guests')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Importance weight for guests must be between 1 and 5'),
  body('importanceWeights.wfh')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Importance weight for WFH must be between 1 and 5'),
  validateRequest,
];

router.get('/', protect, getPreferences);
router.put('/', protect, preferenceValidationRules, savePreferences);
router.post('/validate', preferenceValidationRules, validatePreferences);

export default router;
