import mongoose from 'mongoose';

const hardConstraintsSchema = new mongoose.Schema(
  {
    budgetCeiling: {
      type: Number,
      required: [true, 'Budget ceiling is required'],
      min: [1000, 'Budget ceiling must be at least ₹1,000'],
    },
    maxDeposit: {
      type: Number,
      default: null,
      min: [0, 'Deposit cannot be negative'],
    },
    dietaryRule: {
      type: String,
      enum: {
        values: ['Pure-Veg', 'Veg-Only Flat', 'Flexible', 'Any'],
        message: '{VALUE} is not a valid dietary rule',
      },
      default: 'Any',
    },
    smokingPolicy: {
      type: String,
      enum: {
        values: ['Strictly Non-Smoking', 'Balcony Only', 'Flexible'],
        message: '{VALUE} is not a valid smoking policy',
      },
      default: 'Flexible',
    },
    alcoholPolicy: {
      type: String,
      enum: {
        values: ['Teetotaler', 'Moderate', 'Flexible'],
        message: '{VALUE} is not a valid alcohol policy',
      },
      default: 'Flexible',
    },
    petPolicy: {
      type: String,
      enum: {
        values: ['Strictly No Pets', 'Pet-Friendly', 'Has Pet', 'Flexible'],
        message: '{VALUE} is not a valid pet policy',
      },
      default: 'Flexible',
    },
    maxCommuteMins: {
      type: Number,
      default: null,
      min: [5, 'Commute time must be at least 5 minutes'],
      max: [180, 'Commute time cannot exceed 180 minutes'],
    },
    earliestMoveIn: {
      type: Date,
      default: null,
    },
    latestMoveIn: {
      type: Date,
      default: null,
    },
    stayDuration: {
      type: Number,
      default: 6,
      min: [1, 'Stay duration must be at least 1 month'],
      max: [36, 'Stay duration cannot exceed 36 months'],
    },
  },
  { _id: false }
);

const flexiblePreferencesSchema = new mongoose.Schema(
  {
    sleepSchedule: {
      type: Number,
      required: [true, 'Sleep schedule is required'],
      min: [0.0, 'Sleep schedule hour must be between 0.0 and 23.5'],
      max: [23.5, 'Sleep schedule hour must be between 0.0 and 23.5'],
      default: 23.0,
    },
    wakeSchedule: {
      type: Number,
      required: [true, 'Wake schedule is required'],
      min: [0.0, 'Wake schedule hour must be between 0.0 and 23.5'],
      max: [23.5, 'Wake schedule hour must be between 0.0 and 23.5'],
      default: 7.0,
    },
    cleanliness: {
      type: Number,
      required: [true, 'Cleanliness rating is required'],
      min: [1, 'Cleanliness must be between 1 and 5'],
      max: [5, 'Cleanliness must be between 1 and 5'],
      default: 4,
    },
    noiseTolerance: {
      type: Number,
      required: [true, 'Noise tolerance is required'],
      min: [1, 'Noise tolerance must be between 1 and 5'],
      max: [5, 'Noise tolerance must be between 1 and 5'],
      default: 3,
    },
    guestPolicy: {
      type: String,
      required: [true, 'Guest policy is required'],
      enum: {
        values: ['Rare', 'Occasional', 'Frequent'],
        message: '{VALUE} is not a valid guest policy',
      },
      default: 'Occasional',
    },
    overnightGuests: {
      type: String,
      required: [true, 'Overnight guest policy is required'],
      enum: {
        values: ['Not Allowed', 'With Notice', 'Frequent'],
        message: '{VALUE} is not a valid overnight guest policy',
      },
      default: 'With Notice',
    },
    socialPreference: {
      type: String,
      required: [true, 'Social preference is required'],
      enum: {
        values: ['Quiet Retreat', 'Balanced', 'Social Hub'],
        message: '{VALUE} is not a valid social preference',
      },
      default: 'Balanced',
    },
    workSchedule: {
      type: String,
      default: 'Regular Day',
    },
    wfhDays: {
      type: Number,
      required: [true, 'WFH days per week is required'],
      min: [0, 'WFH days must be between 0 and 7'],
      max: [7, 'WFH days must be between 0 and 7'],
      default: 2,
    },
    studyHabits: {
      type: String,
      default: 'Quiet reading time',
    },
    cookingHabit: {
      type: String,
      required: [true, 'Cooking habit is required'],
      enum: {
        values: ['Daily', 'Occasional', 'Tiffin / Delivery'],
        message: '{VALUE} is not a valid cooking habit',
      },
      default: 'Daily',
    },
    foodSharing: {
      type: String,
      required: [true, 'Food sharing preference is required'],
      enum: {
        values: ['Separate Groceries', 'Shared Staples', 'Full Communal'],
        message: '{VALUE} is not a valid food sharing option',
      },
      default: 'Separate Groceries',
    },
    personalSpace: {
      type: String,
      required: [true, 'Personal space preference is required'],
      enum: {
        values: ['High', 'Balanced', 'Communal'],
        message: '{VALUE} is not a valid personal space preference',
      },
      default: 'High',
    },
    rulesStrictness: {
      type: String,
      required: [true, 'House rules strictness is required'],
      enum: {
        values: ['Strict Curfew', 'Moderate', 'Self-Managed'],
        message: '{VALUE} is not a valid house rules strictness',
      },
      default: 'Moderate',
    },
  },
  { _id: false }
);

const importanceWeightsSchema = new mongoose.Schema(
  {
    budget: {
      type: Number,
      min: [1, 'Weight must be between 1 and 5'],
      max: [5, 'Weight must be between 1 and 5'],
      default: 5,
    },
    diet: {
      type: Number,
      min: [1, 'Weight must be between 1 and 5'],
      max: [5, 'Weight must be between 1 and 5'],
      default: 4,
    },
    sleepSync: {
      type: Number,
      min: [1, 'Weight must be between 1 and 5'],
      max: [5, 'Weight must be between 1 and 5'],
      default: 5,
    },
    cleanliness: {
      type: Number,
      min: [1, 'Weight must be between 1 and 5'],
      max: [5, 'Weight must be between 1 and 5'],
      default: 4,
    },
    noise: {
      type: Number,
      min: [1, 'Weight must be between 1 and 5'],
      max: [5, 'Weight must be between 1 and 5'],
      default: 4,
    },
    guests: {
      type: Number,
      min: [1, 'Weight must be between 1 and 5'],
      max: [5, 'Weight must be between 1 and 5'],
      default: 3,
    },
    wfh: {
      type: Number,
      min: [1, 'Weight must be between 1 and 5'],
      max: [5, 'Weight must be between 1 and 5'],
      default: 3,
    },
  },
  { _id: false }
);

const preferenceProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      unique: true,
    },
    hardConstraints: {
      type: hardConstraintsSchema,
      required: [true, 'Hard constraints are required'],
      default: () => ({}),
    },
    flexiblePreferences: {
      type: flexiblePreferencesSchema,
      required: [true, 'Flexible preferences are required'],
      default: () => ({}),
    },
    importanceWeights: {
      type: importanceWeightsSchema,
      required: [true, 'Importance weights are required'],
      default: () => ({}),
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

const PreferenceProfile = mongoose.model(
  'PreferenceProfile',
  preferenceProfileSchema
);
export default PreferenceProfile;
