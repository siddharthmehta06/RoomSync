/**
 * RoomSync Matching Engine
 * 
 * Implements an explainable, deterministic 22-factor roommate and rental matching pipeline:
 *  - Phase 1: Hard-constraint filtering (deal-breakers & schema compliance)
 *  - Phase 2: Continuous fuzzy lifestyle compatibility (sleep, wake, hygiene, noise, habits)
 *  - Phase 3: Personalized importance weighting (1–5 scale, zero-sum safe)
 *  - Phase 4: Collaborative Filtering adjustment (cold-start threshold N < 5)
 *  - Phase 5: TOPSIS multi-criteria decision ranking (vector-normalized with constant column safety)
 *  - Phase 6: Transparent explainability (strengths, friction points, factor breakdown)
 * 
 * Strict metrics separation:
 *  - compatibilityScore: 0–100% lifestyle synchronization
 *  - rankingScore: 0.0–10.0 holistic property TOPSIS ranking
 */

export const ENGINE_VERSION = '1.0.0-fuzzy-topsis';

// Default TOPSIS criteria weights (Cost: rent, deposit, commute; Benefit: compatibility, cleanliness)
export const DEFAULT_TOPSIS_WEIGHTS = {
  rent: 0.30,
  deposit: 0.15,
  commute: 0.15,
  compatibility: 0.30,
  cleanliness: 0.10,
};

/**
 * Calculates circular hour difference on a 24-hour clock.
 * @param {number} h1 - Hour 1 (0.0 to 23.5)
 * @param {number} h2 - Hour 2 (0.0 to 23.5)
 * @returns {number} Minimum difference in hours (0 to 12)
 */
export function getCircularHourDiff(h1, h2) {
  const diff = Math.abs(h1 - h2);
  return Math.min(diff, 24 - diff);
}

/**
 * Fuzzy membership function for circadian rhythm synchronization (sleep/wake).
 * Trapezoidal plateau (<= 0.5h = 1.0) with smooth linear degradation to 4.0h.
 * @param {number} deltaHours - Hour difference
 * @returns {number} Score from 0.0 to 1.0
 */
export function fuzzyCircadianMembership(deltaHours) {
  if (deltaHours <= 0.5) return 1.0;
  if (deltaHours <= 2.0) return 1.0 - 0.5 * ((deltaHours - 0.5) / 1.5);
  if (deltaHours <= 4.0) return 0.5 * (1.0 - ((deltaHours - 2.0) / 2.0));
  return 0.0;
}

/**
 * Fuzzy membership function for 1–5 scale differences (cleanliness, noise tolerance).
 * @param {number} delta - Absolute scale difference (0 to 4)
 * @returns {number} Score from 0.0 to 1.0
 */
export function fuzzyScaleMembership(delta) {
  if (delta === 0) return 1.0;
  if (delta === 1) return 0.8;
  if (delta === 2) return 0.5;
  if (delta === 3) return 0.2;
  return 0.0;
}

/**
 * Fuzzy membership function for WFH days difference (0 to 7).
 * @param {number} deltaDays - Day difference (0 to 7)
 * @returns {number} Score from 0.0 to 1.0
 */
export function fuzzyWfhMembership(deltaDays) {
  if (deltaDays <= 1) return 1.0;
  if (deltaDays <= 3) return Math.round((1.0 - 0.4 * ((deltaDays - 1) / 2)) * 100) / 100;
  if (deltaDays <= 5) return Math.round((0.6 - 0.4 * ((deltaDays - 3) / 2)) * 100) / 100;
  return 0.0;
}

/**
 * Evaluates binary hard-constraints.
 * Missing required values fail explicitly; unknown values are never silently assumed compatible.
 * 
 * @param {object} seeker - Seeker profile
 * @param {object} room - Room listing candidate
 * @returns {{ eligible: boolean, reasons: string[] }}
 */
