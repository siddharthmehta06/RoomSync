import mongoose from 'mongoose';

/**
 * PasswordResetToken Schema
 * 
 * Stores cryptographically secure SHA-256 hashed password reset tokens.
 * Plaintext tokens are never persisted to the database.
 * 
 * Single-use guarantee: isUsed flag and atomic findOneAndUpdate operations.
 * Expiry: 15 minutes, with MongoDB TTL index automatic cleanup after expiration window.
 */
const passwordResetTokenSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required for password reset token'],
      index: true,
    },
    hashedToken: {
      type: String,
      required: [true, 'Hashed token string is required'],
      unique: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: [true, 'Expiration timestamp is required'],
    },
    isUsed: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: true },
  }
);

// Compound index for high-performance lookup of active tokens
passwordResetTokenSchema.index({ hashedToken: 1, isUsed: 1, expiresAt: 1 });

// TTL index to automatically purge records 24 hours after expiration
passwordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 86400 });

const PasswordResetToken = mongoose.model('PasswordResetToken', passwordResetTokenSchema);

export default PasswordResetToken;
