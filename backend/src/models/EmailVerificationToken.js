import mongoose from 'mongoose';

/**
 * EmailVerificationToken Schema
 * 
 * Stores cryptographically secure SHA-256 hashed email verification tokens.
 * Plaintext tokens are never persisted in the database.
 * 
 * Expiry: 24 hours with automatic MongoDB TTL index cleanup.
 * Single-use: isUsed flag with atomic findOneAndUpdate consumption.
 */
const emailVerificationTokenSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required for verification token'],
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

// Compound index for token lookup
emailVerificationTokenSchema.index({ hashedToken: 1, isUsed: 1 });

// TTL index to automatically purge records 48 hours after expiration
emailVerificationTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 172800 });

const EmailVerificationToken = mongoose.model(
  'EmailVerificationToken',
  emailVerificationTokenSchema
);

export default EmailVerificationToken;