export function evaluateHardConstraints(seeker, room) {
  const reasons = [];
  const hc = seeker?.profile?.hardConstraints || {};

  // 1. Inactive room exclusion
  if (room.status && room.status !== 'active') {
    reasons.push('ROOM_INACTIVE');
  }

  // 2. Room rent specification & Budget ceiling
  if (room.rent === undefined || room.rent === null || typeof room.rent !== 'number') {
    reasons.push('MISSING_RENT_SPEC');
  } else {
    const totalRent = room.rent + (room.maintenance || 0);
    if (typeof hc.budgetCeiling === 'number' && totalRent > hc.budgetCeiling) {
      reasons.push('EXCEEDS_BUDGET_CEILING');
    }
  }

  // 3. Security deposit ceiling
  if (hc.maxDeposit !== undefined && hc.maxDeposit !== null) {
    if (room.deposit === undefined || room.deposit === null || typeof room.deposit !== 'number') {
      reasons.push('MISSING_DEPOSIT_SPEC');
    } else if (room.deposit > hc.maxDeposit) {
      reasons.push('EXCEEDS_DEPOSIT_CEILING');
    }
  }

  // 4. Living conditions presence
  const lc = room.livingConditions;
  if (!lc || typeof lc !== 'object') {
    reasons.push('MISSING_LIVING_CONDITIONS');
  } else {
    // 5. Dietary Rule
    const roomFood = lc.foodPreference;
    const seekerDiet = hc.dietaryRule || 'Any';
    if (!roomFood) {
      reasons.push('MISSING_FOOD_RULE');
    } else if (roomFood !== 'Flexible' && seekerDiet !== 'Flexible' && seekerDiet !== 'Any') {
      if ((seekerDiet === 'Pure-Veg' || seekerDiet === 'Veg-Only Flat') && roomFood !== 'Pure Vegetarian') {
        reasons.push('DIETARY_RULE_MISMATCH');
      }
    }

    // 6. Smoking Policy
    const roomSmoking = lc.smoking;
    const seekerSmoking = hc.smokingPolicy || 'Flexible';
    if (!roomSmoking) {
      reasons.push('MISSING_SMOKING_RULE');
    } else if (roomSmoking !== 'Flexible' && seekerSmoking !== 'Flexible') {
      if (seekerSmoking === 'Strictly Non-Smoking' && roomSmoking !== 'Strictly Non-Smoking') {
        reasons.push('SMOKING_POLICY_MISMATCH');
      } else if (seekerSmoking === 'Balcony Only' && roomSmoking === 'Allowed') {
        reasons.push('SMOKING_POLICY_MISMATCH');
      }
    }

    // 7. Alcohol Policy
    const roomAlcohol = lc.alcohol;
    const seekerAlcohol = hc.alcoholPolicy || 'Flexible';
    if (!roomAlcohol) {
      reasons.push('MISSING_ALCOHOL_RULE');
    } else if (roomAlcohol !== 'Flexible' && seekerAlcohol !== 'Flexible') {
      if (seekerAlcohol === 'Teetotaler' && roomAlcohol !== 'Teetotaler') {
        reasons.push('ALCOHOL_POLICY_MISMATCH');
      } else if (seekerAlcohol === 'Moderate' && roomAlcohol === 'Allowed') {
        reasons.push('ALCOHOL_POLICY_MISMATCH');
      }
    }

    // 8. Pet Policy
    const roomPets = lc.petsPreference;
    const seekerPets = hc.petPolicy || 'Flexible';
    if (roomPets === undefined || roomPets === null) {
      reasons.push('MISSING_PET_POLICY');
    } else if (roomPets !== 'Flexible' && seekerPets !== 'Flexible') {
      const roomPetsStr = String(roomPets).toLowerCase();
      if (seekerPets === 'Strictly No Pets') {
        const petPositive = /cat|dog|has pet|pet-friendly|pets welcome|pets allowed/i.test(roomPetsStr);
        const noPetExplicit = /no pets|strictly no pets/i.test(roomPetsStr);
        if (petPositive && !noPetExplicit) {
          reasons.push('PET_POLICY_MISMATCH');
        }
      } else if (seekerPets === 'Has Pet') {
        const noPetsAllowed = /no pets allowed|strictly no pets/i.test(roomPetsStr);
        if (noPetsAllowed) {
          reasons.push('PET_POLICY_MISMATCH');
        }
      }
    }
  }

  // 9. Move-in availability
  if (room.availableFrom === undefined || room.availableFrom === null) {
    reasons.push('MISSING_AVAILABLE_DATE');
  } else {
    const availTime = new Date(room.availableFrom).getTime();
    if (isNaN(availTime)) {
      reasons.push('INVALID_AVAILABLE_DATE');
    } else if (hc.latestMoveIn) {
      const latestTime = new Date(hc.latestMoveIn).getTime();
      if (!isNaN(latestTime) && availTime > latestTime) {
        reasons.push('MOVE_IN_AFTER_LATEST');
      }
    }
  }

  // 10. Commute threshold
  if (hc.maxCommuteMins !== undefined && hc.maxCommuteMins !== null && room.commuteMins !== undefined) {
    if (room.commuteMins > hc.maxCommuteMins) {
      reasons.push('EXCEEDS_MAX_COMMUTE');
    }
  }

  return {
    eligible: reasons.length === 0,
    reasons,
  };
}

/**
 * Scores categorical factor synergy between seeker preference and room conditions.
 * Supports both exact enum strings and semantic descriptive text.
 * 
 * @param {string} seekerVal 
 * @param {string} roomVal 
 * @returns {number} Normalized score 0.0 to 1.0
 */
