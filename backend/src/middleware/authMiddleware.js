import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Protect routes - Verifies JWT from Authorization header and attaches user to request
 */
export async function protect(req, res, next) {
  let token;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No authentication token provided.',
      error: {
        code: 'UNAUTHORIZED',
        message: 'Access denied. No authentication token provided.',
        details: [],
      },
    });
  }

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is not configured on the server');
    }

    const decoded = jwt.verify(token, secret);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'The user belonging to this token no longer exists.',
        error: {
          code: 'USER_NOT_FOUND',
          message: 'The user belonging to this token no longer exists.',
          details: [],
        },
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Session expired. Please log in again.',
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Session expired. Please log in again.',
          details: [],
        },
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid authentication token.',
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid authentication token.',
        details: [],
      },
    });
  }
}

/**
 * Role-based authorization guard
 * @param  {...string} roles - Permitted roles (e.g. 'owner', 'admin')
 */
export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to perform this action.',
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to perform this action.',
          details: [],
        },
      });
    }
    next();
  };
}
