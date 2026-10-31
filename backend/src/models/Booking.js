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
      required: [true, 'Booking type is required'],
      enum: {
        values: ['visit', 'tenancy_reservation'],
        message: '{VALUE} is not a valid booking type',
      },
      default: 'tenancy_reservation',
    },
    scheduledDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      required: [true, 'Booking status is required'],
      enum: {
        values: ['pending', 'confirmed', 'completed', 'cancelled', 'rejected'],
        message: '{VALUE} is not a valid booking status',
      },
      default: 'pending',
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
// Unique partial compound index ensuring that for any given room,
// only ONE active reservation ('pending' or 'confirmed') can exist at any given time.
// Concurrent inserts will collide on this index at the database storage engine level,
// generating an E11000 duplicate key error and preventing duplicate bookings.
bookingSchema.index(
  { room: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ['pending', 'confirmed'] } },
  }
);

bookingSchema.index({ seeker: 1, status: 1 });
bookingSchema.index({ owner: 1, status: 1 });
bookingSchema.index({ scheduledDate: 1 });

const Booking = mongoose.model('Booking', bookingSchema);
export default Booking;