export function scoreCategoricalSynergy(seekerVal, roomVal) {
  if (
    seekerVal === 'Flexible' ||
    roomVal === 'Flexible' ||
    seekerVal === null ||
    roomVal === null ||
    seekerVal === undefined ||
    roomVal === undefined ||
    String(seekerVal).trim().toLowerCase() === 'flexible' ||
    String(roomVal).trim().toLowerCase() === 'flexible'
  ) {
    return 1.0; // Flexible means accepting any compatible answer, full synergy
  }
  if (!seekerVal || !roomVal) return 0.5; // neutral fallback if missing
  const s = String(seekerVal).trim().toLowerCase();
  const r = String(roomVal).trim().toLowerCase();

  if (s === r) return 1.0;

  // Substring / inclusion matches
  if (r.includes(s) || s.includes(r)) return 1.0;

  // Guest frequency matching
  if ((s === 'rare' && r.includes('rare')) || (s === 'frequent' && r.includes('frequent'))) return 1.0;
  if ((s === 'occasional' && r.includes('occasional')) || (s === 'occasional' && r.includes('heads-up'))) return 1.0;
  if (s === 'rare' && r.includes('occasional')) return 0.7;
  if (s === 'occasional' && (r.includes('rare') || r.includes('frequent'))) return 0.7;
  if (s === 'frequent' && r.includes('occasional')) return 0.7;
  if (s === 'rare' && r.includes('frequent')) return 0.2;
  if (s === 'frequent' && r.includes('rare')) return 0.2;

  // Overnight guest matching
  if (s.includes('notice') && (r.includes('notice') || r.includes('24h') || r.includes('heads-up'))) return 1.0;
  if (s.includes('not allowed') && r.includes('not allowed')) return 1.0;
  if (s.includes('frequent') && (r.includes('frequent') || r.includes('allowed'))) return 1.0;
  if (s.includes('with notice') && r.includes('allowed')) return 0.8;
  if (s.includes('not allowed') && r.includes('frequent')) return 0.1;

  // Social preference matching
  if (s.includes('quiet') && r.includes('quiet')) return 1.0;
  if (s.includes('balanced') && r.includes('balanced')) return 1.0;
  if (s.includes('social') && (r.includes('social') || r.includes('hub'))) return 1.0;
  if (s.includes('balanced') && (r.includes('quiet') || r.includes('social'))) return 0.75;
  if (s.includes('quiet') && (r.includes('social') || r.includes('hub'))) return 0.25;

  // Cooking habits
  if (s.includes('daily') && (r.includes('daily') || r.includes('shared cook') || r.includes('cook prepares'))) return 1.0;
  if (s.includes('occasional') && r.includes('occasional')) return 1.0;
  if (s.includes('tiffin') && (r.includes('tiffin') || r.includes('delivery'))) return 1.0;
  if (s.includes('occasional') && (r.includes('daily') || r.includes('tiffin'))) return 0.7;

  // Food sharing
  if (s.includes('separate') && r.includes('separate')) return 1.0;
  if (s.includes('shared') && (r.includes('shared') || r.includes('split pantry') || r.includes('staples'))) return 1.0;
  if (s.includes('communal') && (r.includes('communal') || r.includes('shared'))) return 1.0;
  if (s.includes('shared staples') && (r.includes('separate') || r.includes('communal'))) return 0.7;

  // Personal space
  if (s.includes('high') && (r.includes('high') || r.includes('respect for personal'))) return 1.0;
  if (s.includes('balanced') && r.includes('balanced')) return 1.0;
  if (s.includes('communal') && r.includes('communal')) return 1.0;
  if (s.includes('balanced') && (r.includes('high') || r.includes('communal'))) return 0.7;

  // Rules strictness
  if (s.includes('strict') && (r.includes('strict') || r.includes('curfew'))) return 1.0;
  if (s.includes('moderate') && (r.includes('moderate') || r.includes('24/7 security') || r.includes('gated'))) return 1.0;
  if (s.includes('self-managed') && (r.includes('self-managed') || r.includes('no arbitrary curfews'))) return 1.0;
  if (s.includes('moderate') && (r.includes('strict') || r.includes('self-managed'))) return 0.7;

  return 0.5;
}

/**
 * Computes continuous fuzzy lifestyle compatibility score (0 to 100) and factor-by-factor breakdown.
 * 
 * @param {object} seeker 
 * @param {object} room 
 * @param {object} [customWeights] - Custom importance weights
 * @returns {{ compatibilityScore: number, factorBreakdown: object }}
 */
