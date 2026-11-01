import PreferenceProfile from '../models/PreferenceProfile.js';
import User from '../models/User.js';
import { validate22Factors, CANONICAL_22_FACTORS } from '../utils/factorValidation.js';

/**
 * Maps a canonical 22-factors dictionary into hardConstraints, flexiblePreferences, and importanceWeights
 */
function mapFactorsToCategorized(factors = {}) {
  const hc = {
    budgetCeiling: factors.budget !== 'Flexible' && typeof factors.budget === 'number' ? factors.budget : 22000,
    maxDeposit: 50000,
    dietaryRule: factors.foodPreference || 'Any',
    smokingPolicy: factors.smoking || 'Flexible',
    alcoholPolicy: factors.alcohol || 'Flexible',
    petPolicy: factors.pets || 'Flexible',
    maxCommuteMins: 45,
    latestMoveIn: factors.moveInDate !== 'Flexible' && factors.moveInDate ? new Date(factors.moveInDate) : null,
    stayDuration: factors.stayDuration !== 'Flexible' && typeof factors.stayDuration === 'number' ? factors.stayDuration : 6,
  };

  const fp = {
    sleepSchedule: factors.sleepSchedule !== 'Flexible' && typeof factors.sleepSchedule === 'number' ? factors.sleepSchedule : 23.0,
    wakeSchedule: factors.wakeSchedule !== 'Flexible' && typeof factors.wakeSchedule === 'number' ? factors.wakeSchedule : 7.0,
    cleanliness: factors.cleanliness !== 'Flexible' && typeof factors.cleanliness === 'number' ? factors.cleanliness : 4,
    noiseTolerance: factors.noiseTolerance !== 'Flexible' && typeof factors.noiseTolerance === 'number' ? factors.noiseTolerance : 3,
    guestPolicy: factors.guestsDay || 'Occasional',
    overnightGuests: factors.guestsOvernight || 'With Notice',
    socialPreference: factors.socialPreference || 'Balanced',
    workSchedule: factors.workSchedule || 'Regular Day',
    wfhDays: factors.wfhFrequency !== 'Flexible' && typeof factors.wfhFrequency === 'number' ? factors.wfhFrequency : 2,
    studyHabits: factors.studyHabits || 'Quiet reading time',
    cookingHabit: factors.cookingFrequency || 'Daily',
    foodSharing: factors.foodSharing || 'Separate Groceries',
    personalSpace: factors.personalSpace || 'High',
    rulesStrictness: factors.rulesStrictness || 'Moderate',
  };

  return { hardConstraints: hc, flexiblePreferences: fp };
}

/**
 * Maps categorized hardConstraints and flexiblePreferences into a canonical 22-factors dictionary
 */
function mapCategorizedToFactors(hc = {}, fp = {}) {
  return {
    location: hc.maxCommuteMins ? `Max ${hc.maxCommuteMins} mins commute` : 'Flexible',
    budget: hc.budgetCeiling !== undefined ? hc.budgetCeiling : 'Flexible',
    foodPreference: hc.dietaryRule || 'Flexible',
    smoking: hc.smokingPolicy || 'Flexible',
    alcohol: hc.alcoholPolicy || 'Flexible',
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
    pets: hc.petPolicy || 'Flexible',
    foodSharing: fp.foodSharing || 'Flexible',
    moveInDate: hc.latestMoveIn || 'Flexible',
    stayDuration: hc.stayDuration !== undefined ? hc.stayDuration : 'Flexible',
    personalSpace: fp.personalSpace || 'Flexible',
    rulesStrictness: fp.rulesStrictness || 'Flexible',
  };
}

/**
 * @desc    Get current user's 22-factor preference profile
 * @route   GET /api/preferences
 * @access  Private
 */
