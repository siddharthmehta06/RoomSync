/**
 * 22 Compatibility Factors Validation & Completion Engine
 * 
 * Defines the canonical contract for all 22 interpersonal lifestyle factors:
 * Ensures no arbitrary percentages or default scores are shown until all 22 factors
 * have valid, explicit inputs.
 */

export const FACTOR_DEFINITIONS = [
  // --- 1 to 9: Hard Constraints & Tenancy Rules ---
  {
    key: 'budgetCeiling',
    category: 'hardConstraints',
    label: 'Monthly Rent Ceiling',
    validate: (val) => typeof val === 'number' && val >= 1000 && val <= 200000,
  },
  {
    key: 'maxDeposit',
    category: 'hardConstraints',
    label: 'Security Deposit Ceiling',
    validate: (val) => typeof val === 'number' && val >= 0 && val <= 500000,
  },
  {
    key: 'dietaryRule',
    category: 'hardConstraints',
    label: 'Dietary Rule in Flat',
    validate: (val) => ['Pure-Veg', 'Veg-Only Flat', 'Flexible', 'Any'].includes(val),
  },
  {
    key: 'smokingPolicy',
    category: 'hardConstraints',
    label: 'Smoking Policy',
    validate: (val) => ['Strictly Non-Smoking', 'Balcony Only', 'Flexible'].includes(val),
  },
  {
    key: 'alcoholPolicy',
    category: 'hardConstraints',
    label: 'Alcohol Policy',
    validate: (val) => ['Teetotaler', 'Moderate', 'Flexible'].includes(val),
  },
  {
    key: 'petPolicy',
    category: 'hardConstraints',
    label: 'Pet Policy',
    validate: (val) => ['Strictly No Pets', 'Pet-Friendly', 'Has Pet', 'Flexible'].includes(val),
  },
  {
    key: 'maxCommuteMins',
    category: 'hardConstraints',
    label: 'Maximum Commute Time',
    validate: (val) => typeof val === 'number' && val >= 5 && val <= 180,
  },
  {
    key: 'latestMoveIn',
    category: 'hardConstraints',
    label: 'Target Move-in Date',
    validate: (val) => Boolean(val && !isNaN(new Date(val).getTime())),
  },
  {
    key: 'stayDuration',
    category: 'hardConstraints',
    label: 'Desired Stay Duration (Months)',
    validate: (val) => typeof val === 'number' && val >= 1 && val <= 36,
  },

  // --- 10 to 22: Flexible Lifestyle & Personal Boundaries ---
  {
    key: 'sleepSchedule',
    category: 'flexiblePreferences',
    label: 'Bedtime Hour',
    validate: (val) => typeof val === 'number' && val >= 0 && val <= 23.5,
  },
  {
    key: 'wakeSchedule',
    category: 'flexiblePreferences',
    label: 'Wake-up Hour',
    validate: (val) => typeof val === 'number' && val >= 0 && val <= 23.5,
  },
  {
    key: 'cleanliness',
    category: 'flexiblePreferences',
    label: 'Cleanliness Standards (1-5)',
    validate: (val) => typeof val === 'number' && val >= 1 && val <= 5,
  },
  {
    key: 'noiseTolerance',
    category: 'flexiblePreferences',
    label: 'Noise Tolerance (1-5)',
    validate: (val) => typeof val === 'number' && val >= 1 && val <= 5,
  },
  {
    key: 'guestPolicy',
    category: 'flexiblePreferences',
    label: 'Day Guest Policy',
    validate: (val) => ['Rare', 'Occasional', 'Frequent'].includes(val),
  },
  {
    key: 'overnightGuests',
    category: 'flexiblePreferences',
    label: 'Overnight Guest Policy',
    validate: (val) => ['Not Allowed', 'With Notice', 'Frequent'].includes(val),
  },
  {
    key: 'socialPreference',
    category: 'flexiblePreferences',
    label: 'Social Environment',
    validate: (val) => ['Quiet Retreat', 'Balanced', 'Social Hub'].includes(val),
  },
  {
    key: 'workSchedule',
    category: 'flexiblePreferences',
    label: 'Work / Study Schedule',
    validate: (val) => typeof val === 'string' && val.trim().length > 0,
  },
  {
    key: 'wfhDays',
    category: 'flexiblePreferences',
    label: 'WFH Days per Week',
    validate: (val) => typeof val === 'number' && val >= 0 && val <= 7,
  },
  {
    key: 'studyHabits',
    category: 'flexiblePreferences',
    label: 'Study & Deep Work Habits',
    validate: (val) => typeof val === 'string' && val.trim().length > 0,
  },
  {
    key: 'cookingHabit',
    category: 'flexiblePreferences',
    label: 'Cooking Habits',
    validate: (val) => ['Daily', 'Occasional', 'Tiffin / Delivery'].includes(val),
  },
  {
    key: 'foodSharing',
    category: 'flexiblePreferences',
    label: 'Food & Pantry Sharing',
    validate: (val) => ['Separate Groceries', 'Shared Staples', 'Full Communal'].includes(val),
  },
  {
    key: 'personalSpace',
    category: 'flexiblePreferences',
    label: 'Personal Space Priority',
    validate: (val) => ['High', 'Balanced', 'Communal'].includes(val),
  },
];

/**
 * Checks completion status of the 22 compatibility factors.
 * @param {object} profile - PreferenceProfile or request body containing hardConstraints and flexiblePreferences
 * @returns {object} { completedCount, totalFactors, isComplete, missingFactors, factorStatus }
 */
export function checkFactorsCompletion(profile) {
  if (!profile || typeof profile !== 'object') {
    return {
      completedCount: 0,
      totalFactors: FACTOR_DEFINITIONS.length,
      isComplete: false,
      missingFactors: FACTOR_DEFINITIONS.map((f) => f.label),
      factorStatus: {},
    };
  }

  const hc = profile.hardConstraints || {};
  const fp = profile.flexiblePreferences || {};

  let completedCount = 0;
  const missingFactors = [];
  const factorStatus = {};

  for (const factor of FACTOR_DEFINITIONS) {
    const container = factor.category === 'hardConstraints' ? hc : fp;
    const value = container[factor.key];
    const isValid = factor.validate(value);

    factorStatus[factor.key] = {
      label: factor.label,
      value: value !== undefined ? value : null,
      isValid,
    };

    if (isValid) {
      completedCount += 1;
    } else {
      missingFactors.push({
        key: factor.key,
        label: factor.label,
        category: factor.category,
      });
    }
  }

  const isComplete = completedCount === FACTOR_DEFINITIONS.length;

  return {
    completedCount,
    totalFactors: FACTOR_DEFINITIONS.length,
    isComplete,
    progressPercentage: Math.round((completedCount / FACTOR_DEFINITIONS.length) * 100),
    progressText: `${completedCount}/${FACTOR_DEFINITIONS.length} factors completed`,
    missingFactors,
    factorStatus,
  };
}