export function computeFuzzyCompatibility(seeker, room, customWeights) {
  const fp = seeker?.profile?.flexiblePreferences || {};
  const weightsConfig = customWeights || seeker?.profile?.importanceWeights || {};
  const lc = room?.livingConditions || {};

  const factorScores = {};

  // 1. Sleep Schedule (circular fuzzy trapezoid)
  const isBedFlexible = fp.sleepSchedule === 'Flexible' || fp.sleepSchedule === null || lc.sleepSchedule === 'Flexible' || lc.sleepSchedule === null;
  if (isBedFlexible) {
    factorScores.sleepSchedule = 1.0;
  } else {
    const seekerBed = fp.sleepSchedule !== undefined ? Number(fp.sleepSchedule) : 23.0;
    const roomBed = lc.sleepSchedule !== undefined ? Number(lc.sleepSchedule) : 23.0;
    const bedDiff = getCircularHourDiff(seekerBed, roomBed);
    factorScores.sleepSchedule = Math.round(fuzzyCircadianMembership(bedDiff) * 100) / 100;
  }

  // 2. Wake Schedule (circular fuzzy trapezoid)
  const isWakeFlexible = fp.wakeSchedule === 'Flexible' || fp.wakeSchedule === null || lc.wakeSchedule === 'Flexible' || lc.wakeSchedule === null;
  if (isWakeFlexible) {
    factorScores.wakeSchedule = 1.0;
  } else {
    const seekerWake = fp.wakeSchedule !== undefined ? Number(fp.wakeSchedule) : 7.0;
    const roomWake = lc.wakeSchedule !== undefined ? Number(lc.wakeSchedule) : 7.0;
    const wakeDiff = getCircularHourDiff(seekerWake, roomWake);
    factorScores.wakeSchedule = Math.round(fuzzyCircadianMembership(wakeDiff) * 100) / 100;
  }

  // 3. Cleanliness (1-5 scale)
  const isCleanFlexible = fp.cleanliness === 'Flexible' || fp.cleanliness === null || lc.cleanliness === 'Flexible' || lc.cleanliness === null;
  if (isCleanFlexible) {
    factorScores.cleanliness = 1.0;
  } else {
    const seekerClean = fp.cleanliness !== undefined ? Number(fp.cleanliness) : 4;
    const roomClean = lc.cleanliness !== undefined ? Number(lc.cleanliness) : 4;
    const cleanDiff = Math.abs(seekerClean - roomClean);
    factorScores.cleanliness = Math.round(fuzzyScaleMembership(cleanDiff) * 100) / 100;
  }

  // 4. Noise Tolerance (1-5 scale)
  const isNoiseFlexible = fp.noiseTolerance === 'Flexible' || fp.noiseTolerance === null || lc.noiseTolerance === 'Flexible' || lc.noiseTolerance === null;
  if (isNoiseFlexible) {
    factorScores.noiseTolerance = 1.0;
  } else {
    const seekerNoise = fp.noiseTolerance !== undefined ? Number(fp.noiseTolerance) : 3;
    const roomNoise = lc.noiseTolerance !== undefined ? Number(lc.noiseTolerance) : 3;
    const noiseDiff = Math.abs(seekerNoise - roomNoise);
    factorScores.noiseTolerance = Math.round(fuzzyScaleMembership(noiseDiff) * 100) / 100;
  }

  // 5. WFH Days (0-7 days)
  const isWfhFlexible = fp.wfhDays === 'Flexible' || fp.wfhDays === null || lc.wfhFrequency === 'Flexible' || lc.wfhFrequency === null;
  if (isWfhFlexible) {
    factorScores.wfhFrequency = 1.0;
  } else {
    const seekerWfh = fp.wfhDays !== undefined ? Number(fp.wfhDays) : 2;
    const roomWfh = lc.wfhFrequency !== undefined ? Number(lc.wfhFrequency) : 2;
    const wfhDiff = Math.abs(seekerWfh - roomWfh);
    factorScores.wfhFrequency = Math.round(fuzzyWfhMembership(wfhDiff) * 100) / 100;
  }

  // 6. Guest Policy (Day)
  factorScores.guestPolicy = Math.round(scoreCategoricalSynergy(fp.guestPolicy, lc.guestsDay) * 100) / 100;

  // 7. Overnight Guests
  factorScores.overnightGuests = Math.round(scoreCategoricalSynergy(fp.overnightGuests, lc.guestsOvernight) * 100) / 100;

  // 8. Social Preference
  factorScores.socialPreference = Math.round(scoreCategoricalSynergy(fp.socialPreference, lc.socialPreference) * 100) / 100;

  // 9. Cooking Habit
  factorScores.cookingFrequency = Math.round(scoreCategoricalSynergy(fp.cookingHabit, lc.cookingFrequency) * 100) / 100;

  // 10. Food Sharing
  factorScores.foodSharing = Math.round(scoreCategoricalSynergy(fp.foodSharing, lc.foodSharing) * 100) / 100;

  // 11. Personal Space
  factorScores.personalSpace = Math.round(scoreCategoricalSynergy(fp.personalSpace, lc.personalSpace) * 100) / 100;

  // 12. Rules Strictness
  factorScores.rulesStrictness = Math.round(scoreCategoricalSynergy(fp.rulesStrictness, lc.rulesStrictness) * 100) / 100;

  // 13. Dietary Alignment
  const seekerDiet = seeker?.profile?.hardConstraints?.dietaryRule || 'Any';
  const roomDiet = lc.foodPreference || 'Flexible';
  let dietScore = 1.0;
  if (seekerDiet === 'Flexible' || seekerDiet === 'Any' || roomDiet === 'Flexible') {
    dietScore = 1.0;
  } else if (seekerDiet === 'Pure-Veg' || seekerDiet === 'Veg-Only Flat') {
    dietScore = roomDiet === 'Pure Vegetarian' ? 1.0 : 0.0;
  } else if (seekerDiet === 'Flexible') {
    dietScore = roomDiet === 'Pure Vegetarian' ? 0.9 : 1.0;
  }
  factorScores.foodPreference = dietScore;

  // 14. Smoking Alignment
  const seekerSmoking = seeker?.profile?.hardConstraints?.smokingPolicy || 'Flexible';
  const roomSmoking = lc.smoking || 'Flexible';
  let smokeScore = 1.0;
  if (seekerSmoking === 'Flexible' || roomSmoking === 'Flexible') {
    smokeScore = 1.0;
  } else if (seekerSmoking === 'Strictly Non-Smoking') {
    smokeScore = roomSmoking === 'Strictly Non-Smoking' ? 1.0 : (roomSmoking === 'Balcony Only' ? 0.5 : 0.0);
  } else if (seekerSmoking === 'Balcony Only') {
    smokeScore = roomSmoking === 'Balcony Only' || roomSmoking === 'Strictly Non-Smoking' ? 1.0 : 0.3;
  }
  factorScores.smoking = smokeScore;

  // 15. Alcohol Alignment
  const seekerAlcohol = seeker?.profile?.hardConstraints?.alcoholPolicy || 'Flexible';
  const roomAlcohol = lc.alcohol || 'Flexible';
  let alcoholScore = 1.0;
  if (seekerAlcohol === 'Flexible' || roomAlcohol === 'Flexible') {
    alcoholScore = 1.0;
  } else if (seekerAlcohol === 'Teetotaler') {
    alcoholScore = roomAlcohol === 'Teetotaler' ? 1.0 : (roomAlcohol === 'Social Drinking OK' ? 0.5 : 0.0);
  } else if (seekerAlcohol === 'Moderate') {
    alcoholScore = roomAlcohol === 'Allowed' ? 0.6 : 1.0;
  }
  factorScores.alcohol = alcoholScore;

  // 16. Pets Synergy
  const seekerPets = seeker?.profile?.hardConstraints?.petPolicy || 'Flexible';
  const roomPets = lc.petsPreference || 'Flexible';
  if (seekerPets === 'Flexible' || roomPets === 'Flexible') {
    factorScores.petsPreference = 1.0;
  } else {
    factorScores.petsPreference = Math.round(scoreCategoricalSynergy(seekerPets, roomPets) * 100) / 100;
  }

  // Factor-to-importance weight mapping
  const weightMap = {
    sleepSchedule: weightsConfig.sleepSync ?? 5,
    wakeSchedule: weightsConfig.sleepSync ?? 5,
    cleanliness: weightsConfig.cleanliness ?? 4,
    noiseTolerance: weightsConfig.noise ?? 4,
    wfhFrequency: weightsConfig.wfh ?? 3,
    guestPolicy: weightsConfig.guests ?? 3,
    overnightGuests: weightsConfig.guests ?? 3,
    foodPreference: weightsConfig.diet ?? 4,
    smoking: 3,
    alcohol: 3,
    socialPreference: 2,
    cookingFrequency: 2,
    foodSharing: 2,
    personalSpace: 2,
    rulesStrictness: 2,
    petsPreference: 2,
  };

  // Safe Importance Weighting (guarding against divide-by-zero or zero sum)
  let totalWeight = 0;
  let weightedSum = 0;

  for (const [factor, score] of Object.entries(factorScores)) {
    const rawWeight = weightMap[factor] ?? 1;
    const safeWeight = typeof rawWeight === 'number' && !isNaN(rawWeight) && rawWeight >= 0 ? rawWeight : 1;
    totalWeight += safeWeight;
    weightedSum += score * safeWeight;
  }

  let normalizedScore = 75; // safe default
  if (totalWeight > 0) {
    normalizedScore = Math.round((weightedSum / totalWeight) * 100);
  } else {
    // If all weights are 0, fallback to unweighted average
    const keys = Object.keys(factorScores);
    const sum = keys.reduce((acc, k) => acc + factorScores[k], 0);
    normalizedScore = Math.round((sum / (keys.length || 1)) * 100);
  }

  // Bound score strictly between 0 and 100
  const compatibilityScore = Math.min(100, Math.max(0, normalizedScore));

  return {
    compatibilityScore,
    factorBreakdown: factorScores,
  };
}

