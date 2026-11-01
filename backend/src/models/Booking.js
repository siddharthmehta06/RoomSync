import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema(
  {
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RoomListing',
      required: [true, 'Room listing reference is required'],
    },
    seeker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Seeker reference is required'],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Listing owner reference is required'],
    },
    bookingType: {
      type: String,
      enum: {
        values: ['visit', 'tenancy_reservation', 'booking_request'],
        message: '{VALUE} is not a valid booking type',
      },
      default: 'booking_request',
    },
    moveInDate: {
      type: Date,
      default: null,
    },
    stayDuration: {
      type: Number,
      default: 6,
      min: [1, 'Duration must be at least 1 month'],
    },
    occupantsCount: {
      type: Number,
      default: 1,
      min: [1, 'Number of occupants must be at least 1'],
    },
    message: {
      type: String,
      trim: true,
      maxlength: [1000, 'Message cannot exceed 1000 characters'],
      default: '',
    },
    scheduledDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      required: [true, 'Booking status is required'],
      enum: {
        values: ['pending', 'accepted', 'confirmed', 'completed', 'cancelled', 'rejected'],
        message: '{VALUE} is not a valid booking status',
      },
      default: 'pending',
    },
    rejectionReason: {
      type: String,
      trim: true,
      default: '',
    },
    agreement: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MutualAgreement',
      default: null,
    },
    tokenAmount: {
      type: Number,
      default: 0,
      min: [0, 'Token amount cannot be negative'],
    },
    paymentId: {
      type: String,
      default: null,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
      default: '',
    },
    reservedUntil: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Concurrency & Synchronization:
// Only one active booking request / tenancy per room in pending/accepted/confirmed state
bookingSchema.index(
  { room: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ['pending', 'accepted', 'confirmed'] } },
  }
);

bookingSchema.index({ seeker: 1, status: 1 });
bookingSchema.index({ owner: 1, status: 1 });
bookingSchema.index({ scheduledDate: 1 });

const Booking = mongoose.model('Booking', bookingSchema);
export default Booking;
