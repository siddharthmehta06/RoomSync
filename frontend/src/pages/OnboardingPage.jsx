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
  Compass,
  BookmarkCheck,
  Check,
  RefreshCw,
  ExternalLink,
  Edit3
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { useAuth } from '../context/AuthContext';
import { 
  fetchSeekerQuestionnaire, 
  saveSeekerQuestionnaire, 
  validateSeekerQuestionnaire 
} from '../services/api';

/**
 * The Canonical 22 Interpersonal Compatibility Factors Definition
 * Every factor defaults to 'Flexible'
 */
const CANONICAL_22_METADATA = [
  // Section 1: Space & Living Logistics (Factors 1 to 5)
  {
    key: 'location',
    number: 1,
    label: 'Location & Commute',
    category: 'space',
    type: 'select',
    description: 'Transit proximity and acceptable commute radius across Mumbai / MMR',
    options: [
      'Flexible',
      'Within 15 mins of Metro / Western Railway',
      'Within 30 mins of Transit Hub',
      'Walking distance to Tech Park / College',
      'Near Business District / BKC',
    ],
  },
  {
    key: 'budget',
    number: 2,
    label: 'Budget (Monthly Rent Ceiling)',
    category: 'space',
    type: 'budget',
    description: 'Maximum monthly rent contribution you are willing to pay',
  },
  {
    key: 'moveInDate',
    number: 3,
    label: 'Target Move-in Date',
    category: 'space',
    type: 'date',
    description: 'Earliest or ideal date you are planning to occupy the room',
  },
  {
    key: 'stayDuration',
    number: 4,
    label: 'Duration of Stay',
    category: 'space',
    type: 'select',
    description: 'Expected lease or stay commitment length',
    options: [
      { label: 'Flexible', value: 'Flexible' },
      { label: '3 Months (Short-term)', value: 3 },
      { label: '6 Months (Semester / Medium-term)', value: 6 },
      { label: '11 Months (Standard Rental Agreement)', value: 11 },
      { label: '12+ Months (Long-term Stay)', value: 12 },
    ],
  },
  {
    key: 'rulesStrictness',
    number: 5,
    label: 'House Rules & Curfew Strictness',
    category: 'space',
    type: 'select',
    description: 'Society gate restrictions, curfews, and formal flat rules',
    options: [
      'Flexible',
      'Strict Curfew & Formal House Rules',
      'Moderate Society Rules',
      'Relaxed / Self-Managed',
    ],
  },

  // Section 2: Daily Rhythm & Work Habits (Factors 6 to 10)
  {
    key: 'sleepSchedule',
    number: 6,
    label: 'Typical Bedtime Hour',
    category: 'rhythm',
    type: 'time',
    description: 'Approximate hour you typically turn off lights and go to sleep',
  },
  {
    key: 'wakeSchedule',
    number: 7,
    label: 'Typical Wake-up Hour',
    category: 'rhythm',
    type: 'time',
    description: 'Approximate hour you wake up and begin daily morning routines',
  },
  {
    key: 'workSchedule',
    number: 8,
    label: 'Work / College Schedule',
    category: 'rhythm',
    type: 'select',
    description: 'Nature of your working hours and daytime commitments',
    options: [
      'Flexible',
      'Standard Day Shifts (9 AM - 6 PM)',
      'Rotational / Night Shifts',
      'College / Student Hours',
      'Freelance / Flexible Hours',
    ],
  },
  {
    key: 'wfhFrequency',
    number: 9,
    label: 'Work-from-Home Days (per week)',
    category: 'rhythm',
    type: 'wfh',
    description: 'Number of days per week you work remotely from the room',
  },
  {
    key: 'studyHabits',
    number: 10,
    label: 'Study & Deep Work Environment',
    category: 'rhythm',
    type: 'select',
    description: 'Acoustic environment needed for focused work or exam preparation',
    options: [
      'Flexible',
      'Quiet Exam Prep & Deep Focus Hours',
      'Relaxed Studying with Low Background Audio',
      'Collaborative / Group Study Welcomed',
    ],
  },

  // Section 3: Kitchen, Food & Personal Habits (Factors 11 to 16)
  {
    key: 'foodPreference',
    number: 11,
    label: 'Dietary Preference & Kitchen Rules',
    category: 'kitchen',
    type: 'select',
    description: 'Personal diet and acceptable flat kitchen cooking rules',
    options: [
      'Flexible',
      'Pure Vegetarian',
      'Veg-Only Flat',
      'Eggetarian / Flexible Non-veg',
      'Non-Veg Welcome',
    ],
  },
  {
    key: 'cookingFrequency',
    number: 12,
    label: 'Cooking Frequency',
    category: 'kitchen',
    type: 'select',
    description: 'How frequently you prepare meals in the shared kitchen',
    options: [
      'Flexible',
      'Daily Home Cooking',
      'Light / Occasional Cooking',
      'Tiffin / Dining Out',
    ],
  },
  {
    key: 'foodSharing',
    number: 13,
    label: 'Grocery & Pantry Sharing',
    category: 'kitchen',
    type: 'select',
    description: 'How cooking supplies, spices, and groceries are managed',
    options: [
      'Flexible',
      'Separate Kitchen Supplies',
      'Shared Common Staples',
      'Fully Communal Groceries',
    ],
  },
  {
    key: 'smoking',
    number: 14,
    label: 'Smoking Policy',
    category: 'kitchen',
    type: 'select',
    description: 'Flat smoking regulations and personal habits',
    options: [
      'Flexible',
      'Strictly Non-Smoking',
      'Balcony Only',
      'Allowed',
    ],
  },
  {
    key: 'alcohol',
    number: 15,
    label: 'Alcohol Policy',
    category: 'kitchen',
    type: 'select',
    description: 'Flat social drinking preferences',
    options: [
      'Flexible',
      'Teetotaler',
      'Moderate / Social Drinking',
      'Allowed',
    ],
  },
  {
    key: 'pets',
    number: 16,
    label: 'Pets Preference',
    category: 'kitchen',
    type: 'select',
    description: 'Companionship with dogs, cats, or other animals in the apartment',
    options: [
      'Flexible',
      'Strictly No Pets',
      'Pet-Friendly',
      'Has Pet',
      'Allergies / No Pets',
    ],
  },

  // Section 4: Home Atmosphere & Boundaries (Factors 17 to 22)
  {
    key: 'cleanliness',
    number: 17,
    label: 'Cleanliness Standard (1 to 5)',
    category: 'atmosphere',
    type: 'rating',
    description: 'Expectation for routine tidiness, dish-washing, and deep cleaning',
  },
  {
    key: 'noiseTolerance',
    number: 18,
    label: 'Noise Tolerance (1 to 5)',
    category: 'atmosphere',
    type: 'rating',
    description: 'Sensitivity to ambient noise, television, calls, and music in common areas',
  },
  {
    key: 'guestsDay',
    number: 19,
    label: 'Daytime Guests & Friends',
    category: 'atmosphere',
    type: 'select',
    description: 'Frequency and policy for inviting daytime visitors',
    options: [
      'Flexible',
      'Rare / Advance Notice Required',
      'Occasional Friends Welcome',
      'Frequent / Active Social Life',
    ],
  },
  {
    key: 'guestsOvernight',
    number: 20,
    label: 'Overnight Guests Policy',
    category: 'atmosphere',
    type: 'select',
    description: 'Ground rules regarding guests staying the night',
    options: [
      'Flexible',
      'Not Permitted',
      'Allowed with Advance Notice',
      'Allowed Anytime',
    ],
  },
  {
    key: 'socialPreference',
    number: 21,
    label: 'Home Social Dynamic',
    category: 'atmosphere',
    type: 'select',
    description: 'Preference between home as a serene sanctuary vs lively community hub',
    options: [
      'Flexible',
      'Quiet Sanctuary (Rest & Rejuvenation)',
      'Balanced Social Life (Friendly but Private)',
      'Active Social Hub (Community & Hosting)',
    ],
  },
  {
    key: 'personalSpace',
    number: 22,
    label: 'Personal Space & Solitude',
    category: 'atmosphere',
    type: 'select',
    description: 'Balance between private solitude in your bedroom vs shared communal interaction',
    options: [
      'Flexible',
      'High (Value Independent Solitude)',
      'Balanced (Mix of Private & Shared Time)',
      'Communal (Thrive in Shared Spaces)',
    ],
  },
];

