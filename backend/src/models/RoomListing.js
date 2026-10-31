import mongoose from 'mongoose';

const livingConditionsSchema = new mongoose.Schema(
  {
    locationCommute: {
      type: String,
      trim: true,
      default: '',
    },
    foodPreference: {
      type: String,
      required: [true, 'Flat food preference environment is required'],
      enum: {
        values: [
          'Pure Vegetarian',
          'Eggetarian / Flexible Non-veg',
          'Non-Veg Welcome',
        ],
        message: '{VALUE} is not a valid food preference rule',
      },
      default: 'Pure Vegetarian',
    },
    smoking: {
      type: String,
      required: [true, 'Flat smoking policy is required'],
      enum: {
        values: ['Strictly Non-Smoking', 'Balcony Only', 'Allowed'],
        message: '{VALUE} is not a valid smoking rule',
      },
      default: 'Strictly Non-Smoking',
    },
    alcohol: {
      type: String,
      required: [true, 'Flat alcohol policy is required'],
      enum: {
        values: ['Teetotaler', 'Social Drinking OK', 'Allowed'],
        message: '{VALUE} is not a valid alcohol rule',
      },
      default: 'Teetotaler',
    },
    sleepSchedule: {
      type: Number,
      required: [true, 'Typical flat bedtime is required'],
      min: [0.0, 'Sleep schedule hour must be between 0.0 and 23.5'],
      max: [23.5, 'Sleep schedule hour must be between 0.0 and 23.5'],
      default: 23.0,
    },
    wakeSchedule: {
      type: Number,
      required: [true, 'Typical flat wake time is required'],
      min: [0.0, 'Wake schedule hour must be between 0.0 and 23.5'],
      max: [23.5, 'Wake schedule hour must be between 0.0 and 23.5'],
      default: 7.0,
    },
    cleanliness: {
      type: Number,
      required: [true, 'Flat cleanliness standard is required'],
      min: [1.0, 'Cleanliness rating must be between 1.0 and 5.0'],
      max: [5.0, 'Cleanliness rating must be between 1.0 and 5.0'],
      default: 4.0,
    },
    noiseTolerance: {
      type: Number,
      required: [true, 'Flat noise environment is required'],
      min: [1.0, 'Noise tolerance must be between 1.0 and 5.0'],
      max: [5.0, 'Noise tolerance must be between 1.0 and 5.0'],
      default: 3.0,
    },
    guestsDay: {
      type: String,
      default: 'Occasional friends visiting with prior heads-up',
    },
    guestsOvernight: {
      type: String,
      default: 'Allowed with 24h prior notification',
    },
    socialPreference: {
      type: String,
      default: 'Balanced: relaxed weekdays, casual board-game weekends',
    },
    workSchedule: {
      type: String,
      default: 'Standard day shift (10 AM - 7 PM)',
    },
    wfhFrequency: {
      type: Number,
      min: [0, 'WFH frequency must be between 0 and 7 days'],
      max: [7, 'WFH frequency must be between 0 and 7 days'],
      default: 2,
    },
    studyHabits: {
      type: String,
      default: 'Quiet reading hours after 10 PM',
    },
    cookingFrequency: {
      type: String,
      default: 'Shared cook prepares lunch & dinner',
    },
    petsPreference: {
      type: String,
      default: 'No pets currently; cat-friendly',
    },
    foodSharing: {
      type: String,
      default: 'Split pantry staples (oil, spices, milk, groceries)',
    },
    personalSpace: {
      type: String,
      default: 'High respect for personal rooms; friendly lounge chats',
    },
    rulesStrictness: {
      type: String,
      default: 'Gated society, 24/7 security, no arbitrary curfews',
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
      default: [77.5946, 12.9716], // Default Bengaluru [lng, lat]
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
      required: [true, 'Minimum stay duration is required'],
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
    livingConditions: {
      type: livingConditionsSchema,
      required: [true, 'Living conditions are required'],
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

// Indexes for search and query performance
roomListingSchema.index({ city: 1, locality: 1 });
roomListingSchema.index({ rent: 1 });
roomListingSchema.index({ status: 1 });
roomListingSchema.index({ owner: 1 });
roomListingSchema.index({ location: '2dsphere' });

const RoomListing = mongoose.model('RoomListing', roomListingSchema);
export default RoomListing;
