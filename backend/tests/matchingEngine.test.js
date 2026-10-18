import {
  ENGINE_VERSION,
  getCircularHourDiff,
  fuzzyCircadianMembership,
  fuzzyScaleMembership,
  fuzzyWfhMembership,
  scoreCategoricalSynergy,
  evaluateHardConstraints,
  computeFuzzyCompatibility,
  applyCollaborativeFiltering,
  computeTopsisRanking,
  generateExplainability,
  calculateMatches,
} from '../src/services/MatchingEngine.js';

describe('RoomSync Matching Engine Unit Test Suite', () => {
  // Base Seeker Fixture
  const baseSeeker = {
    userId: 'user_seeker_101',
    profile: {
      hardConstraints: {
        budgetCeiling: 25000,
        maxDeposit: 50000,
        dietaryRule: 'Pure-Veg',
        smokingPolicy: 'Strictly Non-Smoking',
        alcoholPolicy: 'Teetotaler',
        petPolicy: 'Strictly No Pets',
        latestMoveIn: '2026-11-01T00:00:00.000Z',
      },
      flexiblePreferences: {
        sleepSchedule: 23.0,
        wakeSchedule: 7.0,
        cleanliness: 4,
        noiseTolerance: 2,
        wfhDays: 3,
        guestPolicy: 'Occasional',
        overnightGuests: 'With Notice',
        socialPreference: 'Balanced',
        cookingHabit: 'Daily',
        foodSharing: 'Separate Groceries',
        personalSpace: 'High',
        rulesStrictness: 'Moderate',
      },
      importanceWeights: {
        budget: 5,
        diet: 5,
        sleepSync: 5,
        cleanliness: 4,
        noise: 4,
        guests: 3,
        wfh: 3,
      },
    },
  };

  // Base Room Fixture
  const baseRoom = {
    roomId: 'room_koramangala_01',
    rent: 20000,
    maintenance: 2000,
    deposit: 40000,
    availableFrom: '2026-10-25T00:00:00.000Z',
    status: 'active',
    commuteMins: 20,
    livingConditions: {
      foodPreference: 'Pure Vegetarian',
      smoking: 'Strictly Non-Smoking',
      alcohol: 'Teetotaler',
      sleepSchedule: 23.5,
      wakeSchedule: 7.0,
      cleanliness: 4,
      noiseTolerance: 2,
      wfhFrequency: 3,
      guestsDay: 'Occasional friends visiting with prior heads-up',
      guestsOvernight: 'Allowed with 24h prior notification',
      socialPreference: 'Balanced',
      cookingFrequency: 'Daily home cooking',
      foodSharing: 'Separate Groceries',
      personalSpace: 'High',
      rulesStrictness: 'Moderate',
      petsPreference: 'Strictly no pets allowed',
    },
  };

  // ==========================================
  // 1. HARD CONSTRAINT FILTERING TESTS
  // ==========================================
  describe('Phase 1: Hard-Constraint Filtering', () => {
    it('should pass an eligible room meeting all hard constraints', () => {
      const evaluation = evaluateHardConstraints(baseSeeker, baseRoom);
      expect(evaluation.eligible).toBe(true);
      expect(evaluation.reasons).toHaveLength(0);
    });

    it('should disqualify a room exceeding the budget ceiling (rent + maintenance)', () => {
      const expensiveRoom = {
        ...baseRoom,
        rent: 24000,
        maintenance: 2500, // Total 26,500 > 25,000 ceiling
      };
      const evaluation = evaluateHardConstraints(baseSeeker, expensiveRoom);
      expect(evaluation.eligible).toBe(false);
      expect(evaluation.reasons).toContain('EXCEEDS_BUDGET_CEILING');
    });

    it('should disqualify a room exceeding the deposit ceiling', () => {
      const highDepositRoom = {
        ...baseRoom,
        deposit: 60000, // Ceiling is 50,000
      };
      const evaluation = evaluateHardConstraints(baseSeeker, highDepositRoom);
      expect(evaluation.eligible).toBe(false);
      expect(evaluation.reasons).toContain('EXCEEDS_DEPOSIT_CEILING');
    });

    it('should disqualify a room with dietary rule mismatch for Pure-Veg seeker', () => {
      const nonVegRoom = {
        ...baseRoom,
        livingConditions: {
          ...baseRoom.livingConditions,
          foodPreference: 'Non-Veg Welcome',
        },
      };
      const evaluation = evaluateHardConstraints(baseSeeker, nonVegRoom);
      expect(evaluation.eligible).toBe(false);
      expect(evaluation.reasons).toContain('DIETARY_RULE_MISMATCH');
    });

    it('should disqualify a room violating strictly non-smoking policy', () => {
      const smokingRoom = {
        ...baseRoom,
        livingConditions: {
          ...baseRoom.livingConditions,
          smoking: 'Allowed',
        },
      };
      const evaluation = evaluateHardConstraints(baseSeeker, smokingRoom);
      expect(evaluation.eligible).toBe(false);
      expect(evaluation.reasons).toContain('SMOKING_POLICY_MISMATCH');
    });

    it('should disqualify a room violating teetotaler alcohol policy', () => {
      const drinkingRoom = {
        ...baseRoom,
        livingConditions: {
          ...baseRoom.livingConditions,
          alcohol: 'Allowed',
        },
      };
      const evaluation = evaluateHardConstraints(baseSeeker, drinkingRoom);
      expect(evaluation.eligible).toBe(false);
      expect(evaluation.reasons).toContain('ALCOHOL_POLICY_MISMATCH');
    });

    it('should disqualify a pet-welcoming flat when seeker requires strictly no pets', () => {
      const petRoom = {
        ...baseRoom,
        livingConditions: {
          ...baseRoom.livingConditions,
          petsPreference: 'Cat-friendly flat; two resident indoor cats',
        },
      };
      const evaluation = evaluateHardConstraints(baseSeeker, petRoom);
      expect(evaluation.eligible).toBe(false);
      expect(evaluation.reasons).toContain('PET_POLICY_MISMATCH');
    });

    it('should disqualify a room available after seeker latest move-in date', () => {
      const lateRoom = {
        ...baseRoom,
        availableFrom: '2026-11-15T00:00:00.000Z', // Seeker latest is 2026-11-01
      };
      const evaluation = evaluateHardConstraints(baseSeeker, lateRoom);
      expect(evaluation.eligible).toBe(false);
      expect(evaluation.reasons).toContain('MOVE_IN_AFTER_LATEST');
    });

    it('should reject inactive listings', () => {
      const inactiveRoom = {
        ...baseRoom,
        status: 'occupied',
      };
      const evaluation = evaluateHardConstraints(baseSeeker, inactiveRoom);
      expect(evaluation.eligible).toBe(false);
      expect(evaluation.reasons).toContain('ROOM_INACTIVE');
    });

    it('should fail explicitly on missing required values instead of silently assuming compatibility', () => {
      const missingRentRoom = {
        ...baseRoom,
        rent: undefined,
      };
      const evaluation1 = evaluateHardConstraints(baseSeeker, missingRentRoom);
      expect(evaluation1.eligible).toBe(false);
      expect(evaluation1.reasons).toContain('MISSING_RENT_SPEC');

      const missingLivingConditionsRoom = {
        ...baseRoom,
        livingConditions: null,
      };
      const evaluation2 = evaluateHardConstraints(baseSeeker, missingLivingConditionsRoom);
      expect(evaluation2.eligible).toBe(false);
      expect(evaluation2.reasons).toContain('MISSING_LIVING_CONDITIONS');

      const missingDateRoom = {
        ...baseRoom,
        availableFrom: null,
      };
      const evaluation3 = evaluateHardConstraints(baseSeeker, missingDateRoom);
      expect(evaluation3.eligible).toBe(false);
      expect(evaluation3.reasons).toContain('MISSING_AVAILABLE_DATE');
    });
  });

  // ==========================================
  // 2. FUZZY MEMBERSHIP FUNCTIONS
  // ==========================================
  describe('Phase 2: Fuzzy Membership & Compatibility Scoring', () => {
    it('should calculate circular 24-hour differences correctly across midnight', () => {
      expect(getCircularHourDiff(23.5, 0.5)).toBe(1.0);
      expect(getCircularHourDiff(1.0, 23.0)).toBe(2.0);
      expect(getCircularHourDiff(7.0, 7.0)).toBe(0.0);
      expect(getCircularHourDiff(12.0, 0.0)).toBe(12.0);
    });

    it('should evaluate continuous trapezoidal circadian membership curves', () => {
      // Plateaus <= 0.5 hr
      expect(fuzzyCircadianMembership(0.0)).toBe(1.0);
      expect(fuzzyCircadianMembership(0.5)).toBe(1.0);

      // Linear drop between 0.5 and 2.0 hrs (at 1.25 hr -> 0.75)
      expect(fuzzyCircadianMembership(1.25)).toBeCloseTo(0.75, 2);
      expect(fuzzyCircadianMembership(2.0)).toBeCloseTo(0.5, 2);

      // Linear drop between 2.0 and 4.0 hrs (at 3.0 hr -> 0.25)
      expect(fuzzyCircadianMembership(3.0)).toBeCloseTo(0.25, 2);
      expect(fuzzyCircadianMembership(4.0)).toBe(0.0);

      // Beyond 4.0 hrs -> 0.0
      expect(fuzzyCircadianMembership(5.0)).toBe(0.0);
    });

    it('should evaluate 1-5 scale differences for cleanliness and noise', () => {
      expect(fuzzyScaleMembership(0)).toBe(1.0);
      expect(fuzzyScaleMembership(1)).toBe(0.8);
      expect(fuzzyScaleMembership(2)).toBe(0.5);
      expect(fuzzyScaleMembership(3)).toBe(0.2);
      expect(fuzzyScaleMembership(4)).toBe(0.0);
    });

    it('should evaluate WFH frequency differences', () => {
      expect(fuzzyWfhMembership(0)).toBe(1.0);
      expect(fuzzyWfhMembership(1)).toBe(1.0);
      expect(fuzzyWfhMembership(2)).toBe(0.8);
      expect(fuzzyWfhMembership(3)).toBe(0.6);
      expect(fuzzyWfhMembership(5)).toBe(0.2);
      expect(fuzzyWfhMembership(6)).toBe(0.0);
    });

    it('should score categorical factor synergies properly', () => {
      expect(scoreCategoricalSynergy('Quiet Retreat', 'Quiet Retreat')).toBe(1.0);
      expect(scoreCategoricalSynergy('Occasional', 'Occasional friends visiting')).toBe(1.0);
      expect(scoreCategoricalSynergy('Rare', 'Occasional')).toBe(0.7);
      expect(scoreCategoricalSynergy('Rare', 'Frequent')).toBe(0.2);
    });

    it('should compute explainable fuzzy compatibility score between 0 and 100', () => {
      const result = computeFuzzyCompatibility(baseSeeker, baseRoom);
      expect(result.compatibilityScore).toBeGreaterThanOrEqual(0);
      expect(result.compatibilityScore).toBeLessThanOrEqual(100);
      expect(result.factorBreakdown.sleepSchedule).toBe(1.0); // 23.0 vs 23.5 is 0.5h diff -> 1.0
      expect(result.factorBreakdown.wakeSchedule).toBe(1.0);
      expect(result.factorBreakdown.cleanliness).toBe(1.0);
    });
  });

  // ==========================================
  // 3. IMPORTANCE WEIGHTING SAFETY
  // ==========================================
  describe('Phase 3: Importance Weighting', () => {
    it('should gracefully handle zero total weights without returning NaN or crashing', () => {
      const zeroWeights = {
        budget: 0,
        diet: 0,
        sleepSync: 0,
        cleanliness: 0,
        noise: 0,
        guests: 0,
        wfh: 0,
      };

      const result = computeFuzzyCompatibility(baseSeeker, baseRoom, zeroWeights);
      expect(Number.isNaN(result.compatibilityScore)).toBe(false);
      expect(result.compatibilityScore).toBeGreaterThanOrEqual(0);
      expect(result.compatibilityScore).toBeLessThanOrEqual(100);
    });
  });

  // ==========================================
  // 4. COLLABORATIVE FILTERING & COLD START
  // ==========================================
  describe('Phase 4: Collaborative Filtering & Cold-Start Contract', () => {
    const candidateResults = [
      {
        roomId: 'room_1',
        eligible: true,
        compatibilityScore: 80,
      },
      {
        roomId: 'room_2',
        eligible: true,
        compatibilityScore: 75,
      },
      {
        roomId: 'room_3',
        eligible: false,
        compatibilityScore: 40,
      },
    ];

    it('should operate in Pure Knowledge-Based Mode when user interactions < 5', () => {
      const sparseInteractions = [
        { roomId: 'room_1', action: 'view' },
        { roomId: 'room_1', action: 'save' },
      ];

      const adjusted = applyCollaborativeFiltering(baseSeeker, candidateResults, sparseInteractions, {
        coldStartThreshold: 5,
      });

      expect(adjusted[0].cfAdjustment).toBe(0);
      expect(adjusted[0].cfMode).toContain('Cold-Start');
      expect(adjusted[0].compatibilityScore).toBe(80);
    });

    it('should adjust compatibility scores when interactions reach threshold (>= 5)', () => {
      const activeInteractions = [
        { roomId: 'room_1', action: 'view' },
        { roomId: 'room_1', action: 'save' },
        { roomId: 'room_1', action: 'enquire' },
        { roomId: 'room_1', action: 'book_visit' },
        { roomId: 'room_2', action: 'unsave' },
      ];

      const adjusted = applyCollaborativeFiltering(baseSeeker, candidateResults, activeInteractions, {
        coldStartThreshold: 5,
      });

      expect(adjusted[0].cfMode).toBe('Active Collaborative Filtering');
      expect(adjusted[0].cfAdjustment).toBeGreaterThan(0);
      expect(adjusted[0].compatibilityScore).toBeGreaterThan(80);
      // Disqualified candidates must never receive positive boost
      expect(adjusted[2].cfAdjustment).toBe(0);
    });
  });

  // ==========================================
  // 5. TOPSIS MULTI-CRITERIA DECISION RANKING
  // ==========================================
  describe('Phase 5: TOPSIS Multi-Criteria Ranking', () => {
    it('should rank eligible rooms with vector normalization and cost/benefit handling', () => {
      const candidates = [
        {
          roomId: 'room_A',
          rent: 18000,
          maintenance: 1000,
          deposit: 35000,
          commuteMins: 15,
          compatibilityScore: 92,
          livingConditions: { cleanliness: 4.5 },
        },
        {
          roomId: 'room_B',
          rent: 24000,
          maintenance: 2000,
          deposit: 50000,
          commuteMins: 45,
          compatibilityScore: 70,
          livingConditions: { cleanliness: 3.0 },
        },
      ];

      const ranked = computeTopsisRanking(candidates);
      expect(ranked).toHaveLength(2);
      expect(ranked[0].roomId).toBe('room_A'); // Lower cost, shorter commute, higher compatibility
      expect(ranked[0].rankingScore).toBeGreaterThan(ranked[1].rankingScore);
      expect(ranked[0].rankingScore).toBeGreaterThanOrEqual(0.0);
      expect(ranked[0].rankingScore).toBeLessThanOrEqual(10.0);
    });

    it('should safely handle single candidate without divide-by-zero errors', () => {
      const singleCandidate = [
        {
          roomId: 'room_solo',
          rent: 20000,
          maintenance: 1000,
          deposit: 40000,
          commuteMins: 20,
          compatibilityScore: 85,
          livingConditions: { cleanliness: 4.0 },
        },
      ];

      const ranked = computeTopsisRanking(singleCandidate);
      expect(ranked).toHaveLength(1);
      expect(ranked[0].rankingScore).toBe(5.0); // Neutral 5.0 relative closeness
    });

    it('should safely handle constant columns where all candidates have identical values', () => {
      const constantCandidates = [
        {
          roomId: 'room_1',
          rent: 20000,
          maintenance: 0,
          deposit: 40000,
          commuteMins: 20,
          compatibilityScore: 80,
          livingConditions: { cleanliness: 4.0 },
        },
        {
          roomId: 'room_2',
          rent: 20000,
          maintenance: 0,
          deposit: 40000,
          commuteMins: 20,
          compatibilityScore: 80,
          livingConditions: { cleanliness: 4.0 },
        },
      ];

      const ranked = computeTopsisRanking(constantCandidates);
      expect(ranked).toHaveLength(2);
      expect(Number.isNaN(ranked[0].rankingScore)).toBe(false);
      expect(Number.isNaN(ranked[1].rankingScore)).toBe(false);
    });

    it('should apply deterministic tie-breaking on identical ranking scores', () => {
      const tiedCandidates = [
        {
          roomId: 'room_z',
          rent: 20000,
          maintenance: 0,
          deposit: 40000,
          commuteMins: 20,
          compatibilityScore: 85,
          livingConditions: { cleanliness: 4.0 },
        },
        {
          roomId: 'room_a',
          rent: 20000,
          maintenance: 0,
          deposit: 40000,
          commuteMins: 20,
          compatibilityScore: 85,
          livingConditions: { cleanliness: 4.0 },
        },
      ];

      const ranked = computeTopsisRanking(tiedCandidates);
      expect(ranked[0].roomId).toBe('room_a'); // Lexicographical tie-breaker
      expect(ranked[1].roomId).toBe('room_z');
    });
  });

  // ==========================================
  // 6. METRICS SEPARATION CONTRACT
  // ==========================================
  describe('Phase 6: Strict Separation of Concerns', () => {
    it('should never merge compatibilityScore and rankingScore into a single averaged number', async () => {
      const payload = {
        seeker: baseSeeker,
        candidates: [baseRoom],
      };

      const result = await calculateMatches(payload);
      expect(result.matches).toHaveLength(1);
      const match = result.matches[0];

      // compatibilityScore (lifestyle) is on a 0-100 scale
      expect(match.compatibilityScore).toBeGreaterThanOrEqual(0);
      expect(match.compatibilityScore).toBeLessThanOrEqual(100);

      // rankingScore (TOPSIS) is on a 0.0-10.0 scale
      expect(match.rankingScore).toBeGreaterThanOrEqual(0.0);
      expect(match.rankingScore).toBeLessThanOrEqual(10.0);

      // They must remain distinct fields
      expect(match).toHaveProperty('compatibilityScore');
      expect(match).toHaveProperty('rankingScore');
    });
  });

  // ==========================================
  // 7. EXPLAINABILITY & TRANSPARENCY
  // ==========================================
  describe('Explainability & Output Generation', () => {
    it('should generate transparent strengths and mismatch warnings', () => {
      const highSyncFactors = {
        sleepSchedule: 1.0,
        wakeSchedule: 1.0,
        cleanliness: 0.9,
        noiseTolerance: 0.85,
        foodPreference: 1.0,
        smoking: 1.0,
        alcohol: 1.0,
        overnightGuests: 0.2, // Friction point
      };

      const { strengths, mismatches } = generateExplainability(baseSeeker, baseRoom, highSyncFactors);
      expect(strengths).toEqual(
        expect.arrayContaining([
          expect.stringContaining('Synchronized sleep & wake schedule'),
          expect.stringContaining('cleanliness'),
        ])
      );
      expect(mismatches).toEqual(
        expect.arrayContaining([expect.stringContaining('overnight visitor')])
      );
    });

    it('should return disqualified listings with explicit exclusion reasons when includeDisqualified=true', async () => {
      const disqualifiedRoom = {
        ...baseRoom,
        roomId: 'room_disqualified_99',
        rent: 30000, // Exceeds 25,000
      };

      const payload = {
        seeker: baseSeeker,
        candidates: [disqualifiedRoom],
        options: { includeDisqualified: true },
      };

      const result = await calculateMatches(payload);
      expect(result.matches).toHaveLength(1);
      expect(result.matches[0].eligible).toBe(false);
      expect(result.matches[0].exclusionReasons).toContain('EXCEEDS_BUDGET_CEILING');
    });
  });

  // ==========================================
  // 8. EMPTY CANDIDATES & EDGE CASES
  // ==========================================
  describe('Empty Candidate Pools & Edge Cases', () => {
    it('should return empty matches with zero counts when candidate pool is empty', async () => {
      const payload = {
        seeker: baseSeeker,
        candidates: [],
      };

      const result = await calculateMatches(payload);
      expect(result.algorithmMetadata.candidateCount).toBe(0);
      expect(result.algorithmMetadata.eligibleCount).toBe(0);
      expect(result.algorithmMetadata.disqualifiedCount).toBe(0);
      expect(result.algorithmMetadata.engineVersion).toBe(ENGINE_VERSION);
      expect(result.matches).toEqual([]);
    });

    it('should reject invalid null/non-object payloads with descriptive error', async () => {
      await expect(calculateMatches(null)).rejects.toThrow('Invalid input payload');
      await expect(calculateMatches({})).rejects.toThrow('seeker with profile is required');
    });
  });
});