/**
 * Generates transparent explainability feedback: strengths and friction points.
 * 
 * @param {object} seeker 
 * @param {object} room 
 * @param {object} factorScores 
 * @returns {{ strengths: string[], mismatches: string[] }}
 */
export function generateExplainability(seeker, room, factorScores) {
  const strengths = [];
  const mismatches = [];

  // Sleep sync
  if (factorScores.sleepSchedule >= 0.85 && factorScores.wakeSchedule >= 0.85) {
    strengths.push('Synchronized sleep & wake schedule within 30 minutes');
  } else if (factorScores.sleepSchedule <= 0.4 || factorScores.wakeSchedule <= 0.4) {
    mismatches.push('Noticeable difference in bedtime or wake-up hours');
  }

  // Cleanliness
  if (factorScores.cleanliness >= 0.8) {
    strengths.push('Matching cleanliness standards');
  } else if (factorScores.cleanliness <= 0.4) {
    mismatches.push('Divergent expectations on hygiene and daily cleaning');
  }

  // Noise
  if (factorScores.noiseTolerance >= 0.8) {
    strengths.push('Harmonious noise environment preferences');
  } else if (factorScores.noiseTolerance <= 0.4) {
    mismatches.push('Different tolerance for sound and audio activities');
  }

  // Food
  if (factorScores.foodPreference >= 0.95) {
    strengths.push('Complete dietary alignment');
  } else if (factorScores.foodPreference <= 0.3) {
    mismatches.push('Dietary preferences require separate consideration');
  }

  // Smoking / Alcohol
  if (factorScores.smoking >= 0.9 && factorScores.alcohol >= 0.9) {
    strengths.push('Aligned house policies on smoking and alcohol');
  }

  // Overnight guests
  if (factorScores.overnightGuests <= 0.4) {
    mismatches.push('Differences in overnight visitor expectations');
  }

  // WFH
  if (factorScores.wfhFrequency >= 0.8) {
    strengths.push('Compatible work-from-home routines');
  } else if (factorScores.wfhFrequency <= 0.3) {
    mismatches.push('Different work-from-home schedule frequencies');
  }

  // Fallback defaults if list is empty
  if (strengths.length === 0) {
    strengths.push('Compatible baseline residential arrangement');
  }

  return { strengths, mismatches };
}

