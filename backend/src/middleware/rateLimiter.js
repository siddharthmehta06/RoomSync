/**
 * RoomSync Rate Limiting Middleware
 * 
 * Environment-dependent in-memory sliding window rate limiter designed for
 * security-critical endpoints (forgot-password, reset-password, and email verification).
 * 
 * Behavior:
 * - Production: Strict limits (5 requests per 15 min for forgot-password, 10 for reset-password).
 * - Development: Generous developer-friendly limits (100 requests per 1 min window) to allow
 *   rapid manual and automated testing without connection lockouts.
 * - Test: Deterministic thresholds for unit & integration testing.
 */

const hitMap = new Map();

/**
 * Factory to create rate limiting middleware with environment-aware defaults
 * 
 * @param {object} options
 * @param {number} [options.windowMs] - Sliding window duration in milliseconds
 * @param {number} [options.max] - Maximum permitted requests within the window
 * @param {string} options.message - User-facing message when limit is exceeded
 * @param {string} [options.prefix='rl'] - Cache key prefix
 * @returns {import('express').RequestHandler}
 */
export function createRateLimiter({
  windowMs,
  max,
  message = 'Too many requests. Please try again later.',
  prefix = 'rl',
}) {
  return (req, res, next) => {
    const isProd = process.env.NODE_ENV === 'production';
    const isTest = process.env.NODE_ENV === 'test';

    // Resolve window and max dynamically based on current environment
    const effectiveWindowMs =
      windowMs ??
      (isProd || isTest
        ? 15 * 60 * 1000
        : Number(process.env.RATE_LIMIT_WINDOW_MS) || 60 * 1000); // 1 minute in dev

    const effectiveMax =
      max ??
      (isProd || isTest
        ? (prefix === 'forgot-pwd' ? 5 : 10)
        : Number(process.env.RATE_LIMIT_MAX) || 100); // 100 attempts in dev

    const clientIp =
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      req.ip ||
      'unknown-ip';

    const key = `${prefix}:${clientIp}`;
    const now = Date.now();

    const record = hitMap.get(key) || { count: 0, resetTime: now + effectiveWindowMs };

    if (now > record.resetTime) {
      record.count = 1;
      record.resetTime = now + effectiveWindowMs;
    } else {
      record.count += 1;
    }

    hitMap.set(key, record);

    if (record.count > effectiveMax) {
      const retryAfterSeconds = Math.ceil((record.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfterSeconds);

      return res.status(429).json({
        success: false,
        message,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message,
          retryAfter: retryAfterSeconds,
        },
      });
    }

    next();
  };
}

/**
 * Reset all rate limiting tracking records
 */
export function resetRateLimits() {
  hitMap.clear();
}

// Clear on module import to instantly unblock local development
resetRateLimits();

/** Pre-configured limiter for forgot-password */
export const forgotPasswordLimiter = createRateLimiter({
  message: 'Too many password reset requests from this connection. Please try again after 15 minutes.',
  prefix: 'forgot-pwd',
});

/** Pre-configured limiter for reset-password */
export const resetPasswordLimiter = createRateLimiter({
  message: 'Too many password reset verification attempts. Please try again after 15 minutes.',
  prefix: 'reset-pwd',
});
