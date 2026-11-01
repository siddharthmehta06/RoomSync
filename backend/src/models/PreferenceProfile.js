import mongoose from 'mongoose';

const canonicalFactorsSchema = new mongoose.Schema(
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

const hardConstraintsSchema = new mongoose.Schema(
  {
    budgetCeiling: {
      type: Number,
      default: 22000,
      min: [1000, 'Budget ceiling must be at least ₹1,000'],
    },
    maxDeposit: {
      type: Number,
      default: 50000,
      min: [0, 'Deposit cannot be negative'],
    },
    dietaryRule: {
      type: String,
      enum: {
        values: [
          'Pure-Veg',
          'Pure Vegetarian',
          'Veg-Only Flat',
          'Eggetarian / Flexible Non-veg',
          'Non-Veg Welcome',
          'Flexible',
          'Any',
        ],
        message: '{VALUE} is not a valid dietary rule',
      },
      default: 'Any',
    },
    smokingPolicy: {
      type: String,
      enum: {
        values: ['Strictly Non-Smoking', 'Balcony Only', 'Allowed', 'Flexible'],
        message: '{VALUE} is not a valid smoking policy',
      },
      default: 'Flexible',
    },
    alcoholPolicy: {
      type: String,
      enum: {
        values: [
          'Teetotaler',
          'Moderate / Social Drinking',
          'Moderate',
          'Allowed',
          'Flexible',
          'Social Drinking OK',
        ],
        message: '{VALUE} is not a valid alcohol policy',
      },
      default: 'Flexible',
    },
    petPolicy: {
      type: String,
      enum: {
        values: [
          'Strictly No Pets',
          'Pet-Friendly',
          'Has Pet',
          'Flexible',
          'Pets Allowed',
          'Allergies / No Pets',
        ],
        message: '{VALUE} is not a valid pet policy',
      },
      default: 'Flexible',
    },
    maxCommuteMins: {
      type: Number,
      default: 45,
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
      default: 23.0,
      min: [0.0, 'Sleep schedule hour must be between 0.0 and 23.5'],
      max: [23.5, 'Sleep schedule hour must be between 0.0 and 23.5'],
    },
    wakeSchedule: {
      type: Number,
      default: 7.0,
      min: [0.0, 'Wake schedule hour must be between 0.0 and 23.5'],
      max: [23.5, 'Wake schedule hour must be between 0.0 and 23.5'],
    },
    cleanliness: {
      type: Number,
      default: 4,
      min: [1, 'Cleanliness must be between 1 and 5'],
      max: [5, 'Cleanliness must be between 1 and 5'],
    },
    noiseTolerance: {
      type: Number,
      default: 3,
      min: [1, 'Noise tolerance must be between 1 and 5'],
      max: [5, 'Noise tolerance must be between 1 and 5'],
    },
    guestPolicy: {
      type: String,
      default: 'Occasional',
      enum: {
        values: [
          'Rare',
          'Occasional',
          'Frequent',
          'Flexible',
          'Rare / Advance Notice Required',
          'Occasional Friends Welcome',
          'Frequent / Active Social Life',
        ],
        message: '{VALUE} is not a valid guest policy',
      },
    },
    overnightGuests: {
      type: String,
      default: 'With Notice',
      enum: {
        values: [
          'Not Allowed',
          'With Notice',
          'Frequent',
          'Flexible',
          'Allowed with Advance Notice',
          'Allowed Anytime',
          'Not Permitted',
        ],
        message: '{VALUE} is not a valid overnight guest policy',
      },
    },
    socialPreference: {
      type: String,
      default: 'Balanced',
      enum: {
        values: [
          'Quiet Retreat',
          'Balanced',
          'Social Hub',
          'Flexible',
          'Quiet Sanctuary',
          'Balanced Social Life',
          'Active Social Hub',
        ],
        message: '{VALUE} is not a valid social preference',
      },
    },
    workSchedule: {
      type: String,
      default: 'Regular Day',
    },
    wfhDays: {
      type: Number,
      default: 2,
      min: [0, 'WFH days must be between 0 and 7'],
      max: [7, 'WFH days must be between 0 and 7'],
    },
    studyHabits: {
      type: String,
      default: 'Quiet reading time',
    },
    cookingHabit: {
      type: String,
      default: 'Daily',
      enum: {
        values: [
          'Daily',
          'Occasional',
          'Tiffin / Delivery',
          'Flexible',
          'Daily Home Cooking',
          'Light / Occasional Cooking',
          'Tiffin / Dining Out',
        ],
        message: '{VALUE} is not a valid cooking habit',
      },
    },
    foodSharing: {
      type: String,
      default: 'Separate Groceries',
      enum: {
        values: [
          'Separate Groceries',
          'Shared Staples',
          'Full Communal',
          'Flexible',
          'Separate Kitchen Supplies',
          'Shared Common Staples',
          'Fully Communal Groceries',
        ],
        message: '{VALUE} is not a valid food sharing option',
      },
    },
    personalSpace: {
      type: String,
      default: 'High',
      enum: {
        values: [
          'High',
          'Balanced',
          'Communal',
          'Flexible',
          'High (Value Independent Solitude)',
          'Balanced (Mix of Private & Shared Time)',
          'Communal (Thrive in Shared Spaces)',
        ],
        message: '{VALUE} is not a valid personal space preference',
      },
    },
    rulesStrictness: {
      type: String,
      default: 'Moderate',
      enum: {
        values: [
          'Strict Curfew',
          'Moderate',
          'Self-Managed',
          'Flexible',
          'Strict Curfew & Formal House Rules',
          'Moderate Society Rules',
          'Relaxed / Self-Managed',
        ],
        message: '{VALUE} is not a valid house rules strictness',
      },
    },
  },
  { _id: false }
);

const importanceWeightsSchema = new mongoose.Schema(
  {
    budget: {
      type: Number,
      default: 5,
      min: [1, 'Weight must be between 1 and 5'],
      max: [5, 'Weight must be between 1 and 5'],
    },
    diet: {
      type: Number,
      default: 4,
      min: [1, 'Weight must be between 1 and 5'],
      max: [5, 'Weight must be between 1 and 5'],
    },
    sleepSync: {
      type: Number,
      default: 5,
      min: [1, 'Weight must be between 1 and 5'],
      max: [5, 'Weight must be between 1 and 5'],
    },
    cleanliness: {
      type: Number,
      default: 4,
      min: [1, 'Weight must be between 1 and 5'],
      max: [5, 'Weight must be between 1 and 5'],
    },
    noise: {
      type: Number,
      default: 4,
      min: [1, 'Weight must be between 1 and 5'],
      max: [5, 'Weight must be between 1 and 5'],
    },
    guests: {
      type: Number,
      default: 3,
      min: [1, 'Weight must be between 1 and 5'],
      max: [5, 'Weight must be between 1 and 5'],
    },
    wfh: {
      type: Number,
      default: 3,
      min: [1, 'Weight must be between 1 and 5'],
      max: [5, 'Weight must be between 1 and 5'],
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
    // The canonical 22 factors dictionary
    factors: {
      type: canonicalFactorsSchema,
      default: () => ({}),
    },
    isComplete: {
      type: Boolean,
      default: false,
    },
    completedCount: {
      type: Number,
      default: 0,
    },
    // Categorized subdocuments for backwards compatibility
    hardConstraints: {
      type: hardConstraintsSchema,
      default: () => ({}),
    },
    flexiblePreferences: {
      type: flexiblePreferencesSchema,
      default: () => ({}),
    },
    importanceWeights: {
      type: importanceWeightsSchema,
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

const PreferenceProfile = mongoose.model('PreferenceProfile', preferenceProfileSchema);
export default PreferenceProfile;