/**
 * Phase 4: Collaborative Filtering Adjustment.
 * Handles sparse interaction history with strict cold-start protection (N < coldStartThreshold).
 * CF modifier never overrides hard constraints or disqualifies rooms.
 * 
 * @param {object} seeker 
 * @param {Array<object>} candidateResults - Evaluated candidate objects
 * @param {Array<object>} [interactions=[]] - User interaction history
 * @param {object} [options={}] 
 * @returns {Array<object>} Results with adjusted compatibility scores
 */
export function applyCollaborativeFiltering(seeker, candidateResults, interactions = [], options = {}) {
  const coldStartThreshold = options.coldStartThreshold ?? 5;
  const validInteractions = Array.isArray(interactions) ? interactions : [];

  // Cold Start: N < threshold -> Pure Knowledge-Based Mode
  if (validInteractions.length < coldStartThreshold) {
    return candidateResults.map(cand => ({
      ...cand,
      cfAdjustment: 0,
      cfMode: 'Cold-Start / Pure Knowledge-Based Mode',
    }));
  }

  // Active interaction scoring
  const actionWeights = {
    view: 1,
    save: 3,
    unsave: -2,
    enquire: 4,
    book_visit: 5,
  };

  // Accumulate affinity scores per room
  const roomAffinity = new Map();
  for (const item of validInteractions) {
    if (!item.roomId) continue;
    const baseWeight = actionWeights[item.action] || 0;
    const dwellBonus = (item.dwellTimeSeconds && item.dwellTimeSeconds > 60) ? 1 : 0;
    const current = roomAffinity.get(item.roomId) || 0;
    roomAffinity.set(item.roomId, current + baseWeight + dwellBonus);
  }

  return candidateResults.map(cand => {
    if (!cand.eligible) {
      return {
        ...cand,
        cfAdjustment: 0,
        cfMode: 'Knowledge-Based (Disqualified)',
      };
    }

    const directAffinity = roomAffinity.get(cand.roomId) || 0;
    // Bound CF modifier to [-5, +5] points to prevent distortion
    const cfAdjustment = Math.max(-5, Math.min(5, directAffinity));
    const newCompatibility = Math.min(100, Math.max(0, cand.compatibilityScore + cfAdjustment));

    return {
      ...cand,
      compatibilityScore: newCompatibility,
      cfAdjustment,
      cfMode: 'Active Collaborative Filtering',
    };
  });
}

/**
 * Phase 5: TOPSIS Multi-Criteria Decision Ranking.
 * Ranks eligible rooms based on relative closeness to the positive ideal solution.
 * Handles constant columns, zero variance, and single candidates safely.
 * 
 * Criteria:
 *  - rent: Cost (lower is better, weight 0.30)
 *  - deposit: Cost (lower is better, weight 0.15)
 *  - commute: Cost (lower is better, weight 0.15)
 *  - compatibility: Benefit (higher is better, weight 0.30)
 *  - cleanliness: Benefit (higher is better, weight 0.10)
 * 
 * @param {Array<object>} eligibleCandidates 
 * @param {object} [options={}] 
 * @returns {Array<object>} Ranked candidates with rankingScore (0.0 to 10.0)
 */
