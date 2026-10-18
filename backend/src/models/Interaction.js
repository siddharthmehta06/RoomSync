import mongoose from 'mongoose';

const interactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RoomListing',
      required: [true, 'Room listing reference is required'],
    },
    action: {
      type: String,
      required: [true, 'Interaction action is required'],
      enum: {
        values: ['view', 'save', 'unsave', 'enquire', 'book_visit'],
        message: '{VALUE} is not a valid interaction action',
      },
    },
    dwellTimeSeconds: {
      type: Number,
      default: 0,
      min: [0, 'Dwell time cannot be negative'],
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

// Compound indexes for user activity and timeline queries
interactionSchema.index({ user: 1, room: 1, action: 1 });
interactionSchema.index({ user: 1, action: 1 });
interactionSchema.index({ createdAt: -1 });

const Interaction = mongoose.model('Interaction', interactionSchema);
export default Interaction;
