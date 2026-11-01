import mongoose from 'mongoose';

const roomQuestionnaireSchema = new mongoose.Schema(
  {
    location: { type: mongoose.Schema.Types.Mixed, default: undefined },
    budget: { type: mongoose.Schema.Types.Mixed, default: undefined },
    foodPreference: { type: mongoose.Schema.Types.Mixed, default: undefined },
    smoking: { type: mongoose.Schema.Types.Mixed, default: undefined },
    alcohol: { type: mongoose.Schema.Types.Mixed, default: undefined },
    sleepSchedule: { type: mongoose.Schema.Types.Mixed, default: undefined },
    wakeSchedule: { type: mongoose.Schema.Types.Mixed, default: undefined },
    cleanliness: { type: mongoose.Schema.Types.Mixed, default: undefined },
    noiseTolerance: { type: mongoose.Schema.Types.Mixed, default: undefined },
    guestsDay: { type: mongoose.Schema.Types.Mixed, default: undefined },
    guestsOvernight: { type: mongoose.Schema.Types.Mixed, default: undefined },
    socialPreference: { type: mongoose.Schema.Types.Mixed, default: undefined },
    workSchedule: { type: mongoose.Schema.Types.Mixed, default: undefined },
    wfhFrequency: { type: mongoose.Schema.Types.Mixed, default: undefined },
    studyHabits: { type: mongoose.Schema.Types.Mixed, default: undefined },
    cookingFrequency: { type: mongoose.Schema.Types.Mixed, default: undefined },
    pets: { type: mongoose.Schema.Types.Mixed, default: undefined },
    foodSharing: { type: mongoose.Schema.Types.Mixed, default: undefined },
    moveInDate: { type: mongoose.Schema.Types.Mixed, default: undefined },
    stayDuration: { type: mongoose.Schema.Types.Mixed, default: undefined },
    personalSpace: { type: mongoose.Schema.Types.Mixed, default: undefined },
    rulesStrictness: { type: mongoose.Schema.Types.Mixed, default: undefined },
  },
  { _id: false }
);

const livingConditionsSchema = new mongoose.Schema(
  {
    location: {
      type: String,
      trim: true,
      default: 'Flexible',
    },
    locationCommute: {
      type: String,
      trim: true,
      default: 'Flexible',
    },
    budget: {
      type: mongoose.Schema.Types.Mixed,
      default: 'Flexible',
    },
    foodPreference: {
      type: String,
      default: 'Flexible',
    },
    smoking: {
      type: String,
      default: 'Flexible',
    },
    alcohol: {
      type: String,
      default: 'Flexible',
    },
    sleepSchedule: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    wakeSchedule: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    cleanliness: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    noiseTolerance: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    guestsDay: {
      type: String,
      default: 'Flexible',
    },
    guestsOvernight: {
      type: String,
      default: 'Flexible',
    },
    socialPreference: {
      type: String,
      default: 'Flexible',
    },
    workSchedule: {
      type: String,
      default: 'Flexible',
    },
    wfhFrequency: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    studyHabits: {
      type: String,
      default: 'Flexible',
    },
    cookingFrequency: {
      type: String,
      default: 'Flexible',
    },
    pets: {
      type: String,
      default: 'Flexible',
    },
    petsPreference: {
      type: String,
      default: 'Flexible',
    },
    foodSharing: {
      type: String,
      default: 'Flexible',
    },
    moveInDate: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    stayDuration: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    personalSpace: {
      type: String,
      default: 'Flexible',
    },
    rulesStrictness: {
      type: String,
      default: 'Flexible',
    },
  },
  { _id: false }
);

const pointSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: [72.8697, 19.1136], // Default Mumbai [lng, lat]
    },
  },
  { _id: false }
);

const roomReviewSchema = new mongoose.Schema(
  {
    seeker: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    feedback: { type: String, trim: true, maxlength: 1000, default: '' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const roomListingSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Owner reference is required'],
    },
    title: {
      type: String,
      required: [true, 'Listing title is required'],
      trim: true,
      minlength: [10, 'Title must be at least 10 characters'],
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
    locality: {
      type: String,
      required: [true, 'Locality is required'],
      trim: true,
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
      default: 'Mumbai',
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true,
      default: 'Maharashtra',
    },
    pinCode: {
      type: String,
      required: [true, 'Postal code is required'],
      trim: true,
      match: [/^[0-9]{6}$/, 'Postal code must be a 6-digit number'],
    },
    exactAddress: {
      type: String,
      trim: true,
      default: '',
    },
    googleMapsUrl: {
      type: String,
      trim: true,
      default: '',
    },
    isAddressPrivate: {
      type: Boolean,
      default: true,
    },
    isDemo: {
      type: Boolean,
      default: false,
    },
    location: {
      type: pointSchema,
      default: () => ({ type: 'Point', coordinates: [72.8697, 19.1136] }), // Andheri, Mumbai [lng, lat]
    },
    rent: {
      type: Number,
      required: [true, 'Rent is required'],
      min: [0, 'Rent cannot be negative'],
    },
    maintenance: {
      type: Number,
      default: 0,
      min: [0, 'Maintenance cannot be negative'],
    },
    deposit: {
      type: Number,
      required: [true, 'Deposit is required'],
      min: [0, 'Deposit cannot be negative'],
    },
    roomType: {
      type: String,
      required: [true, 'Room type is required'],
      enum: {
        values: [
          'Private Room with Attached Bath',
          'Private Room (Shared Bath)',
          'Shared Room',
        ],
        message: '{VALUE} is not a valid room type',
      },
    },
    furnishing: {
      type: String,
      required: [true, 'Furnishing status is required'],
      enum: {
        values: ['Fully Furnished', 'Semi-Furnished', 'Unfurnished'],
        message: '{VALUE} is not a valid furnishing tier',
      },
    },
    availableFrom: {
      type: Date,
      required: [true, 'Available from date is required'],
    },
    minStayMonths: {
      type: Number,
      min: [1, 'Minimum stay must be at least 1 month'],
      max: [36, 'Minimum stay cannot exceed 36 months'],
      default: 6,
    },
    images: {
      type: [String],
      default: [],
    },
    amenities: {
      type: [String],
      default: [],
    },
    // The separate 22-factor questionnaire saved for this specific room listing
    questionnaire: {
      type: roomQuestionnaireSchema,
      default: () => ({}),
    },
    isQuestionnaireComplete: {
      type: Boolean,
      default: true,
    },
    questionnaireCompletedCount: {
      type: Number,
      default: 22,
    },
    // Synchronized living conditions for compatibility and queries
    livingConditions: {
      type: livingConditionsSchema,
      default: () => ({}),
    },
    reviews: { type: [roomReviewSchema], default: [] },
    status: {
      type: String,
      required: [true, 'Listing status is required'],
      enum: {
        values: ['active', 'reserved', 'occupied', 'deactivated'],
        message: '{VALUE} is not a valid listing status',
      },
      default: 'active',
    },
    reservedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
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

roomListingSchema.index({ location: '2dsphere' });
roomListingSchema.index({ city: 1, locality: 1, status: 1 });
roomListingSchema.index({ rent: 1, status: 1 });
roomListingSchema.index({ owner: 1, status: 1 });

const RoomListing = mongoose.model('RoomListing', roomListingSchema);
export default RoomListing;
