# RoomSync — Matching Engine Integration Contract & Specification

> **Document Status:** Official Integration Contract (Draft / Baseline)  
> **Target Audience:** Member 3 (Matching Engine Lead), Member 2 (Backend & API Lead), Member 1 (Frontend Lead)  
> **Primary Module Location:** `backend/src/services/MatchingEngine.js` (to be implemented by Member 3)

---

## 1. Algorithmic Principles & Separation of Concerns

### 1.1 Non-Fabrication Rule
RoomSync strictly prohibits fabricated "match percentages" or black-box vanity numbers. Every score presented on RoomSync must be derived deterministically from:
1. Binary hard-constraint satisfaction.
2. Transparent continuous fuzzy membership evaluations.
3. Explicit user-customized importance weights.
4. Closeness to the positive ideal solution via TOPSIS.

### 1.2 Two Distinct Metrics Contract
The engine outputs two fundamentally different metrics that must never be merged, averaged, or conflated:
1. **`compatibilityScore` (0–100%)**: Quantifies interpersonal lifestyle synergy and daily habit synchronization (e.g. sleep/wake routines, hygiene, noise tolerance, food rules).  
   > *Crucial Notice:* `compatibilityScore` is a quantified lifestyle alignment index, **not** a probability guarantee of interpersonal harmony or relationship success.
2. **`rankingScore` (0.0–10.0 scale or 0.0–1.0 TOPSIS relative closeness)**: A multi-criteria property ranking evaluating holistic desirability based on rent competitiveness, commute proximity, property rating, and user preferences.

### 1.3 Algorithmic Execution Pipeline Order
The matching pipeline must strictly follow this sequential order:
```
[Active Room Listings Pool]
            │
            ▼
┌────────────────────────────────────────┐
│ Phase 1: Hard Constraint Filter        │ --> Binary pass/fail elimination.
└────────────────────────────────────────┘     (Disqualified candidates are excluded or flagged)
            │
            ▼ [Eligible Candidate Pool]
┌────────────────────────────────────────┐
│ Phase 2: Fuzzy Compatibility Evaluation│ --> Continuous membership scoring across
└────────────────────────────────────────┘     flexible factors (sleep, wake, cleanliness, etc.)
            │
            ▼
┌────────────────────────────────────────┐
│ Phase 3: Personalized Weighting        │ --> Normalized weighted sum:
└────────────────────────────────────────┘     compatibilityScore = Σ(w_i * S_i) / Σ(w_i)
            │
            ▼
┌────────────────────────────────────────┐
│ Phase 4: Collaborative Filtering       │ --> Interaction boost/penalty adjustments
└────────────────────────────────────────┘     (with documented cold-start fallback)
            │
            ▼
┌────────────────────────────────────────┐
│ Phase 5: Multi-Criteria Ranking (TOPSIS)│--> Relative closeness to ideal solution
└────────────────────────────────────────┘     generating rankingScore
            │
            ▼
┌────────────────────────────────────────┐
│ Phase 6: Explainable Output Generation │ --> Strengths, mismatches, and factor breakdown
└────────────────────────────────────────┘
```

---

## 2. Input Contract: Backend (Member 2) to Matching Engine (Member 3)

Member 2 will supply the matching function with a strongly typed, pre-validated JavaScript object:

```javascript
/**
 * Evaluates candidate room listings against a seeker's profile
 * @param {MatchingInputPayload} payload
 * @returns {Promise<MatchingResultPayload>}
 */
export async function calculateMatches(payload) { ... }
```

### 2.1 Input Payload Schema (`MatchingInputPayload`)

