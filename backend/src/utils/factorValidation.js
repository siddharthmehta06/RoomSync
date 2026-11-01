/**
 * RoomSync 22 Compatibility Factors Specification & Validation Engine
 * 
 * Standardizes the 22 interpersonal lifestyle factors across both Room Seekers
 * and Room Owners (listings).
 * 
 * Strict Guarantees:
 * 1. Both Seekers and Owners use the EXACT same 22 factor keys.
 * 2. "Flexible" is the default value for all factors.
 * 3. "Flexible" (explicitly accepting variance) is strictly distinguished from "Unanswered" (incomplete/omitted).
 * 4. Never silently converts missing or unanswered fields into Flexible.
 */

export const CANONICAL_22_FACTORS = [
  // 1. Location
  {
    key: 'location',
    label: 'Location & Commute',
    section: 'Living Space & Commute',
    type: 'select_or_text',
    default: 'Flexible',
    options: [
      'Flexible',
      'Within 15 mins of Metro / Western Railway',
      'Within 30 mins of Transit Hub',
      'Walking distance to Tech Park / College',
      'Near Business District / BKC',
    ],
    validate: (val) => {
      if (val === 'Flexible') return { valid: true };
      if (typeof val === 'string' && val.trim().length >= 2) return { valid: true };
      return { valid: false, error: 'Location must be Flexible or at least 2 characters.' };
    },
  },

  // 2. Budget
  {
    key: 'budget',
    label: 'Budget (Monthly Rent Ceiling)',
    section: 'Living Space & Commute',
    type: 'numeric_or_flexible',
    default: 'Flexible',
    validate: (val) => {
      if (val === 'Flexible') return { valid: true };
      const num = Number(val);
      if (!isNaN(num) && num >= 1000 && num <= 500000) return { valid: true };
      return { valid: false, error: 'Budget must be Flexible or between ₹1,000 and ₹5,00,000.' };
    },
  },

  // 3. Food Preference
  {
    key: 'foodPreference',
    label: 'Food Preference',
    section: 'Food, Hygiene & Daily Habits',
    type: 'select',
    default: 'Flexible',
    options: [
      'Flexible',
      'Pure Vegetarian',
      'Veg-Only Flat',
      'Eggetarian / Flexible Non-veg',
      'Non-Veg Welcome',
    ],
    validate: (val) => {
      if (val === 'Flexible') return { valid: true };
      const valid = ['Pure Vegetarian', 'Veg-Only Flat', 'Eggetarian / Flexible Non-veg', 'Non-Veg Welcome', 'Pure-Veg', 'Any'].includes(val);
      return valid ? { valid: true } : { valid: false, error: 'Invalid food preference option.' };
    },
  },

  // 4. Smoking
  {
    key: 'smoking',
    label: 'Smoking Policy',
    section: 'Food, Hygiene & Daily Habits',
    type: 'select',
    default: 'Flexible',
    options: [
      'Flexible',
      'Strictly Non-Smoking',
      'Balcony Only',
      'Allowed',
    ],
    validate: (val) => {
      if (val === 'Flexible') return { valid: true };
      const valid = ['Strictly Non-Smoking', 'Balcony Only', 'Allowed'].includes(val);
      return valid ? { valid: true } : { valid: false, error: 'Invalid smoking policy option.' };
    },
  },

  // 5. Alcohol
  {
    key: 'alcohol',
    label: 'Alcohol Policy',
    section: 'Food, Hygiene & Daily Habits',
    type: 'select',
    default: 'Flexible',
    options: [
      'Flexible',
      'Teetotaler',
      'Moderate / Social Drinking',
      'Allowed',
    ],
    validate: (val) => {
      if (val === 'Flexible') return { valid: true };
      const valid = ['Teetotaler', 'Moderate / Social Drinking', 'Moderate', 'Allowed', 'Social Drinking OK'].includes(val);
      return valid ? { valid: true } : { valid: false, error: 'Invalid alcohol policy option.' };
    },
  },

  // 6. Sleep Schedule
  {
    key: 'sleepSchedule',
    label: 'Typical Bedtime Hour',
    section: 'Circadian Rhythms & House Rules',
    type: 'hour_or_flexible',
    default: 'Flexible',
    validate: (val) => {
      if (val === 'Flexible') return { valid: true };
      const num = Number(val);
      if (!isNaN(num) && num >= 0.0 && num <= 23.5) return { valid: true };
      return { valid: false, error: 'Sleep schedule must be Flexible or hour between 0.0 and 23.5.' };
    },
  },

  // 7. Wake-up Schedule
  {
    key: 'wakeSchedule',
    label: 'Typical Wake-up Hour',
    section: 'Circadian Rhythms & House Rules',
    type: 'hour_or_flexible',
    default: 'Flexible',
    validate: (val) => {
      if (val === 'Flexible') return { valid: true };
      const num = Number(val);
      if (!isNaN(num) && num >= 0.0 && num <= 23.5) return { valid: true };
      return { valid: false, error: 'Wake schedule must be Flexible or hour between 0.0 and 23.5.' };
    },
  },

  // 8. Cleanliness
  {
    key: 'cleanliness',
    label: 'Cleanliness Standards (1-5)',
    section: 'Circadian Rhythms & House Rules',
    type: 'scale_or_flexible',
    default: 'Flexible',
    validate: (val) => {
      if (val === 'Flexible') return { valid: true };
      const num = Number(val);
      if (!isNaN(num) && num >= 1 && num <= 5) return { valid: true };
      return { valid: false, error: 'Cleanliness rating must be Flexible or index 1 to 5.' };
    },
  },

  // 9. Noise Tolerance
  {
    key: 'noiseTolerance',
    label: 'Noise Tolerance (1-5)',
    section: 'Circadian Rhythms & House Rules',
    type: 'scale_or_flexible',
    default: 'Flexible',
    validate: (val) => {
      if (val === 'Flexible') return { valid: true };
      const num = Number(val);
      if (!isNaN(num) && num >= 1 && num <= 5) return { valid: true };
      return { valid: false, error: 'Noise tolerance rating must be Flexible or index 1 to 5.' };
    },
  },

  // 10. Guests and Friends
  {
    key: 'guestsDay',
    label: 'Guests and Friends (Daytime)',
    section: 'Social, Guests & Flatmate Dynamics',
    type: 'select',
    default: 'Flexible',
    options: [
      'Flexible',
      'Rare / Silent Sanctuary',
      'Occasional Day Guests',
      'Frequent Friends Over',
    ],
    validate: (val) => {
      if (val === 'Flexible') return { valid: true };
      const valid = ['Rare / Silent Sanctuary', 'Occasional Day Guests', 'Frequent Friends Over', 'Rare', 'Occasional', 'Frequent'].includes(val);
      return valid ? { valid: true } : { valid: false, error: 'Invalid daytime guest policy option.' };
    },
  },

  // 11. Overnight Guests
  {
    key: 'guestsOvernight',
    label: 'Overnight Guests',
    section: 'Social, Guests & Flatmate Dynamics',
    type: 'select',
    default: 'Flexible',
    options: [
      'Flexible',
      'Strictly Not Allowed',
      'Allowed with Prior Notice',
      'Allowed Freely',
    ],
    validate: (val) => {
      if (val === 'Flexible') return { valid: true };
      const valid = ['Strictly Not Allowed', 'Allowed with Prior Notice', 'Allowed Freely', 'Not Allowed', 'With Notice', 'Frequent'].includes(val);
      return valid ? { valid: true } : { valid: false, error: 'Invalid overnight guest policy option.' };
    },
  },

  // 12. Social / Party Preference
  {
    key: 'socialPreference',
    label: 'Social / Home Atmosphere',
    section: 'Social, Guests & Flatmate Dynamics',
    type: 'select',
    default: 'Flexible',
    options: [
      'Flexible',
      'Quiet Retreat',
      'Balanced Atmosphere',
      'Social Hub / Weekend Buzz',
    ],
    validate: (val) => {
      if (val === 'Flexible') return { valid: true };
      const valid = ['Quiet Retreat', 'Balanced Atmosphere', 'Social Hub / Weekend Buzz', 'Balanced', 'Social Hub'].includes(val);
      return valid ? { valid: true } : { valid: false, error: 'Invalid social preference option.' };
    },
  },

  // 13. Work / College Schedule
  {
    key: 'workSchedule',
    label: 'Work / College Schedule',
    section: 'Social, Guests & Flatmate Dynamics',
    type: 'select_or_text',
    default: 'Flexible',
    options: [
      'Flexible',
      'Standard Corporate Day Shifts (9 AM - 6 PM)',
      'Rotational / Night Shifts',
      'Student / College Schedule',
      'Flexible / Freelance Hours',
    ],
    validate: (val) => {
      if (val === 'Flexible') return { valid: true };
      if (typeof val === 'string' && val.trim().length > 0) return { valid: true };
      return { valid: false, error: 'Work schedule must be Flexible or valid schedule description.' };
    },
  },

  // 14. Work-from-Home Frequency
  {
    key: 'wfhFrequency',
    label: 'Work-from-Home Frequency (Days/Week)',
    section: 'Social, Guests & Flatmate Dynamics',
    type: 'numeric_or_flexible',
    default: 'Flexible',
    validate: (val) => {
      if (val === 'Flexible') return { valid: true };
      const num = Number(val);
      if (!isNaN(num) && num >= 0 && num <= 7) return { valid: true };
      return { valid: false, error: 'WFH frequency must be Flexible or between 0 and 7 days.' };
    },
  },

  // 15. Study-at-Home Frequency
  {
    key: 'studyHabits',
    label: 'Study-at-Home Frequency & Quiet Hours',
    section: 'Social, Guests & Flatmate Dynamics',
    type: 'select_or_text',
    default: 'Flexible',
    options: [
      'Flexible',
      'Quiet Focused Study Hours Required',
      'Relaxed Reading / Light Study',
      'No Specific Study Requirements',
    ],
    validate: (val) => {
      if (val === 'Flexible') return { valid: true };
      if (typeof val === 'string' && val.trim().length > 0) return { valid: true };
      return { valid: false, error: 'Study habits must be Flexible or valid text.' };
    },
  },

  // 16. Cooking Frequency
  {
    key: 'cookingFrequency',
    label: 'Cooking Frequency',
    section: 'Food, Hygiene & Daily Habits',
    type: 'select',
    default: 'Flexible',
    options: [
      'Flexible',
      'Daily Home Cooking',
      'Occasional Cooking',
      'Tiffin / Ordering Delivery',
    ],
    validate: (val) => {
      if (val === 'Flexible') return { valid: true };
      const valid = ['Daily Home Cooking', 'Occasional Cooking', 'Tiffin / Ordering Delivery', 'Daily', 'Occasional'].includes(val);
      return valid ? { valid: true } : { valid: false, error: 'Invalid cooking frequency option.' };
    },
  },

  // 17. Pets
  {
    key: 'pets',
    label: 'Pets Policy',
    section: 'Food, Hygiene & Daily Habits',
    type: 'select',
    default: 'Flexible',
    options: [
      'Flexible',
      'Strictly No Pets',
      'Pet-Friendly Flat',
      'Currently Has Pets',
    ],
    validate: (val) => {
      if (val === 'Flexible') return { valid: true };
      const valid = ['Strictly No Pets', 'Pet-Friendly Flat', 'Currently Has Pets', 'Pet-Friendly', 'Has Pet'].includes(val);
      return valid ? { valid: true } : { valid: false, error: 'Invalid pets policy option.' };
    },
  },

  // 18. Grocery / Food Sharing
  {
    key: 'foodSharing',
    label: 'Grocery / Food Sharing',
    section: 'Food, Hygiene & Daily Habits',
    type: 'select',
    default: 'Flexible',
    options: [
      'Flexible',
      'Separate Groceries & Cookware',
      'Shared Staples (Oil, Spices, Milk)',
      'Full Communal Kitchen & Meals',
    ],
    validate: (val) => {
      if (val === 'Flexible') return { valid: true };
      const valid = ['Separate Groceries & Cookware', 'Shared Staples (Oil, Spices, Milk)', 'Full Communal Kitchen & Meals', 'Separate Groceries', 'Shared Staples', 'Full Communal'].includes(val);
      return valid ? { valid: true } : { valid: false, error: 'Invalid food sharing option.' };
    },
  },

  // 19. Move-in Date
  {
    key: 'moveInDate',
    label: 'Move-in Date',
    section: 'Living Space & Commute',
    type: 'date_or_flexible',
    default: 'Flexible',
    validate: (val) => {
      if (val === 'Flexible') return { valid: true };
      if (!val) return { valid: false, unanswered: true, error: 'Move-in date is required.' };
      const d = new Date(val);
      if (!isNaN(d.getTime())) return { valid: true };
      return { valid: false, error: 'Invalid move-in date format.' };
    },
  },

  // 20. Duration of Stay
  {
    key: 'stayDuration',
    label: 'Duration of Stay (Months)',
    section: 'Living Space & Commute',
    type: 'numeric_or_flexible',
    default: 'Flexible',
    options: ['Flexible', 3, 6, 11, 12, 24],
    validate: (val) => {
      if (val === 'Flexible') return { valid: true };
      const num = Number(val);
      if (!isNaN(num) && num >= 1 && num <= 36) return { valid: true };
      return { valid: false, error: 'Stay duration must be Flexible or between 1 and 36 months.' };
    },
  },

  // 21. Personal-Space Boundaries
  {
    key: 'personalSpace',
    label: 'Personal-Space Boundaries',
    section: 'Social, Guests & Flatmate Dynamics',
    type: 'select',
    default: 'Flexible',
    options: [
      'Flexible',
      'High Solitary Privacy',
      'Balanced Space & Interaction',
      'Communal Flatmate Bonding',
    ],
    validate: (val) => {
      if (val === 'Flexible') return { valid: true };
      const valid = ['High Solitary Privacy', 'Balanced Space & Interaction', 'Communal Flatmate Bonding', 'High', 'Balanced', 'Communal'].includes(val);
      return valid ? { valid: true } : { valid: false, error: 'Invalid personal space option.' };
    },
  },

  // 22. House-Rules Strictness
  {
    key: 'rulesStrictness',
    label: 'House-Rules Strictness',
    section: 'Circadian Rhythms & House Rules',
    type: 'select',
    default: 'Flexible',
    options: [
      'Flexible',
      'Strict Curfew & Formal House Rules',
      'Moderate Society Rules',
      'Relaxed / Self-Managed',
    ],
    validate: (val) => {
      if (val === 'Flexible') return { valid: true };
      const valid = ['Strict Curfew & Formal House Rules', 'Moderate Society Rules', 'Relaxed / Self-Managed', 'Strict Curfew', 'Moderate', 'Self-Managed'].includes(val);
      return valid ? { valid: true } : { valid: false, error: 'Invalid house rules strictness option.' };
    },
  },
];

