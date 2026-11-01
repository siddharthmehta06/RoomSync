import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    fromStatus: {
      type: String,
      required: true,
    },
    toStatus: {
      type: String,
      required: true,
    },
    reason: {
      type: String,
      default: '',
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const ownerVerificationSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Owner reference is required'],
      unique: true,
    },
    status: {
      type: String,
      enum: {
        values: ['Not Started', 'Pending', 'Verified', 'Rejected', 'Requires Resubmission'],
        message: '{VALUE} is not a valid verification status',
      },
      default: 'Not Started',
    },
    legalFullName: {
      type: String,
      required: [true, 'Full legal name matching government document is required'],
      trim: true,
      minlength: [2, 'Legal name must be at least 2 characters'],
      maxlength: [100, 'Legal name cannot exceed 100 characters'],
    },
    verifiedEmail: {
      type: String,
      required: [true, 'Contact email is required'],
      trim: true,
      lowercase: true,
    },
    verifiedPhone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      match: [/^[0-9]{10}$/, 'Phone number must be 10 digits'],
    },
    currentAddress: {
      type: String,
      required: [true, 'Current residential address is required'],
      trim: true,
      minlength: [10, 'Address must be at least 10 characters'],
      maxlength: [300, 'Address cannot exceed 300 characters'],
    },
    idDocumentType: {
      type: String,
      required: [true, 'Identity document type is required'],
      enum: {
        values: [
          'Aadhaar_Virtual_ID_Masked',
          'Passport',
          'Voter_ID',
          'Driving_License',
        ],
        message: '{VALUE} is not a valid identification document type',
      },
    },
    maskedIdNumber: {
      type: String,
      required: [true, 'Masked document identifier is required'],
      trim: true,
    },
    documentUrl: {
      type: String,
      default: null,
      select: false, // Strictly not exposed in normal queries to protect privacy
    },
    consentGiven: {
      type: Boolean,
      required: [true, 'Consent for identity verification is mandatory'],
      validate: {
        validator: (v) => v === true,
        message: 'Explicit consent must be provided for identity verification',
      },
    },
    consentTimestamp: {
      type: Date,
      default: Date.now,
    },
    reviewerNotes: {
      type: String,
      trim: true,
      default: '',
      maxlength: [500, 'Reviewer notes cannot exceed 500 characters'],
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    auditLogs: [auditLogSchema],
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret.__v;
        delete ret.documentUrl; // Redact document URL from user-facing responses
        return ret;
      },
    },
  }
);

ownerVerificationSchema.index({ status: 1 });
ownerVerificationSchema.index({ createdAt: -1 });

const OwnerVerification = mongoose.model('OwnerVerification', ownerVerificationSchema);
export default OwnerVerification;

