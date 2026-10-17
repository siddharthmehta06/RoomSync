/**
 * Centralized Express Error Handler
 * Adheres to the RoomSync standard error contract while maintaining
 * compatibility with existing health/fallback checks.
 */
export function errorHandler(err, req, res, next) {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let errorCode = 'INTERNAL_SERVER_ERROR';
  let message = err.message || 'Internal Server Error';
  let details = [];

  // Handle malformed JSON body
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    statusCode = 400;
    errorCode = 'BAD_REQUEST';
    message = 'Malformed JSON in request body';
  }

  // Handle Mongoose Validation Errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
    message = 'Validation failed for one or more fields';
    details = Object.values(err.errors || {}).map((e) => ({
      field: e.path,
      message: e.message,
    }));
  }

  // Handle Mongoose CastError (e.g. invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    errorCode = 'BAD_REQUEST';
    message = `Invalid format for field '${err.path}'`;
  }

  // Handle MongoDB Duplicate Key (E11000)
  if (err.code === 11000) {
    statusCode = 409;
    const duplicatedField = Object.keys(err.keyValue || {})[0] || 'field';
    errorCode =
      duplicatedField === 'email' ? 'EMAIL_ALREADY_EXISTS' : 'CONFLICT';
    message = `A record with this ${duplicatedField} already exists`;
    details = [
      {
        field: duplicatedField,
        message: `${duplicatedField} '${err.keyValue[duplicatedField]}' is already registered`,
      },
    ];
  }

  // Handle JWT Errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    errorCode = 'INVALID_TOKEN';
    message = 'Invalid authentication token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    errorCode = 'TOKEN_EXPIRED';
    message = 'Authentication token has expired';
  }

  // Only log detailed errors outside of test environment
  if (process.env.NODE_ENV !== 'test') {
    console.error(`[API Error] ${req.method} ${req.originalUrl} - ${message}`);
  }

  res.status(statusCode).json({
    success: false,
    message,
    error: {
      code: errorCode,
      message,
      details,
    },
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
}

/**
 * 404 Route Not Found Handler
 */
export function notFound(req, res, next) {
  const error = new Error(`Resource not found - ${req.originalUrl}`);
  res.status(404);
  next(error);
}
