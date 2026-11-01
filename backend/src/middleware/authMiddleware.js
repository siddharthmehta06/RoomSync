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

/**
 * Verified Owner Guard
 * Strictly ensures the user is an owner/admin AND their government identity verification is approved.
 * Unverified owners or seekers cannot publish or modify listings.
 */
export function requireVerifiedOwner(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.',
      error: { code: 'UNAUTHORIZED', message: 'Authentication required.' },
    });
  }

  // Admins always have access
  if (req.user.role === 'admin') {
    return next();
  }

  // Must have role 'owner'
  if (req.user.role !== 'owner') {
    return res.status(403).json({
      success: false,
      message: 'Access restricted to property owners only. Room Seekers cannot publish or manage listings.',
      error: {
        code: 'ROLE_FORBIDDEN',
        message: 'Room Seekers cannot publish or manage room listings.',
      },
    });
  }

  // Must have verified owner identity
  if (req.user.ownerVerificationStatus !== 'Verified') {
    return res.status(403).json({
      success: false,
      message: 'Government identity verification required. Please verify your identity before publishing or managing room listings.',
      error: {
        code: 'OWNER_NOT_VERIFIED',
        status: req.user.ownerVerificationStatus || 'Not Started',
        message: 'Identity verification is mandatory for room owners to prevent rental fraud.',
      },
    });
  }

  next();
}

/**
 * Optional authentication middleware - populates req.user if valid token exists,
 * but allows unauthenticated requests to proceed.
 */
export async function optionalAuth(req, res, next) {
  let token;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    return next();
  }

  try {
    const secret = process.env.JWT_SECRET;
    if (secret) {
      const decoded = jwt.verify(token, secret);
      const user = await User.findById(decoded.id).select('-password');
      if (user) {
        req.user = user;
      }
    }
  } catch (error) {
    // Silently proceed for optional auth if token is invalid or expired
  }

  next();
}
