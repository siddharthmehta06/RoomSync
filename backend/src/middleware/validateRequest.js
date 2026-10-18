import { validationResult } from 'express-validator';

/**
 * Validates request data using express-validator rules and formats errors
 * matching the standard RoomSync API error envelope.
 */
export function validateRequest(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedDetails = errors.array().map((err) => ({
      field: err.path || err.param,
      message: err.msg,
    }));

    return res.status(400).json({
      success: false,
      message: 'The request contains invalid or missing fields.',
      error: {
        code: 'VALIDATION_ERROR',
        message: 'The request contains invalid or missing fields.',
        details: formattedDetails,
      },
    });
  }

  next();
}