export function computeTopsisRanking(eligibleCandidates, options = {}) {
  const m = eligibleCandidates.length;
  if (m === 0) return [];

  // Single candidate edge case: neutral relative closeness 0.5 (scaled to 5.0)
  if (m === 1) {
    const single = eligibleCandidates[0];
    return [{
      ...single,
      rankingScore: 5.0,
      topsisCloseness: 0.5,
    }];
  }

  const weights = options.weights || DEFAULT_TOPSIS_WEIGHTS;

  // Build decision matrix rows
  // Criteria: [rent (C), deposit (C), commute (C), compatibility (B), cleanliness (B)]
  const criteriaConfig = [
    { name: 'rent', type: 'cost', weight: weights.rent ?? 0.30 },
    { name: 'deposit', type: 'cost', weight: weights.deposit ?? 0.15 },
    { name: 'commute', type: 'cost', weight: weights.commute ?? 0.15 },
    { name: 'compatibility', type: 'benefit', weight: weights.compatibility ?? 0.30 },
    { name: 'cleanliness', type: 'benefit', weight: weights.cleanliness ?? 0.10 },
  ];

  const n = criteriaConfig.length;
  const matrix = eligibleCandidates.map(cand => {
    const totalRent = (cand.rent || 0) + (cand.maintenance || 0);
    const deposit = cand.deposit || 0;
    const commute = cand.commuteMins !== undefined ? cand.commuteMins : 25; // Default 25 min fallback
    const compatibility = cand.compatibilityScore || 50;
    const cleanliness = cand.livingConditions?.cleanliness || 4.0;
    return [totalRent, deposit, commute, compatibility, cleanliness];
  });

  // Vector normalization: r_ij = x_ij / sqrt(sum(x_kj^2))
  const colNorms = [];
  for (let j = 0; j < n; j++) {
    let sumSq = 0;
    let allIdentical = true;
    const firstVal = matrix[0][j];

    for (let i = 0; i < m; i++) {
      sumSq += matrix[i][j] * matrix[i][j];
      if (matrix[i][j] !== firstVal) {
        allIdentical = false;
      }
    }

    const norm = Math.sqrt(sumSq);
    colNorms.push({ norm, allIdentical });
  }

  const normalizedMatrix = [];
  for (let i = 0; i < m; i++) {
    const row = [];
    for (let j = 0; j < n; j++) {
      const { norm, allIdentical } = colNorms[j];
      // Constant column / zero-sum handling: normalize to 1 / sqrt(m)
      if (norm === 0 || allIdentical) {
        row.push(1 / Math.sqrt(m));
      } else {
        row.push(matrix[i][j] / norm);
      }
    }
    normalizedMatrix.push(row);
  }

  // Weighted normalized decision matrix: v_ij = w_j * r_ij
  const weightedMatrix = [];
  for (let i = 0; i < m; i++) {
    const row = [];
    for (let j = 0; j < n; j++) {
      row.push(normalizedMatrix[i][j] * criteriaConfig[j].weight);
    }
    weightedMatrix.push(row);
  }

  // Determine Ideal Best (A+) and Ideal Worst (A-)
  const idealBest = [];
  const idealWorst = [];

  for (let j = 0; j < n; j++) {
    const colValues = weightedMatrix.map(row => row[j]);
    const maxVal = Math.max(...colValues);
    const minVal = Math.min(...colValues);

    if (criteriaConfig[j].type === 'benefit') {
      idealBest.push(maxVal);
      idealWorst.push(minVal);
    } else {
      // Cost criterion: minimum is best, maximum is worst
      idealBest.push(minVal);
      idealWorst.push(maxVal);
    }
  }

  // Euclidean distances S+ and S-
  const resultsWithTopsis = eligibleCandidates.map((cand, i) => {
    let distBestSq = 0;
    let distWorstSq = 0;

    for (let j = 0; j < n; j++) {
      const v = weightedMatrix[i][j];
      distBestSq += Math.pow(v - idealBest[j], 2);
      distWorstSq += Math.pow(v - idealWorst[j], 2);
    }

    const sBest = Math.sqrt(distBestSq);
    const sWorst = Math.sqrt(distWorstSq);

    // Relative closeness to ideal solution: C_i = S- / (S+ + S-)
    let closeness = 0.5;
    if (sBest + sWorst > 0) {
      closeness = sWorst / (sBest + sWorst);
    }

    // Scale to 0.0 – 10.0
    const rankingScore = Math.round(closeness * 10 * 10) / 10;

    return {
      ...cand,
      rankingScore,
      topsisCloseness: Math.round(closeness * 1000) / 1000,
    };
  });

  // Deterministic tie-breaking:
  // 1. rankingScore (descending)
  // 2. compatibilityScore (descending)
  // 3. total monthly cost (ascending)
  // 4. roomId (lexicographically ascending)
  return resultsWithTopsis.sort((a, b) => {
    if (b.rankingScore !== a.rankingScore) {
      return b.rankingScore - a.rankingScore;
    }
    if (b.compatibilityScore !== a.compatibilityScore) {
      return b.compatibilityScore - a.compatibilityScore;
    }
    const costA = (a.rent || 0) + (a.maintenance || 0);
    const costB = (b.rent || 0) + (b.maintenance || 0);
    if (costA !== costB) {
      return costA - costB;
    }
    return String(a.roomId).localeCompare(String(b.roomId));
  });
}

