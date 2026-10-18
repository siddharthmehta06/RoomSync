import express from 'express';
import { query } from 'express-validator';
import { getMatches } from '../controllers/matchController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validateRequest.js';

const router = express.Router();

const matchesQueryValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer starting at 1'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be an integer between 1 and 100'),
  query('minScore')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Minimum score must be an integer between 0 and 100'),
  query('city')
    .optional()
    .trim(),
  query('sortBy')
    .optional()
    .isIn([
      'ranking_desc',
      'topsis_rank',
      'compatibility_desc',
      'rent_asc',
      'rent_desc',
      'date_desc',
    ])
    .withMessage(
      'Invalid sortBy parameter. Allowed values: ranking_desc, topsis_rank, compatibility_desc, rent_asc, rent_desc, date_desc'
    ),
  query('includeDisqualified')
    .optional()
    .isIn(['true', 'false', '1', '0'])
    .withMessage('includeDisqualified must be a boolean (true, false, 1, 0)'),
  validateRequest,
];

// GET /api/matches - Computes and returns eligible room listings evaluated by 22-factor engine
router.get('/', protect, matchesQueryValidation, getMatches);

export default router;
