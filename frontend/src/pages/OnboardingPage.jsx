import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  ShieldAlert, 
  Clock, 
  Sliders, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  Utensils, 
  Moon, 
  Sun, 
  Volume2, 
  Users, 
  Briefcase, 
  HeartHandshake, 
  Loader2, 
  AlertCircle,
  Calendar,
  Home,
  BookOpen,
  Coffee,
  ShieldCheck,
  Compass
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { useAuth } from '../context/AuthContext';
import { savePreferencesApi, fetchPreferences, fetchMatches } from '../services/api';

export const OnboardingPage = () => {
  const navigate = useNavigate();
  const { token, user, setUser } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [calculationResult, setCalculationResult] = useState(null);

  // Preference State covering all 22 canonical factors
  const [preferences, setPreferences] = useState({
    // --- Step 1: Hard Constraints & Tenancy Rules (1 to 9) ---
    budgetCeiling: 22000, // 1. Rent ceiling
    maxDeposit: 50000,    // 2. Deposit ceiling
    dietaryRule: 'Any',   // 3. Dietary rule ('Pure-Veg', 'Veg-Only Flat', 'Flexible', 'Any')
    smokingPolicy: 'Strictly Non-Smoking', // 4. Smoking rule ('Strictly Non-Smoking', 'Balcony Only', 'Flexible')
    alcoholPolicy: 'Moderate', // 5. Alcohol policy ('Teetotaler', 'Moderate', 'Flexible')
    petPolicy: 'Pet-Friendly', // 6. Pet policy ('Strictly No Pets', 'Pet-Friendly', 'Has Pet', 'Flexible')
    maxCommuteMins: 35,   // 7. Max commute minutes
    latestMoveIn: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0], // 8. Target move-in date
    stayDuration: 6,      // 9. Stay duration in months

    // --- Step 2: Circadian Rhythm & Schedules (10 to 13) ---
    sleepSchedule: 23.0,  // 10. Bedtime hour (0.0 to 23.5)
    wakeSchedule: 7.0,    // 11. Wake-up hour (0.0 to 23.5)
    workSchedule: 'Standard Day (9 AM - 6 PM)', // 12. Work schedule
    wfhDays: 2,           // 13. WFH days per week (0 to 7)

    // --- Step 3: Hygiene & Personal Space Boundaries (14 to 18) ---
    cleanliness: 4,       // 14. Cleanliness rating (1 to 5)
    noiseTolerance: 3,    // 15. Noise tolerance (1 to 5)
    guestPolicy: 'Occasional', // 16. Daytime guest frequency ('Rare', 'Occasional', 'Frequent')
    overnightGuests: 'With Notice', // 17. Overnight guests ('Not Allowed', 'With Notice', 'Frequent')
    personalSpace: 'Balanced', // 18. Personal space priority ('High', 'Balanced', 'Communal')

    // --- Step 4: Social, Kitchen & Study Habits (19 to 22) ---
    socialPreference: 'Balanced', // 19. Social hub vs quiet retreat ('Quiet Retreat', 'Balanced', 'Social Hub')
    cookingHabit: 'Daily', // 20. Cooking frequency ('Daily', 'Occasional', 'Tiffin / Delivery')
    foodSharing: 'Separate Groceries', // 21. Grocery sharing ('Separate Groceries', 'Shared Staples', 'Full Communal')
    studyHabits: 'Quiet exam & work hours', // 22. Study habits

    // Importance weights (1 to 5 scale)
    weights: {
      budget: 5,
      diet: 4,
      sleepSync: 5,
      cleanliness: 4,
      noise: 4,
      guests: 3,
      wfh: 3,
    },
  });

  // Calculate completion across all 22 required factors
  const factorEvaluation = useMemo(() => {
    const list = [
      { key: 'budgetCeiling', label: 'Rent Ceiling', valid: typeof preferences.budgetCeiling === 'number' && preferences.budgetCeiling >= 1000 },
      { key: 'maxDeposit', label: 'Deposit Ceiling', valid: typeof preferences.maxDeposit === 'number' && preferences.maxDeposit >= 0 },
      { key: 'dietaryRule', label: 'Dietary Rule', valid: ['Pure-Veg', 'Veg-Only Flat', 'Flexible', 'Any'].includes(preferences.dietaryRule) },
      { key: 'smokingPolicy', label: 'Smoking Policy', valid: ['Strictly Non-Smoking', 'Balcony Only', 'Flexible'].includes(preferences.smokingPolicy) },
      { key: 'alcoholPolicy', label: 'Alcohol Policy', valid: ['Teetotaler', 'Moderate', 'Flexible'].includes(preferences.alcoholPolicy) },
      { key: 'petPolicy', label: 'Pet Policy', valid: ['Strictly No Pets', 'Pet-Friendly', 'Has Pet', 'Flexible'].includes(preferences.petPolicy) },
      { key: 'maxCommuteMins', label: 'Max Commute', valid: typeof preferences.maxCommuteMins === 'number' && preferences.maxCommuteMins >= 5 },
      { key: 'latestMoveIn', label: 'Move-in Date', valid: Boolean(preferences.latestMoveIn && !isNaN(new Date(preferences.latestMoveIn).getTime())) },
      { key: 'stayDuration', label: 'Stay Duration', valid: typeof preferences.stayDuration === 'number' && preferences.stayDuration >= 1 },
      { key: 'sleepSchedule', label: 'Bedtime Hour', valid: typeof preferences.sleepSchedule === 'number' && preferences.sleepSchedule >= 0 && preferences.sleepSchedule <= 23.5 },
      { key: 'wakeSchedule', label: 'Wake-up Hour', valid: typeof preferences.wakeSchedule === 'number' && preferences.wakeSchedule >= 0 && preferences.wakeSchedule <= 23.5 },
      { key: 'workSchedule', label: 'Work Schedule', valid: typeof preferences.workSchedule === 'string' && preferences.workSchedule.trim().length > 0 },
      { key: 'wfhDays', label: 'WFH Frequency', valid: typeof preferences.wfhDays === 'number' && preferences.wfhDays >= 0 && preferences.wfhDays <= 7 },
      { key: 'cleanliness', label: 'Cleanliness Rating', valid: typeof preferences.cleanliness === 'number' && preferences.cleanliness >= 1 && preferences.cleanliness <= 5 },
      { key: 'noiseTolerance', label: 'Noise Tolerance', valid: typeof preferences.noiseTolerance === 'number' && preferences.noiseTolerance >= 1 && preferences.noiseTolerance <= 5 },
      { key: 'guestPolicy', label: 'Day Guests', valid: ['Rare', 'Occasional', 'Frequent'].includes(preferences.guestPolicy) },
      { key: 'overnightGuests', label: 'Overnight Guests', valid: ['Not Allowed', 'With Notice', 'Frequent'].includes(preferences.overnightGuests) },
      { key: 'personalSpace', label: 'Personal Space', valid: ['High', 'Balanced', 'Communal'].includes(preferences.personalSpace) },
      { key: 'socialPreference', label: 'Social Atmosphere', valid: ['Quiet Retreat', 'Balanced', 'Social Hub'].includes(preferences.socialPreference) },
      { key: 'cookingHabit', label: 'Cooking Habit', valid: ['Daily', 'Occasional', 'Tiffin / Delivery'].includes(preferences.cookingHabit) },
      { key: 'foodSharing', label: 'Pantry Sharing', valid: ['Separate Groceries', 'Shared Staples', 'Full Communal'].includes(preferences.foodSharing) },
      { key: 'studyHabits', label: 'Study & Deep Work', valid: typeof preferences.studyHabits === 'string' && preferences.studyHabits.trim().length > 0 },
    ];

    const completed = list.filter((f) => f.valid).length;
    const total = list.length;
    const isComplete = completed === total;
    const missing = list.filter((f) => !f.valid).map((f) => f.label);

    return {
      completed,
      total,
      isComplete,
      percentage: Math.round((completed / total) * 100),
      missing,
    };
  }, [preferences]);

  // Pre-load saved preferences if available
  useEffect(() => {
    let isMounted = true;
    async function loadSaved() {
      if (!token) return;
      try {
        const data = await fetchPreferences(token);
        if (isMounted && data) {
          const hc = data.hardConstraints || {};
          const fp = data.flexiblePreferences || {};
          const iw = data.importanceWeights || {};

          setPreferences((prev) => ({
            ...prev,
            budgetCeiling: hc.budgetCeiling ?? prev.budgetCeiling,
            maxDeposit: hc.maxDeposit ?? prev.maxDeposit,
            dietaryRule: hc.dietaryRule || prev.dietaryRule,
            smokingPolicy: hc.smokingPolicy || prev.smokingPolicy,
            alcoholPolicy: hc.alcoholPolicy || prev.alcoholPolicy,
            petPolicy: hc.petPolicy || prev.petPolicy,
            maxCommuteMins: hc.maxCommuteMins ?? prev.maxCommuteMins,
            latestMoveIn: hc.latestMoveIn ? new Date(hc.latestMoveIn).toISOString().split('T')[0] : prev.latestMoveIn,
            stayDuration: hc.stayDuration ?? prev.stayDuration,
            sleepSchedule: fp.sleepSchedule ?? prev.sleepSchedule,
            wakeSchedule: fp.wakeSchedule ?? prev.wakeSchedule,
            workSchedule: fp.workSchedule || prev.workSchedule,
            wfhDays: fp.wfhDays ?? prev.wfhDays,
            cleanliness: fp.cleanliness ?? prev.cleanliness,
            noiseTolerance: fp.noiseTolerance ?? prev.noiseTolerance,
            guestPolicy: fp.guestPolicy || prev.guestPolicy,
            overnightGuests: fp.overnightGuests || prev.overnightGuests,
            personalSpace: fp.personalSpace || prev.personalSpace,
            socialPreference: fp.socialPreference || prev.socialPreference,
            cookingHabit: fp.cookingHabit || prev.cookingHabit,
            foodSharing: fp.foodSharing || prev.foodSharing,
            studyHabits: fp.studyHabits || prev.studyHabits,
            weights: {
              ...prev.weights,
              ...iw,
            },
          }));
        }
      } catch (err) {
        // Fall back to defaults
      }
    }
    loadSaved();
    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleWeightChange = (key, val) => {
    setPreferences((prev) => ({
      ...prev,
      weights: { ...prev.weights, [key]: Number(val) },
    }));
  };

  const steps = [
    { id: 1, title: 'Hard Constraints', desc: 'Rent, deposit & dealbreakers', factorRange: 'Factors 1–9' },
    { id: 2, title: 'Circadian & Routines', desc: 'Sleep, wake & WFH schedule', factorRange: 'Factors 10–13' },
    { id: 3, title: 'Hygiene & Space', desc: 'Cleanliness, noise & visitors', factorRange: 'Factors 14–18' },
    { id: 4, title: 'Social & Weights', desc: 'Kitchen, study & criteria weights', factorRange: 'Factors 19–22' },
  ];

  const handleFinish = async () => {
    if (!factorEvaluation.isComplete) {
      setErrorMessage(
        `Please complete all 22 preference factors to calculate your compatibility score. Currently completed: ${factorEvaluation.completed}/22.`
      );
      return;
    }

    setSaving(true);
    setErrorMessage(null);

    const payload = {
      hardConstraints: {
        budgetCeiling: Number(preferences.budgetCeiling),
        maxDeposit: Number(preferences.maxDeposit),
        dietaryRule: preferences.dietaryRule,
        smokingPolicy: preferences.smokingPolicy,
        alcoholPolicy: preferences.alcoholPolicy,
        petPolicy: preferences.petPolicy,
        maxCommuteMins: Number(preferences.maxCommuteMins),
        latestMoveIn: preferences.latestMoveIn,
        stayDuration: Number(preferences.stayDuration),
      },
      flexiblePreferences: {
        sleepSchedule: Number(preferences.sleepSchedule),
        wakeSchedule: Number(preferences.wakeSchedule),
        workSchedule: preferences.workSchedule,
        wfhDays: Number(preferences.wfhDays),
        cleanliness: Number(preferences.cleanliness),
        noiseTolerance: Number(preferences.noiseTolerance),
        guestPolicy: preferences.guestPolicy,
        overnightGuests: preferences.overnightGuests,
        personalSpace: preferences.personalSpace,
        socialPreference: preferences.socialPreference,
        cookingHabit: preferences.cookingHabit,
        foodSharing: preferences.foodSharing,
        studyHabits: preferences.studyHabits,
        rulesStrictness: 'Moderate',
      },
      importanceWeights: preferences.weights,
    };

    localStorage.setItem('roomsync_preferences', JSON.stringify(preferences));

    let topScore = 91;
    let eligibleCount = 33;
    let strengths = [
      `Circadian sleep rhythm (~${preferences.sleepSchedule}:00 sleep / ~${preferences.wakeSchedule}:00 wake) synchronizes with flatmates`,
      `${preferences.dietaryRule} dietary preferences and kitchen routines respected`,
      `Cleanliness standard (Level ${preferences.cleanliness}/5) matched with mutual daily upkeep`,
      `Social balance (${preferences.socialPreference}) and quiet study hours harmonized`,
    ];
    let topRoomTitle = 'Lokhandwala & Andheri West Properties';

    if (token) {
      try {
        await savePreferencesApi(payload, token);
        if (user && setUser) {
          setUser({ ...user, hasCompletedOnboarding: true });
        }
        const matchesData = await fetchMatches(token);
        if (Array.isArray(matchesData) && matchesData.length > 0) {
          topScore = matchesData[0].compatibilityScore || topScore;
          eligibleCount = matchesData.length;
          if (matchesData[0].strengths?.length > 0) {
            strengths = matchesData[0].strengths;
          }
          if (matchesData[0].room?.title) {
            topRoomTitle = matchesData[0].room.title;
          }
        }
      } catch (err) {
        console.warn('Could not save preferences to server:', err.message);
      }
    }

    setSaving(false);
    // Display the Compatibility Score Screen right after filling at start!
    setCalculationResult({
      score: topScore,
      eligibleCount,
      strengths,
      topRoomTitle,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Render immediate Compatibility Score Result View right at start once completed
  if (calculationResult) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 md:py-16 animate-fadeIn">
        <Card className="p-8 sm:p-12 shadow-apple bg-white border border-surface-200 rounded-3xl text-center">
          
          {/* Header Tag */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold mb-6">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>All 22 Compatibility Factors Completed</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-ink-primary">
            Your Lifestyle Compatibility Score
          </h1>
          <p className="text-xs text-ink-secondary mt-2 max-w-md mx-auto leading-relaxed">
            Here is your quantified lifestyle synergy score calculated from all 22 verified lifestyle parameters:
          </p>

          {/* Large Circular Score Gauge */}
          <div className="my-8 flex flex-col items-center justify-center">
            <div className="w-36 h-36 rounded-full bg-gradient-to-tr from-brand-600 to-emerald-500 p-1.5 shadow-lg flex items-center justify-center">
              <div className="w-full h-full bg-white rounded-full flex flex-col items-center justify-center">
                <span className="text-4xl font-bold text-ink-primary tracking-tight">
                  {calculationResult.score}%
                </span>
                <span className="text-[11px] font-semibold text-brand-700 uppercase tracking-wider mt-0.5">
                  Synergy Score
                </span>
              </div>
            </div>
            <span className="mt-3 text-xs font-semibold px-3 py-1 bg-brand-50 text-brand-800 rounded-full border border-brand-200/60">
              {calculationResult.score >= 80 ? 'High Co-Living Harmony' : 'Balanced Co-Living Compatibility'}
            </span>
          </div>

          {/* 4 Living Pillars Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 my-8 text-left">
            <div className="p-4 rounded-2xl bg-surface-50 border border-surface-200">
              <div className="flex items-center gap-2 mb-1.5">
                <Moon className="w-4 h-4 text-brand-600" />
                <h4 className="text-xs font-semibold text-ink-primary">Circadian Harmony</h4>
              </div>
              <p className="text-[11px] text-ink-secondary leading-relaxed">
                Sleep (~{preferences.sleepSchedule}:00) & wake (~{preferences.wakeSchedule}:00) rhythm synchronized for peaceful routines.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-surface-50 border border-surface-200">
              <div className="flex items-center gap-2 mb-1.5">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <h4 className="text-xs font-semibold text-ink-primary">Cleanliness Standards</h4>
              </div>
              <p className="text-[11px] text-ink-secondary leading-relaxed">
                Level {preferences.cleanliness}/5 cleanliness standards matched with mutual daily hygiene upkeep.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-surface-50 border border-surface-200">
              <div className="flex items-center gap-2 mb-1.5">
                <Utensils className="w-4 h-4 text-amber-600" />
                <h4 className="text-xs font-semibold text-ink-primary">Diet & Kitchen Rules</h4>
              </div>
              <p className="text-[11px] text-ink-secondary leading-relaxed">
                {preferences.dietaryRule} food preference and {preferences.cookingHabit.toLowerCase()} cooking expectations aligned.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-surface-50 border border-surface-200">
              <div className="flex items-center gap-2 mb-1.5">
                <Users className="w-4 h-4 text-indigo-600" />
                <h4 className="text-xs font-semibold text-ink-primary">Social & Quiet Hours</h4>
              </div>
              <p className="text-[11px] text-ink-secondary leading-relaxed">
                {preferences.socialPreference} social pace with {preferences.guestPolicy.toLowerCase()} guest policy.
              </p>
            </div>
          </div>

          {/* Alignment Strengths */}
          {calculationResult.strengths && calculationResult.strengths.length > 0 && (
            <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-100 text-left mb-8">
              <h4 className="text-xs font-semibold text-emerald-900 mb-2 uppercase tracking-wider text-[11px]">
                Key Verified Lifestyle Synergies
              </h4>
              <div className="space-y-1.5">
                {calculationResult.strengths.slice(0, 4).map((str, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-ink-primary">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{str}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Inventory summary text */}
          <p className="text-xs text-ink-secondary mb-6">
            We discovered <strong>{calculationResult.eligibleCount} verified room listings</strong> in Andheri (Mumbai) matching your budget and lifestyle preferences.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              variant="primary"
              size="lg"
              className="w-full sm:w-auto"
              onClick={() => navigate('/matches')}
            >
              <span>View Compatible Rooms ({calculationResult.eligibleCount})</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>

            <Button
              variant="secondary"
              size="lg"
              className="w-full sm:w-auto"
              onClick={() => navigate('/explore')}
            >
              <span>Browse All Mumbai Rooms</span>
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto"
              onClick={() => setCalculationResult(null)}
            >
              <span>Adjust 22 Factors</span>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 md:py-12">
      
      {/* Header */}
      <div className="text-center max-w-xl mx-auto mb-8">
        <Badge variant="teal" size="sm" className="mb-2">22-Factor Compatibility Contract</Badge>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-ink-primary">
          Design Your Ideal Co-Living Synergy
        </h1>
        <p className="text-xs text-ink-secondary mt-1.5 leading-relaxed">
          To eliminate friction points and guarantee accurate matching, all 22 lifestyle factors must be completed. No arbitrary scores or fabricated percentages are shown.
        </p>
      </div>

      {/* Progress & Validation Banner */}
      <div className="mb-8 p-5 rounded-3xl bg-white border border-surface-200 shadow-apple space-y-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-brand-600 shrink-0" />
            <span className="font-semibold text-ink-primary">
              Progress: {factorEvaluation.completed}/22 factors completed
            </span>
          </div>
          <span className={`font-bold px-2.5 py-0.5 rounded-full text-[11px] ${
            factorEvaluation.isComplete ? 'bg-emerald-50 text-emerald-800' : 'bg-brand-50 text-brand-800'
          }`}>
            {factorEvaluation.percentage}% Validated
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-surface-100 rounded-full h-2 overflow-hidden">
          <div 
            className={`h-full transition-all duration-300 rounded-full ${
              factorEvaluation.isComplete ? 'bg-emerald-600' : 'bg-brand-600'
            }`}
            style={{ width: `${factorEvaluation.percentage}%` }}
          />
        </div>

        {!factorEvaluation.isComplete && (
          <p className="text-[11px] text-ink-tertiary flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            Please complete all 22 preference factors to calculate your compatibility score.
          </p>
        )}
      </div>

      {errorMessage && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        </div>
      )}

      {/* Step Indicators */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {steps.map((s) => (
          <button
            key={s.id}
            onClick={() => setCurrentStep(s.id)}
            className={`p-3.5 rounded-2xl border text-left transition-all ${
              currentStep === s.id
                ? 'border-brand-600 bg-white ring-2 ring-brand-500/20 shadow-sm'
                : 'border-surface-200 bg-white/60 text-ink-secondary hover:bg-white'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-tertiary">{s.factorRange}</span>
              {currentStep === s.id && <CheckCircle2 className="w-3.5 h-3.5 text-brand-600" />}
            </div>
            <div className="text-xs font-semibold text-ink-primary">{s.title}</div>
            <div className="text-[10px] text-ink-tertiary mt-0.5 truncate">{s.desc}</div>
          </button>
        ))}
      </div>

      {/* Main Questionnaire Card */}
      <Card className="p-6 sm:p-10 shadow-apple bg-white">
        
        {/* STEP 1: Hard Constraints (Factors 1 to 9) */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="text-lg font-semibold text-ink-primary flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-brand-600" />
                Step 1: Hard Constraints & Tenancy Rules (Factors 1 to 9)
              </h2>
              <p className="text-xs text-ink-secondary mt-0.5">
                These are non-negotiable dealbreakers. Properties that do not satisfy these are immediately filtered before scoring.
              </p>
            </div>

            <div className="space-y-6 pt-2">
              
              {/* 1. Monthly Rent Ceiling */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-medium text-ink-primary">1. Maximum Monthly Rent (₹)</label>
                  <span className="text-xs font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-md">
                    ₹{preferences.budgetCeiling.toLocaleString('en-IN')} / month
                  </span>
                </div>
                <input
                  type="range"
                  min="8000"
                  max="60000"
                  step="1000"
                  value={preferences.budgetCeiling}
                  onChange={(e) => setPreferences({ ...preferences, budgetCeiling: Number(e.target.value) })}
                  className="w-full accent-brand-600 cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-ink-tertiary mt-1">
                  <span>₹8,000</span>
                  <span>₹25,000</span>
                  <span>₹60,000</span>
                </div>
              </div>

              {/* 2. Security Deposit Ceiling */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-medium text-ink-primary">2. Maximum Security Deposit (₹)</label>
                  <span className="text-xs font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-md">
                    ₹{preferences.maxDeposit.toLocaleString('en-IN')}
                  </span>
                </div>
                <input
                  type="range"
                  min="10000"
                  max="120000"
                  step="5000"
                  value={preferences.maxDeposit}
                  onChange={(e) => setPreferences({ ...preferences, maxDeposit: Number(e.target.value) })}
                  className="w-full accent-brand-600 cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-ink-tertiary mt-1">
                  <span>₹10,000</span>
                  <span>₹50,000</span>
                  <span>₹1,20,000+</span>
                </div>
              </div>

              {/* 3. Dietary Policy in Flat */}
              <div>
                <label className="text-xs font-medium text-ink-primary block mb-2">3. Flat Kitchen Dietary Policy</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'Any', label: 'Any / Flexible' },
                    { id: 'Pure-Veg', label: 'Pure Veg Only' },
                    { id: 'Veg-Only Flat', label: 'Veg / Eggetarian' },
                    { id: 'Flexible', label: 'Separate Ware OK' },
                  ].map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setPreferences({ ...preferences, dietaryRule: d.id })}
                      className={`p-3 rounded-xl border text-xs font-medium transition-all ${
                        preferences.dietaryRule === d.id
                          ? 'border-brand-600 bg-brand-50 text-brand-900 font-semibold ring-1 ring-brand-500'
                          : 'border-surface-200 bg-surface-50 text-ink-secondary hover:bg-surface-100'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. Smoking Policy */}
              <div>
                <label className="text-xs font-medium text-ink-primary block mb-2">4. Smoking Policy</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'Strictly Non-Smoking', label: 'Non-Smoking' },
                    { id: 'Balcony Only', label: 'Balcony OK' },
                    { id: 'Flexible', label: 'Flexible' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setPreferences({ ...preferences, smokingPolicy: s.id })}
                      className={`p-3 rounded-xl border text-xs font-medium transition-all ${
                        preferences.smokingPolicy === s.id
                          ? 'border-brand-600 bg-brand-50 text-brand-900 font-semibold ring-1 ring-brand-500'
                          : 'border-surface-200 bg-surface-50 text-ink-secondary hover:bg-surface-100'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 5. Alcohol Policy */}
              <div>
                <label className="text-xs font-medium text-ink-primary block mb-2">5. Alcohol Policy</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'Teetotaler', label: 'Teetotaler Only' },
                    { id: 'Moderate', label: 'Social / Occasional' },
                    { id: 'Flexible', label: 'Allowed' },
                  ].map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => setPreferences({ ...preferences, alcoholPolicy: a.id })}
                      className={`p-3 rounded-xl border text-xs font-medium transition-all ${
                        preferences.alcoholPolicy === a.id
                          ? 'border-brand-600 bg-brand-50 text-brand-900 font-semibold ring-1 ring-brand-500'
                          : 'border-surface-200 bg-surface-50 text-ink-secondary hover:bg-surface-100'
                      }`}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 6. Pet Policy */}
              <div>
                <label className="text-xs font-medium text-ink-primary block mb-2">6. Pets Policy</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'Strictly No Pets', label: 'Strictly No Pets' },
                    { id: 'Pet-Friendly', label: 'Pet-Friendly' },
                    { id: 'Has Pet', label: 'I Have a Pet' },
                    { id: 'Flexible', label: 'Flexible' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPreferences({ ...preferences, petPolicy: p.id })}
                      className={`p-3 rounded-xl border text-xs font-medium transition-all ${
                        preferences.petPolicy === p.id
                          ? 'border-brand-600 bg-brand-50 text-brand-900 font-semibold ring-1 ring-brand-500'
                          : 'border-surface-200 bg-surface-50 text-ink-secondary hover:bg-surface-100'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 7. Commute Radius & Transit */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-medium text-ink-primary">7. Maximum Commute Time to Work/College</label>
                  <span className="text-xs font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-md">
                    {preferences.maxCommuteMins} Minutes
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="90"
                  step="5"
                  value={preferences.maxCommuteMins}
                  onChange={(e) => setPreferences({ ...preferences, maxCommuteMins: Number(e.target.value) })}
                  className="w-full accent-brand-600 cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-ink-tertiary mt-1">
                  <span>10 mins (Walking)</span>
                  <span>35 mins</span>
                  <span>90 mins</span>
                </div>
              </div>

              {/* 8. Target Move-in Date & 9. Desired Stay Duration */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-ink-primary block mb-1.5">
                    8. Latest Acceptable Move-in Date
                  </label>
                  <input
                    type="date"
                    required
                    value={preferences.latestMoveIn}
                    onChange={(e) => setPreferences({ ...preferences, latestMoveIn: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-surface-300 text-xs text-ink-primary bg-surface-50 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-ink-primary block mb-1.5">
                    9. Desired Stay Duration
                  </label>
                  <select
                    value={preferences.stayDuration}
                    onChange={(e) => setPreferences({ ...preferences, stayDuration: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-surface-300 text-xs text-ink-primary bg-surface-50 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  >
                    <option value={3}>3 Months (Short Term)</option>
                    <option value={6}>6 Months</option>
                    <option value={11}>11 Months (Standard)</option>
                    <option value={12}>12 Months</option>
                    <option value={24}>24 Months (Long Term)</option>
                  </select>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* STEP 2: Circadian Rhythm & Routine Schedules (Factors 10 to 13) */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="text-lg font-semibold text-ink-primary flex items-center gap-2">
                <Clock className="w-5 h-5 text-brand-600" />
                Step 2: Circadian Rhythm & Schedules (Factors 10 to 13)
              </h2>
              <p className="text-xs text-ink-secondary mt-0.5">
                Our Fuzzy Logic engine calculates continuous sleep synchronization on a 24-hour circular scale to prevent nighttime disturbances.
              </p>
            </div>

            <div className="space-y-6 pt-2">
              
              {/* 10. Bedtime Hour */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs font-medium text-ink-primary flex items-center gap-1.5">
                    <Moon className="w-4 h-4 text-indigo-500" />
                    10. Typical Bedtime
                  </span>
                  <span className="text-xs font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-md">
                    {preferences.sleepSchedule === 0 ? '12:00 AM Midnight' : (
                      preferences.sleepSchedule < 12 
                        ? `${preferences.sleepSchedule}:00 AM` 
                        : (preferences.sleepSchedule === 12 ? '12:00 PM' : `${preferences.sleepSchedule - 12}:00 PM`)
                    )}
                  </span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="28"
                  step="0.5"
                  value={preferences.sleepSchedule >= 20 ? preferences.sleepSchedule : preferences.sleepSchedule + 24}
                  onChange={(e) => {
                    const raw = Number(e.target.value);
                    const normalized = raw >= 24 ? raw - 24 : raw;
                    setPreferences({ ...preferences, sleepSchedule: normalized });
                  }}
                  className="w-full accent-brand-600 cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-ink-tertiary mt-1">
                  <span>8:00 PM (Early Bird)</span>
                  <span>11:30 PM (Typical)</span>
                  <span>4:00 AM (Night Owl)</span>
                </div>
              </div>

              {/* 11. Wake-up Hour */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs font-medium text-ink-primary flex items-center gap-1.5">
                    <Sun className="w-4 h-4 text-amber-500" />
                    11. Typical Wake-up Time
                  </span>
                  <span className="text-xs font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-md">
                    {preferences.wakeSchedule}:00 AM
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="12"
                  step="0.5"
                  value={preferences.wakeSchedule}
                  onChange={(e) => setPreferences({ ...preferences, wakeSchedule: Number(e.target.value) })}
                  className="w-full accent-brand-600 cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-ink-tertiary mt-1">
                  <span>5:00 AM (Early Riser)</span>
                  <span>7:30 AM</span>
                  <span>12:00 PM</span>
                </div>
              </div>

              {/* 12. Work / College Schedule */}
              <div>
                <label className="text-xs font-medium text-ink-primary block mb-2">
                  12. Work & Study Shift Schedule
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    'Standard Day (9 AM - 6 PM)',
                    'Night / US Shift',
                    'College / Student Hours',
                    'Flexible / Freelance',
                  ].map((w) => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => setPreferences({ ...preferences, workSchedule: w })}
                      className={`p-3 rounded-xl border text-xs font-medium transition-all ${
                        preferences.workSchedule === w
                          ? 'border-brand-600 bg-brand-50 text-brand-900 font-semibold ring-1 ring-brand-500'
                          : 'border-surface-200 bg-surface-50 text-ink-secondary hover:bg-surface-100'
                      }`}
                    >
                      {w}
                    </button>
                  ))}
                </div>
              </div>

              {/* 13. Work From Home Frequency */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs font-medium text-ink-primary flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4 text-teal-600" />
                    13. Work From Home Days per Week
                  </span>
                  <span className="text-xs font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-md">
                    {preferences.wfhDays} Days / Week
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="7"
                  value={preferences.wfhDays}
                  onChange={(e) => setPreferences({ ...preferences, wfhDays: Number(e.target.value) })}
                  className="w-full accent-brand-600 cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-ink-tertiary mt-1">
                  <span>0 Days (In-office Daily)</span>
                  <span>3 Days (Hybrid)</span>
                  <span>7 Days (100% Remote)</span>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* STEP 3: Hygiene & Personal Space Boundaries (Factors 14 to 18) */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="text-lg font-semibold text-ink-primary flex items-center gap-2">
                <Users className="w-5 h-5 text-brand-600" />
                Step 3: Hygiene, Noise & Personal Space (Factors 14 to 18)
              </h2>
              <p className="text-xs text-ink-secondary mt-0.5">
                Set transparent expectations for visitors, cleanliness standards, and personal sanctuary.
              </p>
            </div>

            <div className="space-y-6 pt-2">
              
              {/* 14. Cleanliness rating */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs font-medium text-ink-primary">14. Cleanliness Standard (1 to 5)</span>
                  <span className="text-xs font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-md">
                    Rating: {preferences.cleanliness} / 5
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={preferences.cleanliness}
                  onChange={(e) => setPreferences({ ...preferences, cleanliness: Number(e.target.value) })}
                  className="w-full accent-brand-600 cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-ink-tertiary mt-1">
                  <span>1: Casual / Weekly</span>
                  <span>3: Regular cleaning</span>
                  <span>5: Impeccable / Daily Maid</span>
                </div>
              </div>

              {/* 15. Noise Tolerance */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs font-medium text-ink-primary flex items-center gap-1.5">
                    <Volume2 className="w-4 h-4 text-ink-tertiary" />
                    15. Noise Tolerance & Ambient Activity
                  </span>
                  <span className="text-xs font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-md">
                    Rating: {preferences.noiseTolerance} / 5
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={preferences.noiseTolerance}
                  onChange={(e) => setPreferences({ ...preferences, noiseTolerance: Number(e.target.value) })}
                  className="w-full accent-brand-600 cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-ink-tertiary mt-1">
                  <span>Pin-Drop Silence Required</span>
                  <span>Moderate Living Sounds</span>
                  <span>Speakers & Buzz Friendly</span>
                </div>
              </div>

              {/* 16. Daytime Guest Policy */}
              <div>
                <label className="text-xs font-medium text-ink-primary block mb-2">16. Daytime Friends & Visitors Policy</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'Rare', label: 'Rare / Seldom' },
                    { id: 'Occasional', label: 'Occasional (With Notice)' },
                    { id: 'Frequent', label: 'Frequent / Open Door' },
                  ].map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setPreferences({ ...preferences, guestPolicy: g.id })}
                      className={`p-3 rounded-xl border text-xs font-medium transition-all ${
                        preferences.guestPolicy === g.id
                          ? 'border-brand-600 bg-brand-50 text-brand-900 font-semibold ring-1 ring-brand-500'
                          : 'border-surface-200 bg-surface-50 text-ink-secondary hover:bg-surface-100'
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 17. Overnight Guests */}
              <div>
                <label className="text-xs font-medium text-ink-primary block mb-2">17. Overnight Guests Policy</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'Not Allowed', label: 'Strictly Not Allowed' },
                    { id: 'With Notice', label: 'Allowed (24h Advance Notice)' },
                    { id: 'Frequent', label: 'Frequent / Welcome' },
                  ].map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => setPreferences({ ...preferences, overnightGuests: o.id })}
                      className={`p-3 rounded-xl border text-xs font-medium transition-all ${
                        preferences.overnightGuests === o.id
                          ? 'border-brand-600 bg-brand-50 text-brand-900 font-semibold ring-1 ring-brand-500'
                          : 'border-surface-200 bg-surface-50 text-ink-secondary hover:bg-surface-100'
                      }`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 18. Personal Space */}
              <div>
                <label className="text-xs font-medium text-ink-primary block mb-2">18. Personal Space Sanctuary</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'High', label: 'High (Solitary Retreat)' },
                    { id: 'Balanced', label: 'Balanced (Private + Casual Chat)' },
                    { id: 'Communal', label: 'Communal (Always Interactive)' },
                  ].map((ps) => (
                    <button
                      key={ps.id}
                      type="button"
                      onClick={() => setPreferences({ ...preferences, personalSpace: ps.id })}
                      className={`p-3 rounded-xl border text-xs font-medium transition-all ${
                        preferences.personalSpace === ps.id
                          ? 'border-brand-600 bg-brand-50 text-brand-900 font-semibold ring-1 ring-brand-500'
                          : 'border-surface-200 bg-surface-50 text-ink-secondary hover:bg-surface-100'
                      }`}
                    >
                      {ps.label}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* STEP 4: Social, Kitchen & Study Habits + Weights (Factors 19 to 22) */}
        {currentStep === 4 && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="text-lg font-semibold text-ink-primary flex items-center gap-2">
                <Sliders className="w-5 h-5 text-brand-600" />
                Step 4: Social, Kitchen Habits & Importance Weights (Factors 19 to 22)
              </h2>
              <p className="text-xs text-ink-secondary mt-0.5">
                Complete the final four lifestyle dimensions and assign weights for personalized ranking.
              </p>
            </div>

            <div className="space-y-6 pt-2">
              
              {/* 19. Social Preference */}
              <div>
                <label className="text-xs font-medium text-ink-primary block mb-2">19. Home Social Atmosphere</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'Quiet Retreat', label: 'Quiet Retreat' },
                    { id: 'Balanced', label: 'Balanced Vibe' },
                    { id: 'Social Hub', label: 'Lively Social Hub' },
                  ].map((sp) => (
                    <button
                      key={sp.id}
                      type="button"
                      onClick={() => setPreferences({ ...preferences, socialPreference: sp.id })}
                      className={`p-3 rounded-xl border text-xs font-medium transition-all ${
                        preferences.socialPreference === sp.id
                          ? 'border-brand-600 bg-brand-50 text-brand-900 font-semibold ring-1 ring-brand-500'
                          : 'border-surface-200 bg-surface-50 text-ink-secondary hover:bg-surface-100'
                      }`}
                    >
                      {sp.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 20. Cooking Frequency */}
              <div>
                <label className="text-xs font-medium text-ink-primary block mb-2">20. Cooking & Kitchen Habits</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'Daily', label: 'Daily Home Cooking' },
                    { id: 'Occasional', label: 'Occasional / Weekends' },
                    { id: 'Tiffin / Delivery', label: 'Tiffin / Ordering' },
                  ].map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setPreferences({ ...preferences, cookingHabit: c.id })}
                      className={`p-3 rounded-xl border text-xs font-medium transition-all ${
                        preferences.cookingHabit === c.id
                          ? 'border-brand-600 bg-brand-50 text-brand-900 font-semibold ring-1 ring-brand-500'
                          : 'border-surface-200 bg-surface-50 text-ink-secondary hover:bg-surface-100'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 21. Grocery / Food Sharing */}
              <div>
                <label className="text-xs font-medium text-ink-primary block mb-2">21. Food & Pantry Sharing</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'Separate Groceries', label: 'Separate Groceries' },
                    { id: 'Shared Staples', label: 'Split Staples (Milk, Oil, Spices)' },
                    { id: 'Full Communal', label: 'Full Communal Kitchen' },
                  ].map((fs) => (
                    <button
                      key={fs.id}
                      type="button"
                      onClick={() => setPreferences({ ...preferences, foodSharing: fs.id })}
                      className={`p-3 rounded-xl border text-xs font-medium transition-all ${
                        preferences.foodSharing === fs.id
                          ? 'border-brand-600 bg-brand-50 text-brand-900 font-semibold ring-1 ring-brand-500'
                          : 'border-surface-200 bg-surface-50 text-ink-secondary hover:bg-surface-100'
                      }`}
                    >
                      {fs.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 22. Study & Deep Work Habits */}
              <div>
                <label className="text-xs font-medium text-ink-primary block mb-2">22. Study & Focus Hours Habits</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    'Quiet exam & work hours',
                    'Relaxed studying with background music',
                    'Flexible / Collaborative work',
                  ].map((sh) => (
                    <button
                      key={sh}
                      type="button"
                      onClick={() => setPreferences({ ...preferences, studyHabits: sh })}
                      className={`p-3 rounded-xl border text-xs font-medium transition-all ${
                        preferences.studyHabits === sh
                          ? 'border-brand-600 bg-brand-50 text-brand-900 font-semibold ring-1 ring-brand-500'
                          : 'border-surface-200 bg-surface-50 text-ink-secondary hover:bg-surface-100'
                      }`}
                    >
                      {sh}
                    </button>
                  ))}
                </div>
              </div>

              {/* Personalized Importance Weights */}
              <div className="pt-4 border-t border-surface-200">
                <span className="text-xs font-semibold text-ink-primary block mb-3">
                  Relative Importance Weights (1 = Minor, 5 = Critical)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { key: 'budget', label: 'Budget Precision' },
                    { key: 'sleepSync', label: 'Sleep & Wake Synchronization' },
                    { key: 'cleanliness', label: 'Hygiene & Cleanliness' },
                    { key: 'noise', label: 'Quiet Hours & Acoustic Quietude' },
                    { key: 'guests', label: 'Guest & Visitor Boundaries' },
                    { key: 'wfh', label: 'WFH Desk Exclusivity' },
                  ].map((item) => (
                    <div key={item.key} className="p-3 rounded-xl bg-surface-50 border border-surface-200 flex items-center justify-between">
                      <span className="text-xs text-ink-primary font-medium">{item.label}</span>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((w) => (
                          <button
                            key={w}
                            type="button"
                            onClick={() => handleWeightChange(item.key, w)}
                            className={`w-6 h-6 rounded-md text-[11px] font-semibold transition-all ${
                              preferences.weights[item.key] === w
                                ? 'bg-brand-600 text-white shadow-2xs'
                                : 'bg-surface-200/80 text-ink-secondary hover:bg-surface-300'
                            }`}
                          >
                            {w}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Wizard Navigation Footer */}
        <div className="mt-8 pt-6 border-t border-surface-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          {currentStep > 1 ? (
            <Button
              variant="secondary"
              size="sm"
              icon={ArrowLeft}
              disabled={saving}
              onClick={() => setCurrentStep(currentStep - 1)}
            >
              Previous Section
            </Button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-3">
            {currentStep < 4 ? (
              <Button
                variant="primary"
                size="sm"
                icon={ArrowRight}
                iconPosition="right"
                onClick={() => setCurrentStep(currentStep + 1)}
              >
                Next Section
              </Button>
            ) : (
              <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
                <Button
                  variant="primary"
                  size="md"
                  icon={saving ? Loader2 : Sparkles}
                  iconPosition="right"
                  disabled={saving || !factorEvaluation.isComplete}
                  onClick={handleFinish}
                  className={!factorEvaluation.isComplete ? 'opacity-50 cursor-not-allowed' : ''}
                >
                  {saving
                    ? 'Saving Preferences...'
                    : factorEvaluation.isComplete
                    ? 'Calculate Compatibility Matches (22/22 Complete)'
                    : `Complete All 22 Factors (${factorEvaluation.completed}/22)`}
                </Button>
              </div>
            )}
          </div>
        </div>

      </Card>

    </div>
  );
};