export async function getPreferences(req, res, next) {
  try {
    const profile = await PreferenceProfile.findOne({ user: req.user._id });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Preference profile not found. Please complete the onboarding questionnaire.',
        error: {
          code: 'PROFILE_NOT_FOUND',
          message: 'Preference profile not found. Please complete the onboarding questionnaire.',
          details: [],
        },
      });
    }

    const factors = profile.factors && Object.keys(profile.factors).length > 0
      ? profile.factors
      : mapCategorizedToFactors(profile.hardConstraints, profile.flexiblePreferences);

    const completion = validate22Factors(factors);

    res.status(200).json({
      success: true,
      data: profile,
      completion,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @desc    Create or update current user's 22-factor preference profile
 * @route   PUT /api/preferences
 * @access  Private
 */
export async function savePreferences(req, res, next) {
  try {
    const { factors, hardConstraints, flexiblePreferences, importanceWeights } = req.body;

    let incomingFactors = {};

    if (factors && typeof factors === 'object') {
      incomingFactors = factors;
    } else if (hardConstraints || flexiblePreferences) {
      incomingFactors = mapCategorizedToFactors(hardConstraints || {}, flexiblePreferences || {});
    }

    // Validate the 22 factors without requiring all 22 (allows saving drafts)
    const validationResult = validate22Factors(incomingFactors, { requireAll: false });

    if (!validationResult.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed for some factor responses.',
        error: {
          code: 'INVALID_FACTOR_VALUE',
          message: 'One or more questionnaire responses are invalid.',
          details: validationResult.errors,
        },
      });
    }

    let profile = await PreferenceProfile.findOne({ user: req.user._id });

    // Synchronize categorized structures
    const categorized = mapFactorsToCategorized(incomingFactors);

    if (profile) {
      // Update existing profile (merge responses to allow resume/edit)
      const existingFactors = profile.factors ? profile.factors.toObject ? profile.factors.toObject() : profile.factors : {};
      const mergedFactors = { ...existingFactors, ...incomingFactors };

      profile.factors = mergedFactors;
      const updatedCompletion = validate22Factors(mergedFactors);
      profile.completedCount = updatedCompletion.completedCount;
      profile.isComplete = updatedCompletion.isComplete;

      profile.hardConstraints = {
        ...profile.hardConstraints.toObject(),
        ...categorized.hardConstraints,
        ...(hardConstraints || {}),
      };

      profile.flexiblePreferences = {
        ...profile.flexiblePreferences.toObject(),
        ...categorized.flexiblePreferences,
        ...(flexiblePreferences || {}),
      };

      if (importanceWeights) {
        profile.importanceWeights = {
          ...profile.importanceWeights.toObject(),
          ...importanceWeights,
        };
      }

      await profile.save();
    } else {
      // Create new profile
      const newCompletion = validate22Factors(incomingFactors);
      profile = await PreferenceProfile.create({
        user: req.user._id,
        factors: incomingFactors,
        isComplete: newCompletion.isComplete,
        completedCount: newCompletion.completedCount,
        hardConstraints: { ...categorized.hardConstraints, ...(hardConstraints || {}) },
        flexiblePreferences: { ...categorized.flexiblePreferences, ...(flexiblePreferences || {}) },
        importanceWeights: importanceWeights || {},
      });
    }

    // Refresh final completion status
    const finalFactors = profile.factors && Object.keys(profile.factors).length > 0
      ? profile.factors
      : mapCategorizedToFactors(profile.hardConstraints, profile.flexiblePreferences);
    const finalCompletion = validate22Factors(finalFactors);

    // Update user's onboarding completion status
    await User.findByIdAndUpdate(req.user._id, {
      hasCompletedOnboarding: finalCompletion.isComplete,
    });

    res.status(200).json({
      success: true,
      message: 'Preferences saved successfully.',
      data: profile,
      completion: finalCompletion,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @desc    Pre-validate preference values against the 22-factor schema
 * @route   POST /api/preferences/validate
 * @access  Public / Private
 */
export async function validatePreferences(req, res, next) {
  try {
    const { factors, hardConstraints, flexiblePreferences } = req.body;
    let input = factors;
    if (!input && (hardConstraints || flexiblePreferences)) {
      input = mapCategorizedToFactors(hardConstraints || {}, flexiblePreferences || {});
    }

    const validationResult = validate22Factors(input || {}, { requireAll: false });

    const warnings = [];
    const budgetVal = input?.budget ?? hardConstraints?.budgetCeiling;
    if (budgetVal !== undefined && budgetVal !== 'Flexible') {
      const bNum = Number(budgetVal);
      if (!isNaN(bNum) && bNum < 5000) {
        warnings.push({
          field: 'hardConstraints.budgetCeiling',
          message: 'Budget ceiling is below ₹5,000, which may severely restrict available matches in Indian metro hubs.',
        });
      }
    }

    const sleepVal = input?.sleepSchedule ?? flexiblePreferences?.sleepSchedule;
    const wakeVal = input?.wakeSchedule ?? flexiblePreferences?.wakeSchedule;
    if (sleepVal !== undefined && wakeVal !== undefined && sleepVal !== 'Flexible' && wakeVal !== 'Flexible') {
      const sleep = Number(sleepVal);
      const wake = Number(wakeVal);
      if (!isNaN(sleep) && !isNaN(wake)) {
        const duration = wake >= sleep ? wake - sleep : 24 - sleep + wake;
        if (duration < 4 || duration > 12) {
          warnings.push({
            field: 'flexiblePreferences.sleepSchedule',
            message: `Computed sleep duration is ${duration.toFixed(1)} hours, which is outside typical 6-9 hour norms.`,
          });
        }
      }
    }

    res.status(200).json({
      success: true,
      isValid: validationResult.isValid,
      isComplete: validationResult.isComplete,
      warnings,
      completion: {
        completedCount: validationResult.completedCount,
        totalFactors: 22,
        isComplete: validationResult.isComplete,
        progressPercentage: validationResult.progressPercentage,
        missingFactors: validationResult.missingFactors,
        flexibleFactors: validationResult.flexibleFactors,
        specificFactors: validationResult.specificFactors,
      },
      errors: validationResult.errors,
    });
  } catch (error) {
    next(error);
  }
}
