import jwt from 'jsonwebtoken';

/**
 * Generate a signed JWT for an authenticated user
 * @param {Object} user - User document containing _id and role
 * @returns {string} Signed JWT token
 */
export function generateToken(user) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not defined');
  }

  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

  return jwt.sign(
    {
      id: user._id ? user._id.toString() : user.id,
      role: user.role || 'seeker',
    },
    secret,
    {
      expiresIn,
    }
  );
}
