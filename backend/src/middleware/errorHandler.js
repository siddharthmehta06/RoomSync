/**
 * Centralized Express Error Handler
 */
export function errorHandler(err, req, res, next) {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  console.error(`[API Error] ${req.method} ${req.originalUrl} - ${err.message}`);

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
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