```typescript
interface MatchingInputPayload {
  seeker: {
    userId: string;
    profile: {
      hardConstraints: {
        budgetCeiling: number;           // Max monthly rent in INR
        maxDeposit?: number;             // Max security deposit
        dietaryRule: string;             // 'Pure-Veg' | 'Veg-Only Flat' | 'Flexible' | 'Any'
        smokingPolicy: string;           // 'Strictly Non-Smoking' | 'Balcony Only' | 'Flexible'
        alcoholPolicy: string;           // 'Teetotaler' | 'Moderate' | 'Flexible'
        petPolicy: string;               // 'Strictly No Pets' | 'Pet-Friendly' | 'Has Pet' | 'Flexible'
        maxCommuteMins?: number;         // Maximum commute threshold
        earliestMoveIn?: string;         // ISO Date string
        latestMoveIn?: string;           // ISO Date string
      };
      flexiblePreferences: {
        sleepSchedule: number;           // Bedtime in hours (0.0 to 23.5)
        wakeSchedule: number;            // Wake time in hours (0.0 to 23.5)
        cleanliness: number;             // 1 to 5 scale
        noiseTolerance: number;          // 1 to 5 scale
        wfhDays: number;                 // Days working from home (0 to 7)
        guestPolicy: string;             // 'Rare' | 'Occasional' | 'Frequent'
        overnightGuests: string;         // 'Not Allowed' | 'With Notice' | 'Frequent'
        socialPreference: string;        // 'Quiet Retreat' | 'Balanced' | 'Social Hub'
        cookingHabit: string;            // 'Daily' | 'Occasional' | 'Tiffin / Delivery'
        foodSharing: string;             // 'Separate Groceries' | 'Shared Staples' | 'Full Communal'
        personalSpace: string;           // 'High' | 'Balanced' | 'Communal'
        rulesStrictness: string;         // 'Strict Curfew' | 'Moderate' | 'Self-Managed'
      };
      importanceWeights: {
        budget: number;                  // 1 to 5
        diet: number;                    // 1 to 5
        sleepSync: number;               // 1 to 5
        cleanliness: number;             // 1 to 5
        noise: number;                   // 1 to 5
        guests: number;                  // 1 to 5
        wfh: number;                     // 1 to 5
      };
    };
    interactions?: Array<{
      roomId: string;
      action: 'view' | 'save' | 'unsave' | 'enquire' | 'book_visit';
      dwellTimeSeconds?: number;
      createdAt: string;
    }>;
  };
  candidates: Array<{
    roomId: string;
    rent: number;
    deposit: number;
    locality: string;
    city: string;
    geoCoordinates?: [number, number];   // [longitude, latitude]
    availableFrom: string;
    minStayMonths: number;
    roomType: string;
    livingConditions: {
      foodPreference: string;
      smoking: string;
      alcohol: string;
      sleepSchedule: number;
      wakeSchedule: number;
      cleanliness: number;
      noiseTolerance: number;
      guestsDay: string;
      guestsOvernight: string;
      socialPreference: string;
      workSchedule: string;
      wfhFrequency: number;
      studyHabits: string;
      cookingFrequency: string;
      petsPreference: string;
      foodSharing: string;
      personalSpace: string;
      rulesStrictness: string;
    };
  }>;
  options?: {
    includeDisqualified?: boolean;      // When true, returns disqualified listings with exclusion reasons
    coldStartThreshold?: number;        // Minimum interactions before CF activates (default: 5)
  };
}
```

---

## 3. Output Contract: Matching Engine (Member 3) to Backend (Member 2)

### 3.1 Output Payload Schema (`MatchingResultPayload`)

```typescript
interface MatchingResultPayload {
  algorithmMetadata: {
    engineVersion: string;               // e.g. "1.0.0-fuzzy-topsis"
    calculatedAt: string;                // ISO Date string
    candidateCount: number;
    eligibleCount: number;
    disqualifiedCount: number;
  };
  matches: Array<CandidateMatchResult>;
}

interface CandidateMatchResult {
  roomId: string;
  eligible: boolean;                     // false if any hard constraint failed
  exclusionReasons?: string[];           // populated if eligible === false
  
  // Interpersonal Synergy (Lifestyle Alignment)
  compatibilityScore: number;            // 0 to 100 (integer or 1 decimal)
  
  // Holistic Property Decision Ranking (TOPSIS Closeness)
  rankingScore: number;                  // 0.0 to 10.0 scale
  
  // Transparent Explainability
  strengths: string[];                   // e.g. ["Synchronized bedtime within 30 mins", "Both non-smoking"]
  mismatches: string[];                  // e.g. ["Notice required for overnight visitors"]
  
  // Detailed Factor-by-Factor Normalized Synergies (0.0 to 1.0)
  factorBreakdown: {
    location?: number;
    budget?: number;
    foodPreference?: number;
    smoking?: number;
    alcohol?: number;
    sleepSchedule?: number;
    wakeSchedule?: number;
    cleanliness?: number;
    noiseTolerance?: number;
    guestPolicy?: number;
    overnightGuests?: number;
    socialPreference?: number;
    wfhFrequency?: number;
    cookingFrequency?: number;
    petsPreference?: number;
    foodSharing?: number;
    personalSpace?: number;
    rulesStrictness?: number;
  };
}
```

---

## 4. Collaborative Filtering & Cold-Start Behavior

Collaborative Filtering (CF) must handle scenarios where a seeker is newly onboarded and has zero or sparse interaction logs.

### Cold-Start Contract Rules:
1. **Interaction Threshold ($N < 5$):**
   - If user interactions count $< 5$, the system operates in **Pure Knowledge-Based Mode** (Fuzzy Logic + TOPSIS).
   - No CF penalty or artificial variance is introduced.
2. **Interaction Threshold ($N \ge 5$):**
   - When user interactions reach the threshold, implicit positive feedback (e.g. repeated saves, visit bookings) is factored in as an affinity bias modifier.
   - The CF weight must never override hard constraints.

---

## 5. Unresolved Algorithm Design Questions (For Member 3 Alignment)

The following architectural questions require confirmation from Member 3:

1. **Fuzzy Membership Shapes:**
   - Which continuous factors will use triangular vs. trapezoidal membership curves? (e.g., is a ±1 hour sleep difference scored on a trapezoidal plateau or a linear triangular decline?)
2. **TOPSIS Criteria Matrix Weights:**
   - In TOPSIS ranking, what are the baseline weights assigned to criteria such as rent, commute distance, average room rating, and `compatibilityScore`?
3. **Hard Constraint Disqualification in API Responses:**
   - Should listings that fail hard constraints be completely filtered out before returning API responses to Member 1, or included at the end of the list with `eligible: false` and explanatory `exclusionReasons`?
   - *Recommendation:* Provide an optional query flag `?includeDisqualified=true` for transparency.