/**
 * Returns an object with all 22 factors explicitly initialized to 'Flexible'.
 */
export function getDefaultFlexible22Factors() {
  const defaults = {};
  for (const factor of CANONICAL_22_FACTORS) {
    defaults[factor.key] = 'Flexible';
  }
  return defaults;
}

/**
 * Validates a questionnaire object against the 22 canonical factors.
 * Distinguishes:
 * - Answered with Flexible
 * - Answered with Specific Value
 * - Unanswered (null, undefined, missing, empty string)
 * 
 * @param {object} input - Questionnaire factor responses
 * @param {object} options - { requireAll: boolean }
 * @returns {object} Validation result and completion stats
 */
export function validate22Factors(input = {}, options = {}) {
  const { requireAll = false } = options;
  const factorMap = {};
  const missingFactors = [];
  const flexibleFactors = [];
  const specificFactors = [];
  const errors = {};
  let completedCount = 0;

  for (const factor of CANONICAL_22_FACTORS) {
    // Also check common aliases for backwards compatibility
    let rawValue = input[factor.key];
    if (rawValue === undefined || rawValue === null || rawValue === '') {
      if (factor.key === 'budget' && input.budgetCeiling !== undefined) rawValue = input.budgetCeiling;
      if (factor.key === 'location' && input.locationCommute !== undefined) rawValue = input.locationCommute;
      if (factor.key === 'foodPreference' && input.dietaryRule !== undefined) rawValue = input.dietaryRule;
      if (factor.key === 'smoking' && input.smokingPolicy !== undefined) rawValue = input.smokingPolicy;
      if (factor.key === 'alcohol' && input.alcoholPolicy !== undefined) rawValue = input.alcoholPolicy;
      if (factor.key === 'pets' && (input.petsPreference !== undefined || input.petPolicy !== undefined)) {
        rawValue = input.petsPreference !== undefined ? input.petsPreference : input.petPolicy;
      }
      if (factor.key === 'wfhFrequency' && input.wfhDays !== undefined) rawValue = input.wfhDays;
      if (factor.key === 'cookingFrequency' && input.cookingHabit !== undefined) rawValue = input.cookingHabit;
      if (factor.key === 'guestsDay' && input.guestPolicy !== undefined) rawValue = input.guestPolicy;
      if (factor.key === 'moveInDate' && input.latestMoveIn !== undefined) rawValue = input.latestMoveIn;
    }

    const isUnanswered = rawValue === undefined || rawValue === null || rawValue === '';

    if (isUnanswered) {
      factorMap[factor.key] = {
        key: factor.key,
        label: factor.label,
        value: null,
        isAnswered: false,
        isFlexible: false,
        status: 'Unanswered',
      };
      missingFactors.push({ key: factor.key, label: factor.label });
    } else {
      const valResult = factor.validate(rawValue);
      if (valResult.valid) {
        completedCount += 1;
        const isFlex = rawValue === 'Flexible';
        if (isFlex) {
          flexibleFactors.push(factor.key);
        } else {
          specificFactors.push(factor.key);
        }
        factorMap[factor.key] = {
          key: factor.key,
          label: factor.label,
          value: rawValue,
          isAnswered: true,
          isFlexible: isFlex,
          status: isFlex ? 'Flexible' : 'Specific',
        };
      } else {
        errors[factor.key] = valResult.error || `Invalid value for ${factor.label}`;
        factorMap[factor.key] = {
          key: factor.key,
          label: factor.label,
          value: rawValue,
          isAnswered: false,
          isFlexible: false,
          status: 'Invalid',
          error: valResult.error,
        };
        missingFactors.push({ key: factor.key, label: factor.label, error: valResult.error });
      }
    }
  }

  const isComplete = completedCount === 22 && Object.keys(errors).length === 0;
  const progressPercentage = Math.round((completedCount / 22) * 100);

  const isValid = requireAll ? isComplete : Object.keys(errors).length === 0;

  return {
    isValid,
    isComplete,
    completedCount,
    totalFactors: 22,
    progressPercentage,
    missingFactors,
    flexibleFactors,
    specificFactors,
    errors,
    factorMap,
  };
}