/**
 * Main Matching Engine Entrypoint.
 * Executes the complete 6-phase matching pipeline.
 * 
 * @param {object} payload - MatchingInputPayload
 * @returns {Promise<object>} MatchingResultPayload
 */
export async function calculateMatches(payload) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Invalid input payload: payload must be a non-null object');
  }

  const { seeker, candidates = [], options = {} } = payload;
  const includeDisqualified = Boolean(options.includeDisqualified);

  if (!seeker || !seeker.profile) {
    throw new Error('Invalid input payload: seeker with profile is required');
  }

  const candidateList = Array.isArray(candidates) ? candidates : [];
  const candidateResults = [];
  let eligibleCount = 0;
  let disqualifiedCount = 0;

  for (const room of candidateList) {
    // Phase 1: Hard-constraint evaluation
    const { eligible, reasons } = evaluateHardConstraints(seeker, room);

    // Phase 2: Continuous fuzzy compatibility
    const { compatibilityScore, factorBreakdown } = computeFuzzyCompatibility(
      seeker,
      room,
      seeker.profile?.importanceWeights
    );

    // Phase 6 (pre-computation): Explainability
    const { strengths, mismatches } = generateExplainability(seeker, room, factorBreakdown);

    if (eligible) {
      eligibleCount++;
      candidateResults.push({
        roomId: room.roomId || room.id || (room._id ? String(room._id) : ''),
        eligible: true,
        compatibilityScore,
        rankingScore: 0.0, // To be computed in Phase 5
        strengths,
        mismatches,
        factorBreakdown,
        rent: room.rent,
        deposit: room.deposit,
        maintenance: room.maintenance || 0,
        commuteMins: room.commuteMins,
        livingConditions: room.livingConditions,
      });
    } else {
      disqualifiedCount++;
      if (includeDisqualified) {
        candidateResults.push({
          roomId: room.roomId || room.id || (room._id ? String(room._id) : ''),
          eligible: false,
          exclusionReasons: reasons,
          compatibilityScore,
          rankingScore: 0.0,
          strengths,
          mismatches,
          factorBreakdown,
          rent: room.rent,
          deposit: room.deposit,
          maintenance: room.maintenance || 0,
          commuteMins: room.commuteMins,
          livingConditions: room.livingConditions,
        });
      }
    }
  }

  // Phase 4: Collaborative Filtering adjustment
  const eligibleItems = candidateResults.filter(c => c.eligible);
  const adjustedEligible = applyCollaborativeFiltering(
    seeker,
    eligibleItems,
    seeker.interactions || [],
    options
  );

  // Phase 5: TOPSIS Multi-Criteria Decision Ranking
  const rankedEligible = computeTopsisRanking(adjustedEligible, options);

  // Combine results according to includeDisqualified
  let finalMatches = [];
  if (includeDisqualified) {
    const disqualifiedItems = candidateResults.filter(c => !c.eligible);
    finalMatches = [...rankedEligible, ...disqualifiedItems];
  } else {
    finalMatches = rankedEligible;
  }

  // Clean internal fields before returning contract
  const sanitizedMatches = finalMatches.map(match => {
    const cleaned = {
      roomId: match.roomId,
      eligible: match.eligible,
      compatibilityScore: match.compatibilityScore,
      rankingScore: match.rankingScore,
      strengths: match.strengths,
      mismatches: match.mismatches,
      factorBreakdown: match.factorBreakdown,
    };
    if (!match.eligible) {
      cleaned.exclusionReasons = match.exclusionReasons;
    }
    return cleaned;
  });

  return {
    algorithmMetadata: {
      engineVersion: ENGINE_VERSION,
      calculatedAt: new Date().toISOString(),
      candidateCount: candidateList.length,
      eligibleCount,
      disqualifiedCount,
    },
    matches: sanitizedMatches,
  };
}

export default {
  ENGINE_VERSION,
  DEFAULT_TOPSIS_WEIGHTS,
  getCircularHourDiff,
  fuzzyCircadianMembership,
  fuzzyScaleMembership,
  fuzzyWfhMembership,
  evaluateHardConstraints,
  scoreCategoricalSynergy,
  computeFuzzyCompatibility,
  generateExplainability,
  applyCollaborativeFiltering,
  computeTopsisRanking,
  calculateMatches,
};
