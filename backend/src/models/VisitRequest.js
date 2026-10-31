import mongoose from 'mongoose';

const visitRequestSchema = new mongoose.Schema(
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
    visitDate: {
      type: Date,
      required: [true, 'Visit date is required'],
      validate: {
        validator: function (val) {
          if (!val) return false;
          // Must not be in the past (allow today starting midnight)
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return new Date(val).getTime() >= today.getTime();
        },
        message: 'Visit date cannot be in the past',
      },
    },
    visitTime: {
      type: String,
      required: [true, 'Visit time slot is required'],
      trim: true,
      minlength: [2, 'Visit time slot must be specified'],
      maxlength: [50, 'Visit time slot cannot exceed 50 characters'],
    },
    message: {
      type: String,
      trim: true,
      default: '',
      maxlength: [500, 'Message cannot exceed 500 characters'],
    },
    status: {
      type: String,
      required: [true, 'Visit status is required'],
      enum: {
        values: ['Pending', 'Accepted', 'Rejected', 'Cancelled'],
        message: '{VALUE} is not a valid visit status',
      },
      default: 'Pending',
    },
    ownerResponseNote: {
      type: String,
      trim: true,
      default: '',
      maxlength: [300, 'Owner response note cannot exceed 300 characters'],
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

// Indexes for query performance and preventing duplicates
visitRequestSchema.index({ seeker: 1, room: 1, status: 1 });
visitRequestSchema.index({ owner: 1, status: 1 });
visitRequestSchema.index({ room: 1, visitDate: 1 });

const VisitRequest = mongoose.model('VisitRequest', visitRequestSchema);
export default VisitRequest;
