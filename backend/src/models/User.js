import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      minlength: [2, 'Full name must be at least 2 characters'],
      maxlength: [80, 'Full name cannot exceed 80 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Prevents password from being returned in normal queries
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      match: [/^[0-9]{10}$/, 'Phone number must be a valid 10-digit number'],
    },
    role: {
      type: String,
      enum: {
        values: ['seeker', 'owner', 'admin'],
        message: '{VALUE} is not a valid role',
      },
      default: 'seeker',
    },
    avatar: {
      type: String,
      default: null,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationMethod: {
      type: String,
      enum: {
        values: ['Govt_ID', 'Work_Email', 'College_ID', null],
        message: '{VALUE} is not a valid verification method',
      },
      default: null,
    },
    ownerVerificationStatus: {
      type: String,
      enum: {
        values: ['Not Started', 'Pending', 'Verified', 'Rejected', 'Requires Resubmission'],
        message: '{VALUE} is not a valid owner verification status',
      },
      default: 'Not Started',
    },
    occupation: {
      type: String,
      trim: true,
      default: '',
      maxlength: [100, 'Occupation cannot exceed 100 characters'],
    },
    company: {
      type: String,
      trim: true,
      default: '',
      maxlength: [100, 'Company cannot exceed 100 characters'],
    },
    city: {
      type: String,
      trim: true,
      default: 'Mumbai',
      maxlength: [50, 'City cannot exceed 50 characters'],
    },
    bio: {
      type: String,
      trim: true,
      default: '',
      maxlength: [500, 'Bio cannot exceed 500 characters'],
    },
    hasCompletedOnboarding: {
      type: Boolean,
      default: false,
    },
    resetPasswordToken: {
      type: String,
      select: false,
    },
    resetPasswordExpire: {
      type: Date,
      select: false,
    },
    passwordResetOTP: {
      type: String,
      select: false,
    },
    passwordResetOTPExpires: {
      type: Date,
      select: false,
    },
    passwordResetAttempts: {
      type: Number,
      default: 0,
      select: false,
    },
    passwordResetCooldown: {
      type: Date,
      select: false,
    },
    tempResetToken: {
      type: String,
      select: false,
    },
    tempResetTokenExpires: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret.password;
        delete ret.passwordResetOTP;
        delete ret.tempResetToken;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes
userSchema.index({ phone: 1 });
userSchema.index({ role: 1 });
userSchema.index({ ownerVerificationStatus: 1 });

/**
 * Pre-save middleware to hash password before persisting
 */
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

/**
 * Instance method to compare input password with stored bcrypt hash
 */
userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) {
    return false;
  }
  return await bcrypt.compare(enteredPassword, this.password);
};

/**
 * Generate cryptographically secure random token (legacy link method)
 */
userSchema.methods.getResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(20).toString('hex');
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
  return resetToken;
};

/**
 * Generate 6-digit random numeric OTP, hash it with SHA-256 for secure DB storage,
 * and set 5-minute expiry and 60-second cooldown.
 */
userSchema.methods.createPasswordResetOTP = function () {
  // Generate random 6-digit number (100000 - 999999)
  const otp = crypto.randomInt(100000, 1000000).toString();

  // Hash OTP for secure database persistence
  this.passwordResetOTP = crypto
    .createHash('sha256')
    .update(otp)
    .digest('hex');

  // OTP valid for strictly 5 minutes
  this.passwordResetOTPExpires = Date.now() + 5 * 60 * 1000;
  // Reset verification attempts
  this.passwordResetAttempts = 0;
  // 60-second resend cooldown
  this.passwordResetCooldown = Date.now() + 60 * 1000;

  return otp;
};

const User = mongoose.model('User', userSchema);
export default User;