/**
 * Backwards compatibility wrapper for checkFactorsCompletion
 */
export function checkFactorsCompletion(profile) {
  if (!profile || typeof profile !== 'object') {
    return {
      completedCount: 0,
      totalFactors: 22,
      isComplete: false,
      missingFactors: CANONICAL_22_FACTORS.map((f) => ({ key: f.key, label: f.label })),
      factorStatus: {},
    };
  }

  // Check if profile.factors is present, or gather from hardConstraints & flexiblePreferences
  let input = profile.factors || {};
  if (Object.keys(input).length === 0) {
    const hc = profile.hardConstraints || {};
    const fp = profile.flexiblePreferences || {};
    input = {
      location: hc.maxCommuteMins ? `Max ${hc.maxCommuteMins} mins commute` : 'Flexible',
      budget: hc.budgetCeiling || 'Flexible',
      foodPreference: hc.dietaryRule || 'Flexible',
      smoking: hc.smokingPolicy || 'Flexible',
      alcohol: hc.alcoholPolicy || 'Flexible',
      pets: hc.petPolicy || 'Flexible',
      moveInDate: hc.latestMoveIn || 'Flexible',
      stayDuration: hc.stayDuration || 'Flexible',
      sleepSchedule: fp.sleepSchedule !== undefined ? fp.sleepSchedule : 'Flexible',
      wakeSchedule: fp.wakeSchedule !== undefined ? fp.wakeSchedule : 'Flexible',
      cleanliness: fp.cleanliness !== undefined ? fp.cleanliness : 'Flexible',
      noiseTolerance: fp.noiseTolerance !== undefined ? fp.noiseTolerance : 'Flexible',
      guestsDay: fp.guestPolicy || 'Flexible',
      guestsOvernight: fp.overnightGuests || 'Flexible',
      socialPreference: fp.socialPreference || 'Flexible',
      workSchedule: fp.workSchedule || 'Flexible',
      wfhFrequency: fp.wfhDays !== undefined ? fp.wfhDays : 'Flexible',
      studyHabits: fp.studyHabits || 'Flexible',
      cookingFrequency: fp.cookingHabit || 'Flexible',
      foodSharing: fp.foodSharing || 'Flexible',
      personalSpace: fp.personalSpace || 'Flexible',
      rulesStrictness: fp.rulesStrictness || 'Flexible',
    };
  }

  const result = validate22Factors(input);
  return {
    completedCount: result.completedCount,
    totalFactors: 22,
    isComplete: result.isComplete,
    progressPercentage: result.progressPercentage,
    progressText: `${result.completedCount}/22 factors completed`,
    missingFactors: result.missingFactors,
    factorStatus: result.factorMap,
  };
}

export const FACTOR_DEFINITIONS = CANONICAL_22_FACTORS;