const SECTIONS = [
  { id: 'space', title: 'Space & Logistics', subtitle: 'Location, budget, lease & house rules', range: 'Factors 1–5', icon: Home },
  { id: 'rhythm', title: 'Daily Rhythm', subtitle: 'Sleep, wake, WFH & study focus', range: 'Factors 6–10', icon: Clock },
  { id: 'kitchen', title: 'Kitchen & Habits', subtitle: 'Diet, cooking, smoking, alcohol & pets', range: 'Factors 11–16', icon: Utensils },
  { id: 'atmosphere', title: 'Atmosphere & Boundaries', subtitle: 'Cleanliness, noise, guests & privacy', range: 'Factors 17–22', icon: Users },
];

export const OnboardingPage = () => {
  const navigate = useNavigate();
  const { token, user, updateUser } = useAuth();

  const [activeSectionId, setActiveSectionId] = useState('space');
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draftSavedBanner, setDraftSavedBanner] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isCompletedView, setIsCompletedView] = useState(false);

  // Initialize all 22 canonical factors defaulting to 'Flexible'
  const [factorValues, setFactorValues] = useState(() => {
    // Try localStorage draft first
    try {
      const saved = localStorage.getItem('roomsync_seeker_factors_draft');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed === 'object' && parsed !== null) {
          return {
            location: 'Flexible',
            budget: 'Flexible',
            foodPreference: 'Flexible',
            smoking: 'Flexible',
            alcohol: 'Flexible',
            sleepSchedule: 'Flexible',
            wakeSchedule: 'Flexible',
            cleanliness: 'Flexible',
            noiseTolerance: 'Flexible',
            guestsDay: 'Flexible',
            guestsOvernight: 'Flexible',
            socialPreference: 'Flexible',
            workSchedule: 'Flexible',
            wfhFrequency: 'Flexible',
            studyHabits: 'Flexible',
            cookingFrequency: 'Flexible',
            pets: 'Flexible',
            foodSharing: 'Flexible',
            moveInDate: 'Flexible',
            stayDuration: 'Flexible',
            personalSpace: 'Flexible',
            rulesStrictness: 'Flexible',
            ...parsed,
          };
        }
      }
    } catch (e) {
      // ignore
    }

    return {
      location: 'Flexible',
      budget: 'Flexible',
      foodPreference: 'Flexible',
      smoking: 'Flexible',
      alcohol: 'Flexible',
      sleepSchedule: 'Flexible',
      wakeSchedule: 'Flexible',
      cleanliness: 'Flexible',
      noiseTolerance: 'Flexible',
      guestsDay: 'Flexible',
      guestsOvernight: 'Flexible',
      socialPreference: 'Flexible',
      workSchedule: 'Flexible',
      wfhFrequency: 'Flexible',
      studyHabits: 'Flexible',
      cookingFrequency: 'Flexible',
      pets: 'Flexible',
      foodSharing: 'Flexible',
      moveInDate: 'Flexible',
      stayDuration: 'Flexible',
      personalSpace: 'Flexible',
      rulesStrictness: 'Flexible',
    };
  });

  // Load existing saved questionnaire from backend if user is authenticated
  useEffect(() => {
    let isMounted = true;
    async function loadFromBackend() {
      if (!token) return;
      try {
        const { factors, completion } = await fetchSeekerQuestionnaire(token);
        if (isMounted && factors && Object.keys(factors).length > 0) {
          setFactorValues((prev) => ({
            ...prev,
            ...factors,
          }));
          if (completion?.isComplete && user?.hasCompletedOnboarding) {
            setIsCompletedView(true);
          }
        }
      } catch (err) {
        console.warn('[OnboardingPage] Could not load saved profile:', err.message);
      }
    }
    loadFromBackend();
    return () => {
      isMounted = false;
    };
  }, [token, user?.hasCompletedOnboarding]);

  // Handle single factor value update
  const setFactor = (key, value) => {
    setFactorValues((prev) => {
      const next = { ...prev, [key]: value };
      try {
        localStorage.setItem('roomsync_seeker_factors_draft', JSON.stringify(next));
      } catch (e) {
        // ignore
      }
      return next;
    });
    setErrorMessage(null);
  };

  // Evaluation across all 22 factors
  const factorEvaluation = useMemo(() => {
    let completedCount = 0;
    let flexibleCount = 0;
    let specificCount = 0;
    const missing = [];

    for (const factor of CANONICAL_22_METADATA) {
      const val = factorValues[factor.key];
      const isUnanswered = val === undefined || val === null || val === '';
      if (isUnanswered) {
        missing.push(factor.label);
      } else {
        completedCount++;
        if (val === 'Flexible') {
          flexibleCount++;
        } else {
          specificCount++;
        }
      }
    }

    const isComplete = completedCount === 22;
    const percentage = Math.round((completedCount / 22) * 100);

    return {
      completedCount,
      totalFactors: 22,
      isComplete,
      percentage,
      flexibleCount,
      specificCount,
      missing,
    };
  }, [factorValues]);

  // Section completion counts
  const sectionStats = useMemo(() => {
    const stats = {};
    for (const s of SECTIONS) {
      const factorsInSec = CANONICAL_22_METADATA.filter((f) => f.category === s.id);
      const done = factorsInSec.filter((f) => {
        const val = factorValues[f.key];
        return val !== undefined && val !== null && val !== '';
      }).length;
      stats[s.id] = {
        done,
        total: factorsInSec.length,
        isDone: done === factorsInSec.length,
      };
    }
    return stats;
  }, [factorValues]);

  // Action: Save Draft and Resume Later
  const handleSaveDraft = async () => {
    setIsSavingDraft(true);
    setErrorMessage(null);
    setDraftSavedBanner(false);

    try {
      localStorage.setItem('roomsync_seeker_factors_draft', JSON.stringify(factorValues));
      if (token) {
        await saveSeekerQuestionnaire(factorValues, token);
      }
      setDraftSavedBanner(true);
      setTimeout(() => setDraftSavedBanner(false), 4500);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to save draft. Responses are saved locally on your browser.');
    } finally {
      setIsSavingDraft(false);
    }
  };

  // Action: Submit Complete Questionnaire
  const handleSubmitComplete = async () => {
    if (!factorEvaluation.isComplete) {
      setErrorMessage(
        `All 22 factors must be answered before final submission. Currently completed: ${factorEvaluation.completedCount}/22. Unanswered: ${factorEvaluation.missing.join(', ')}`
      );
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      localStorage.setItem('roomsync_seeker_factors_draft', JSON.stringify(factorValues));
      if (token) {
        await saveSeekerQuestionnaire(factorValues, token);
        if (updateUser && user) {
          updateUser({ ...user, hasCompletedOnboarding: true });
        }
      }
      setIsCompletedView(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setErrorMessage(err.message || 'Failed to submit questionnaire.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ----------------------------------------------------
  // COMPLETED VIEW: Honest summary of saved 22 factors
  // ----------------------------------------------------
  if (isCompletedView) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 md:py-16 animate-fadeIn">
        <Card className="p-8 sm:p-12 shadow-apple bg-white border border-surface-200 rounded-3xl text-center">
          
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold mb-6">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>22 Compatibility Factors Verified & Saved</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-ink-primary">
            Questionnaire Profile Saved
          </h1>
          <p className="text-xs text-ink-secondary mt-2 max-w-md mx-auto leading-relaxed">
            Your 22 lifestyle preference responses have been recorded on your RoomSync account.
            All factors are preserved with exact distinctions between your flexible preferences and specific constraints.
          </p>

          {/* Breakdown of responses */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 my-8 text-left">
            <div className="p-4 rounded-2xl bg-surface-50 border border-surface-200">
              <div className="flex items-center gap-2 mb-1.5">
                <Home className="w-4 h-4 text-brand-600" />
                <h4 className="text-xs font-semibold text-ink-primary">Space & Tenancy</h4>
              </div>
              <p className="text-[11px] text-ink-secondary leading-relaxed">
                Budget: <strong>{factorValues.budget === 'Flexible' ? 'Flexible' : `₹${Number(factorValues.budget).toLocaleString('en-IN')}/mo`}</strong> · 
                Location: <strong>{factorValues.location}</strong> · 
                Stay: <strong>{factorValues.stayDuration === 'Flexible' ? 'Flexible' : `${factorValues.stayDuration} months`}</strong>
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-surface-50 border border-surface-200">
              <div className="flex items-center gap-2 mb-1.5">
                <Clock className="w-4 h-4 text-brand-600" />
                <h4 className="text-xs font-semibold text-ink-primary">Circadian Rhythm & Work</h4>
              </div>
              <p className="text-[11px] text-ink-secondary leading-relaxed">
                Sleep: <strong>{factorValues.sleepSchedule === 'Flexible' ? 'Flexible' : `${factorValues.sleepSchedule}:00`}</strong> · 
                Wake: <strong>{factorValues.wakeSchedule === 'Flexible' ? 'Flexible' : `${factorValues.wakeSchedule}:00`}</strong> · 
                WFH: <strong>{factorValues.wfhFrequency === 'Flexible' ? 'Flexible' : `${factorValues.wfhFrequency} days/wk`}</strong>
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-surface-50 border border-surface-200">
              <div className="flex items-center gap-2 mb-1.5">
                <Utensils className="w-4 h-4 text-brand-600" />
                <h4 className="text-xs font-semibold text-ink-primary">Kitchen & Habits</h4>
              </div>
              <p className="text-[11px] text-ink-secondary leading-relaxed">
                Diet: <strong>{factorValues.foodPreference}</strong> · 
                Cooking: <strong>{factorValues.cookingFrequency}</strong> · 
                Smoking: <strong>{factorValues.smoking}</strong> · 
                Alcohol: <strong>{factorValues.alcohol}</strong>
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-surface-50 border border-surface-200">
              <div className="flex items-center gap-2 mb-1.5">
                <Users className="w-4 h-4 text-brand-600" />
                <h4 className="text-xs font-semibold text-ink-primary">Atmosphere & Boundaries</h4>
              </div>
              <p className="text-[11px] text-ink-secondary leading-relaxed">
                Cleanliness: <strong>{factorValues.cleanliness === 'Flexible' ? 'Flexible' : `Level ${factorValues.cleanliness}/5`}</strong> · 
                Noise: <strong>{factorValues.noiseTolerance === 'Flexible' ? 'Flexible' : `Level ${factorValues.noiseTolerance}/5`}</strong> · 
                Social: <strong>{factorValues.socialPreference}</strong>
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-brand-50/60 border border-brand-100 text-xs text-brand-900 text-left mb-8 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-brand-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Transparent Factor Storage Guarantee</p>
              <p className="text-[11px] text-brand-800/90 mt-0.5 leading-relaxed">
                {factorEvaluation.flexibleCount} factors are set to Flexible (accepting different possibilities) and {factorEvaluation.specificCount} factors have specific preferences. No artificial scores are displayed.
              </p>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              variant="primary"
              size="lg"
              className="w-full sm:w-auto"
              onClick={() => navigate('/explore')}
            >
              <span>Explore Verified Rooms</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>

            <Button
              variant="secondary"
              size="lg"
              className="w-full sm:w-auto"
              onClick={() => setIsCompletedView(false)}
            >
              <Edit3 className="w-4 h-4 mr-1.5" />
              <span>Edit Questionnaire Answers</span>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // ----------------------------------------------------
  // MAIN QUESTIONNAIRE WIZARD VIEW
  // ----------------------------------------------------
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 md:py-12">
      
      {/* Page Header */}
      <div className="text-center max-w-xl mx-auto mb-8">
        <Badge variant="teal" size="sm" className="mb-2">Phase 2 · 22-Factor Questionnaire</Badge>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-ink-primary">
          Lifestyle Compatibility Questionnaire
        </h1>
        <p className="text-xs text-ink-secondary mt-1.5 leading-relaxed">
          Specify your co-living expectations across the 22 standardized factors.
          Every factor defaults to <strong>Flexible</strong> so you only configure strict preferences when desired.
        </p>
      </div>

      {/* Progress & Persistence Banner */}
      <div className="mb-8 p-5 rounded-3xl bg-white border border-surface-200 shadow-apple space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-brand-600 shrink-0" />
            <span className="font-semibold text-ink-primary">
              Progress: {factorEvaluation.completedCount}/22 factors answered
            </span>
            <span className="text-ink-tertiary">
              ({factorEvaluation.flexibleCount} Flexible, {factorEvaluation.specificCount} Specific)
            </span>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Button
              variant="outline"
              size="sm"
              icon={isSavingDraft ? Loader2 : BookmarkCheck}
              disabled={isSavingDraft}
              onClick={handleSaveDraft}
            >
              {isSavingDraft ? 'Saving Draft...' : 'Save Draft & Resume Later'}
            </Button>
            <span className={`font-bold px-2.5 py-0.5 rounded-full text-[11px] ${
              factorEvaluation.isComplete ? 'bg-emerald-50 text-emerald-800' : 'bg-brand-50 text-brand-800'
            }`}>
              {factorEvaluation.percentage}% Complete
            </span>
          </div>
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

        {draftSavedBanner && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Draft saved successfully! You can leave and resume your questionnaire anytime.</span>
            </div>
            <button onClick={() => setDraftSavedBanner(false)} className="text-emerald-700 hover:text-emerald-900 font-bold">×</button>
          </div>
        )}

        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* 4 Section Navigation Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {SECTIONS.map((sec) => {
          const Icon = sec.icon;
          const stat = sectionStats[sec.id];
          const isActive = activeSectionId === sec.id;
          return (
            <button
              key={sec.id}
              onClick={() => setActiveSectionId(sec.id)}
              className={`p-3.5 rounded-2xl border text-left transition-all ${
                isActive
                  ? 'border-brand-600 bg-white ring-2 ring-brand-500/20 shadow-sm'
                  : 'border-surface-200 bg-white/60 text-ink-secondary hover:bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-tertiary">
                  {sec.range}
                </span>
                {stat.isDone && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
              </div>
              <div className="text-xs font-semibold text-ink-primary flex items-center gap-1.5">
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-brand-600' : 'text-ink-tertiary'}`} />
                <span>{sec.title}</span>
              </div>
              <div className="text-[10px] text-ink-tertiary mt-0.5">
                {stat.done}/{stat.total} answered
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Section Questions Card */}
      <Card className="p-6 sm:p-10 shadow-apple bg-white space-y-8">
        {CANONICAL_22_METADATA.filter((f) => f.category === activeSectionId).map((factor) => {
          const currentValue = factorValues[factor.key];
          const isFlexible = currentValue === 'Flexible';
          const isUnanswered = currentValue === undefined || currentValue === null || currentValue === '';

          return (
            <div 
              key={factor.key} 
              className={`p-5 rounded-2xl border transition-all ${
                isUnanswered
                  ? 'border-rose-200 bg-rose-50/20'
                  : isFlexible
                  ? 'border-surface-200 bg-surface-50/50'
                  : 'border-brand-200 bg-brand-50/20'
              }`}
            >
              {/* Question Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-ink-tertiary">#{factor.number}</span>
                    <h3 className="text-sm font-semibold text-ink-primary">{factor.label}</h3>
                    {isFlexible ? (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-surface-200 text-ink-secondary">
                        Flexible (Default)
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-brand-100 text-brand-800">
                        Specific Preference
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-ink-secondary mt-0.5">{factor.description}</p>
                </div>

                {/* Reset to Flexible button */}
                {!isFlexible && (
                  <button
                    type="button"
                    onClick={() => setFactor(factor.key, 'Flexible')}
                    className="text-[11px] font-medium text-brand-700 hover:text-brand-900 inline-flex items-center gap-1 self-start sm:self-auto"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Reset to Flexible</span>
                  </button>
                )}
              </div>

              {/* Input Control Based on Factor Type */}
              <div className="mt-3">
                {/* 1. SELECT TYPE (Dropdown / Pills) */}
                {factor.type === 'select' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {factor.options.map((opt) => {
                      const optValue = typeof opt === 'object' ? opt.value : opt;
                      const optLabel = typeof opt === 'object' ? opt.label : opt;
                      const isSelected = currentValue === optValue;

                      return (
                        <button
                          key={String(optValue)}
                          type="button"
                          onClick={() => setFactor(factor.key, optValue)}
                          className={`p-3 rounded-xl border text-xs text-left font-medium transition-all flex items-center justify-between ${
                            isSelected
                              ? 'border-brand-600 bg-brand-50 text-brand-900 font-semibold ring-1 ring-brand-500'
                              : 'border-surface-200 bg-white text-ink-secondary hover:bg-surface-50 hover:text-ink-primary'
                          }`}
                        >
                          <span>{optLabel}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-brand-600 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* 2. BUDGET TYPE */}
                {factor.type === 'budget' && (
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setFactor('budget', 'Flexible')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                          isFlexible
                            ? 'border-brand-600 bg-brand-50 text-brand-900 font-semibold'
                            : 'border-surface-200 bg-white text-ink-secondary hover:bg-surface-50'
                        }`}
                      >
                        Flexible (Any Budget)
                      </button>
                      {[15000, 20000, 25000, 35000, 50000].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setFactor('budget', preset)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                            currentValue === preset
                              ? 'border-brand-600 bg-brand-50 text-brand-900 font-semibold'
                              : 'border-surface-200 bg-white text-ink-secondary hover:bg-surface-50'
                          }`}
                        >
                          ₹{preset.toLocaleString('en-IN')}
                        </button>
                      ))}
                    </div>

                    {!isFlexible && (
                      <div className="pt-2">
                        <div className="flex justify-between items-center text-xs mb-1">
                          <span className="text-ink-secondary">Custom Rent Ceiling:</span>
                          <span className="font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded">
                            ₹{Number(currentValue).toLocaleString('en-IN')} / month
                          </span>
                        </div>
                        <input
                          type="range"
                          min="5000"
                          max="80000"
                          step="1000"
                          value={Number(currentValue) || 22000}
                          onChange={(e) => setFactor('budget', Number(e.target.value))}
                          className="w-full accent-brand-600 cursor-pointer"
                        />
                        <div className="flex justify-between text-[11px] text-ink-tertiary">
                          <span>₹5,000</span>
                          <span>₹25,000</span>
                          <span>₹80,000</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 3. DATE TYPE */}
                {factor.type === 'date' && (
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setFactor('moveInDate', 'Flexible')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        isFlexible
                          ? 'border-brand-600 bg-brand-50 text-brand-900 font-semibold'
                          : 'border-surface-200 bg-white text-ink-secondary hover:bg-surface-50'
                      }`}
                    >
                      Flexible (Immediate / Any Date)
                    </button>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-ink-secondary">Or specific date:</span>
                      <input
                        type="date"
                        value={isFlexible ? '' : currentValue}
                        onChange={(e) => setFactor('moveInDate', e.target.value)}
                        className="px-3 py-1.5 rounded-lg border border-surface-200 text-xs text-ink-primary bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                      />
                    </div>
                  </div>
                )}

                {/* 4. TIME / HOUR TYPE (Sleep & Wake) */}
                {factor.type === 'time' && (
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setFactor(factor.key, 'Flexible')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                          isFlexible
                            ? 'border-brand-600 bg-brand-50 text-brand-900 font-semibold'
                            : 'border-surface-200 bg-white text-ink-secondary hover:bg-surface-50'
                        }`}
                      >
                        Flexible (Varies)
                      </button>

                      {factor.key === 'sleepSchedule'
                        ? [21, 22, 23, 0, 1, 2].map((h) => {
                            const label = h === 0 ? '12:00 AM' : h > 12 ? `${h - 12}:00 PM` : `${h}:00 AM`;
                            return (
                              <button
                                key={h}
                                type="button"
                                onClick={() => setFactor(factor.key, h)}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                                  currentValue === h
                                    ? 'border-brand-600 bg-brand-50 text-brand-900 font-semibold'
                                    : 'border-surface-200 bg-white text-ink-secondary hover:bg-surface-50'
                                }`}
                              >
                                {label}
                              </button>
                            );
                          })
                        : [5, 6, 7, 8, 9, 10].map((h) => {
                            const label = `${h}:00 AM`;
                            return (
                              <button
                                key={h}
                                type="button"
                                onClick={() => setFactor(factor.key, h)}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                                  currentValue === h
                                    ? 'border-brand-600 bg-brand-50 text-brand-900 font-semibold'
                                    : 'border-surface-200 bg-white text-ink-secondary hover:bg-surface-50'
                                }`}
                              >
                                {label}
                              </button>
                            );
                          })}
                    </div>
                  </div>
                )}

                {/* 5. WFH FREQUENCY TYPE */}
                {factor.type === 'wfh' && (
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setFactor('wfhFrequency', 'Flexible')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        isFlexible
                          ? 'border-brand-600 bg-brand-50 text-brand-900 font-semibold'
                          : 'border-surface-200 bg-white text-ink-secondary hover:bg-surface-50'
                      }`}
                    >
                      Flexible
                    </button>
                    {[0, 1, 2, 3, 4, 5, 7].map((days) => (
                      <button
                        key={days}
                        type="button"
                        onClick={() => setFactor('wfhFrequency', days)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                          currentValue === days
                            ? 'border-brand-600 bg-brand-50 text-brand-900 font-semibold'
                            : 'border-surface-200 bg-white text-ink-secondary hover:bg-surface-50'
                        }`}
                      >
                        {days === 0 ? '0 Days (Office/Campus Full Time)' : days === 7 ? '7 Days (Fully Remote)' : `${days} Days / Wk`}
                      </button>
                    ))}
                  </div>
                )}

                {/* 6. RATING TYPE (1 to 5 index) */}
                {factor.type === 'rating' && (
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setFactor(factor.key, 'Flexible')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                          isFlexible
                            ? 'border-brand-600 bg-brand-50 text-brand-900 font-semibold'
                            : 'border-surface-200 bg-white text-ink-secondary hover:bg-surface-50'
                        }`}
                      >
                        Flexible
                      </button>
                      {[1, 2, 3, 4, 5].map((lvl) => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => setFactor(factor.key, lvl)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                            currentValue === lvl
                              ? 'border-brand-600 bg-brand-50 text-brand-900 font-semibold'
                              : 'border-surface-200 bg-white text-ink-secondary hover:bg-surface-50'
                          }`}
                        >
                          Level {lvl} {lvl === 1 ? '(Casual)' : lvl === 3 ? '(Balanced)' : lvl === 5 ? '(Strict/Impeccable)' : ''}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Section Navigation Footer */}
        <div className="pt-6 border-t border-surface-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Previous section */}
          {activeSectionId !== 'space' ? (
            <Button
              variant="secondary"
              size="sm"
              icon={ArrowLeft}
              onClick={() => {
                const curIdx = SECTIONS.findIndex((s) => s.id === activeSectionId);
                if (curIdx > 0) setActiveSectionId(SECTIONS[curIdx - 1].id);
              }}
            >
              Previous Section
            </Button>
          ) : (
            <div />
          )}

          {/* Next / Submit buttons */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              icon={isSavingDraft ? Loader2 : BookmarkCheck}
              disabled={isSavingDraft}
              onClick={handleSaveDraft}
            >
              Save Draft
            </Button>

            {activeSectionId !== 'atmosphere' ? (
              <Button
                variant="primary"
                size="sm"
                icon={ArrowRight}
                iconPosition="right"
                onClick={() => {
                  const curIdx = SECTIONS.findIndex((s) => s.id === activeSectionId);
                  if (curIdx < SECTIONS.length - 1) setActiveSectionId(SECTIONS[curIdx + 1].id);
                }}
              >
                Next Section
              </Button>
            ) : (
              <Button
                variant="primary"
                size="md"
                icon={isSubmitting ? Loader2 : CheckCircle2}
                iconPosition="right"
                disabled={isSubmitting || !factorEvaluation.isComplete}
                onClick={handleSubmitComplete}
                className={!factorEvaluation.isComplete ? 'opacity-50 cursor-not-allowed' : ''}
              >
                {isSubmitting
                  ? 'Saving Questionnaire...'
                  : factorEvaluation.isComplete
                  ? 'Submit Complete Questionnaire (22/22)'
                  : `Answer All 22 Factors (${factorEvaluation.completedCount}/22)`}
              </Button>
            )}
          </div>
        </div>
      </Card>

    </div>
  );
};
