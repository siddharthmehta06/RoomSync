import PreferenceProfile from '../models/PreferenceProfile.js';
import User from '../models/User.js';
import { checkFactorsCompletion } from '../utils/factorValidation.js';

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
        message:
          'Preference profile not found. Please complete the onboarding questionnaire.',
        error: {
          code: 'PROFILE_NOT_FOUND',
          message:
            'Preference profile not found. Please complete the onboarding questionnaire.',
          details: [],
        },
      });
    }

    const completion = checkFactorsCompletion(profile);

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
    const { hardConstraints, flexiblePreferences, importanceWeights } = req.body;

    let profile = await PreferenceProfile.findOne({ user: req.user._id });

    if (profile) {
      // Update existing profile
      if (hardConstraints) {
        profile.hardConstraints = {
          ...profile.hardConstraints.toObject(),
          ...hardConstraints,
        };
      }
      if (flexiblePreferences) {
        profile.flexiblePreferences = {
          ...profile.flexiblePreferences.toObject(),
          ...flexiblePreferences,
        };
      }
      if (importanceWeights) {
        profile.importanceWeights = {
          ...profile.importanceWeights.toObject(),
          ...importanceWeights,
        };
      }
      await profile.save();
    } else {
      // Create new profile for user
      profile = await PreferenceProfile.create({
        user: req.user._id,
        hardConstraints: hardConstraints || {},
        flexiblePreferences: flexiblePreferences || {},
        importanceWeights: importanceWeights || {},
      });
    }

    // Check completion of all 22 compatibility factors
    const completion = checkFactorsCompletion(profile);

    // Only mark onboarding as completed if ALL 22 factors are valid
    await User.findByIdAndUpdate(req.user._id, {
      hasCompletedOnboarding: completion.isComplete,
    });

    res.status(200).json({
      success: true,
      message: 'Preferences saved successfully.',
      data: profile,
      completion,
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
    const warnings = [];
    const { hardConstraints, flexiblePreferences, importanceWeights } = req.body;

    if (hardConstraints && flexiblePreferences) {
      // Check logical consistency warnings
      if (
        hardConstraints.budgetCeiling &&
        hardConstraints.budgetCeiling < 5000
      ) {
        warnings.push({
          field: 'hardConstraints.budgetCeiling',
          message:
            'Budget ceiling is below ₹5,000, which may severely restrict available matches in Indian metro hubs.',
        });
      }

      if (
        flexiblePreferences.sleepSchedule !== undefined &&
        flexiblePreferences.wakeSchedule !== undefined
      ) {
        const sleep = Number(flexiblePreferences.sleepSchedule);
        const wake = Number(flexiblePreferences.wakeSchedule);
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
      isValid: true,
      warnings,
    });
  } catch (error) {
    next(error);
  }
}
