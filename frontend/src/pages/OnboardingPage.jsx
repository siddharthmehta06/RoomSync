import React, { useState, useEffect } from 'react';
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
  AlertCircle
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card, CardContent } from '../components/ui/Card';
import { useAuth } from '../context/AuthContext';
import { savePreferencesApi, fetchPreferences } from '../services/api';

export const OnboardingPage = () => {
  const navigate = useNavigate();
  const { token, isAuthenticated } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Preference State covering the 22 factors
  const [preferences, setPreferences] = useState({
    // Hard constraints
    budgetCeiling: 22000,
    maxDeposit: 50000,
    dietaryRule: 'Any / Flexible', // 'Pure Veg Kitchen Only', 'Eggetarian Friendly', 'Any / Flexible'
    smokingPolicy: 'Strictly Non-Smoking', // 'Strictly Non-Smoking', 'Balcony Smoking OK', 'Smoking Allowed'
    alcoholPolicy: 'Moderate',
    petPolicy: 'Pet-Friendly',

    // Flexible preferences (continuous)
    bedtime: 23, // 11 PM
    wakeTime: 7,  // 7 AM
    cleanliness: 4, // 1 to 5
    noiseTolerance: 3, // 1 to 5
    guestPolicy: 'Occasional', // 'Rare', 'Occasional', 'Frequent'
    overnightGuests: 'With 24h Advance Notice', // 'Strictly No Overnight', 'With 24h Advance Notice', 'Anytime Welcome'
    wfhDays: 2,
    studyHoursNeeded: 2,
    cookingHabit: 'Occasional',
    foodSharingPreference: 'Separate Groceries',
    personalSpaceNeed: 'Balanced', // High, Balanced, Social
    houseRulesStrictness: 'Moderate',

    // Importance weights (1 to 5)
    weights: {
      budget: 5,
      diet: 4,
      sleepSync: 5,
      cleanliness: 4,
      noise: 4,
      guests: 3,
      wfh: 3,
    }
  });

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
            budgetCeiling: hc.budgetCeiling || prev.budgetCeiling,
            maxDeposit: hc.maxDeposit || prev.maxDeposit,
            dietaryRule: hc.dietaryRule === 'Pure-Veg' ? 'Pure Veg Kitchen Only' : (hc.dietaryRule === 'Veg-Only Flat' ? 'Eggetarian Friendly' : 'Any / Flexible'),
            smokingPolicy: hc.smokingPolicy === 'Strictly Non-Smoking' ? 'Strictly Non-Smoking' : (hc.smokingPolicy === 'Balcony Only' ? 'Balcony Smoking OK' : 'Smoking Allowed'),
            alcoholPolicy: hc.alcoholPolicy || prev.alcoholPolicy,
            petPolicy: hc.petPolicy || prev.petPolicy,
            bedtime: fp.sleepSchedule !== undefined ? (fp.sleepSchedule < 12 ? fp.sleepSchedule + 24 : fp.sleepSchedule) : prev.bedtime,
            wakeTime: fp.wakeSchedule !== undefined ? fp.wakeSchedule : prev.wakeTime,
            cleanliness: fp.cleanliness || prev.cleanliness,
            noiseTolerance: fp.noiseTolerance || prev.noiseTolerance,
            guestPolicy: fp.guestPolicy || prev.guestPolicy,
            overnightGuests: fp.overnightGuests === 'Not Allowed' ? 'Strictly No Overnight' : (fp.overnightGuests === 'Frequent' ? 'Anytime Welcome' : 'With 24h Advance Notice'),
            wfhDays: fp.wfhDays !== undefined ? fp.wfhDays : prev.wfhDays,
            weights: {
              ...prev.weights,
              ...iw,
            },
          }));
        }
      } catch (err) {
        // Fall back to default
      }
    }
    loadSaved();
    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleWeightChange = (key, val) => {
    setPreferences(prev => ({
      ...prev,
      weights: { ...prev.weights, [key]: Number(val) }
    }));
  };

  const steps = [
    { id: 1, title: 'Hard Constraints', desc: 'Non-negotiable deal breakers' },
    { id: 2, title: 'Circadian & Routines', desc: 'Sleep, wake & WFH habits' },
    { id: 3, title: 'Social & Boundaries', desc: 'Guests, noise & personal space' },
    { id: 4, title: 'Custom Weights', desc: 'How much each factor matters to you' },
  ];

  const handleFinish = async () => {
    setSaving(true);
    setErrorMessage(null);

    // Map UI values to backend schema
    const mappedDiet = preferences.dietaryRule === 'Pure Veg Kitchen Only' 
      ? 'Pure-Veg' 
      : (preferences.dietaryRule === 'Eggetarian Friendly' ? 'Veg-Only Flat' : 'Any');

    const mappedSmoking = preferences.smokingPolicy === 'Strictly Non-Smoking'
      ? 'Strictly Non-Smoking'
      : (preferences.smokingPolicy === 'Balcony Smoking OK' ? 'Balcony Only' : 'Flexible');

    const mappedOvernight = preferences.overnightGuests === 'Strictly No Overnight'
      ? 'Not Allowed'
      : (preferences.overnightGuests === 'Anytime Welcome' ? 'Frequent' : 'With Notice');

    const decimalSleep = preferences.bedtime >= 24 ? preferences.bedtime - 24 : preferences.bedtime;

    const payload = {
      hardConstraints: {
        budgetCeiling: Number(preferences.budgetCeiling) || 25000,
        maxDeposit: Number(preferences.maxDeposit) || 50000,
        dietaryRule: mappedDiet,
        smokingPolicy: mappedSmoking,
        alcoholPolicy: preferences.alcoholPolicy || 'Moderate',
        petPolicy: preferences.petPolicy || 'Pet-Friendly',
      },
      flexiblePreferences: {
        sleepSchedule: Number(decimalSleep),
        wakeSchedule: Number(preferences.wakeTime) || 7,
        cleanliness: Number(preferences.cleanliness) || 4,
        noiseTolerance: Number(preferences.noiseTolerance) || 3,
        guestPolicy: preferences.guestPolicy || 'Occasional',
        overnightGuests: mappedOvernight,
        socialPreference: preferences.personalSpaceNeed === 'Social' ? 'Social Hub' : (preferences.personalSpaceNeed === 'High' ? 'Quiet Retreat' : 'Balanced'),
        wfhDays: Number(preferences.wfhDays) || 2,
        cookingHabit: 'Occasional',
        foodSharing: preferences.foodSharingPreference || 'Separate Groceries',
        personalSpace: preferences.personalSpaceNeed === 'Social' ? 'Communal' : (preferences.personalSpaceNeed === 'High' ? 'High' : 'Balanced'),
        rulesStrictness: preferences.houseRulesStrictness || 'Moderate',
      },
      importanceWeights: {
        budget: Number(preferences.weights.budget) || 5,
        diet: Number(preferences.weights.diet) || 4,
        sleepSync: Number(preferences.weights.sleepSync) || 5,
        cleanliness: Number(preferences.weights.cleanliness) || 4,
        noise: Number(preferences.weights.noise) || 4,
        guests: Number(preferences.weights.guests) || 3,
        wfh: Number(preferences.weights.wfh) || 3,
      }
    };

    // Save locally for immediate offline state
    localStorage.setItem('roomsync_preferences', JSON.stringify(preferences));

    // Save to MongoDB if authenticated
    if (token) {
      try {
        await savePreferencesApi(payload, token);
      } catch (err) {
        console.warn('Could not save preferences to server:', err.message);
      }
    }

    setSaving(false);
    navigate('/matches');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 md:py-12">
      
      {/* Header */}
      <div className="text-center max-w-xl mx-auto mb-10">
        <Badge variant="teal" size="sm" className="mb-2">22-Factor Profile Engine</Badge>
        <h1 className="text-3xl font-semibold tracking-tight text-ink-primary">
          Design Your Ideal Shared Living Space
        </h1>
        <p className="text-xs text-ink-secondary mt-1">
          Tell us your non-negotiables and flexible living habits. We use these parameters to generate explainable, transparent matches.
        </p>
      </div>

      {errorMessage && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        </div>
      )}

      {/* Step Progress Indicators */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {steps.map((s) => (
          <button
            key={s.id}
            onClick={() => setCurrentStep(s.id)}
            className={`p-3 rounded-2xl border text-left transition-all ${
              currentStep === s.id
                ? 'border-brand-600 bg-white ring-2 ring-brand-500/20 shadow-sm'
                : currentStep > s.id
                ? 'border-emerald-200 bg-emerald-50/40 text-emerald-900'
                : 'border-surface-200 bg-surface-50 text-ink-tertiary'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Step {s.id}</span>
              {currentStep > s.id && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
            </div>
            <div className="text-xs font-semibold text-ink-primary">{s.title}</div>
          </button>
        ))}
      </div>

      {/* Main Questionnaire Card */}
      <Card className="p-6 sm:p-10 shadow-apple bg-white">
        
        {/* STEP 1: Hard Constraints */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="text-lg font-semibold text-ink-primary flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-brand-600" />
                Step 1: Non-Negotiable Hard Constraints
              </h2>
              <p className="text-xs text-ink-secondary mt-0.5">
                Listings that violate any of these rules will be rejected before scoring.
              </p>
            </div>

            <div className="space-y-5 pt-2">
              {/* Budget Ceiling */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-medium text-ink-primary">Absolute Maximum Rent (₹/month)</label>
                  <span className="text-xs font-bold text-brand-700">₹{preferences.budgetCeiling.toLocaleString('en-IN')}</span>
                </div>
                <input
                  type="range"
                  min="8000"
                  max="45000"
                  step="1000"
                  value={preferences.budgetCeiling}
                  onChange={(e) => setPreferences({ ...preferences, budgetCeiling: Number(e.target.value) })}
                  className="w-full accent-brand-600 cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-ink-tertiary mt-1">
                  <span>₹8,000</span>
                  <span>₹25,000</span>
                  <span>₹45,000+</span>
                </div>
              </div>

              {/* Diet Constraint */}
              <div>
                <label className="text-xs font-medium text-ink-primary block mb-2">Dietary Restriction in Flat</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Any / Flexible', 'Pure Veg Kitchen Only', 'Eggetarian Friendly'].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setPreferences({ ...preferences, dietaryRule: d })}
                      className={`p-3 rounded-xl border text-xs font-medium transition-all ${
                        preferences.dietaryRule === d
                          ? 'border-brand-600 bg-brand-50 text-brand-900 font-semibold'
                          : 'border-surface-200 bg-surface-50 text-ink-secondary hover:bg-surface-100'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Smoking Policy */}
              <div>
                <label className="text-xs font-medium text-ink-primary block mb-2">Smoking Rules</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Strictly Non-Smoking', 'Balcony Smoking OK', 'Smoking Allowed'].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setPreferences({ ...preferences, smokingPolicy: s })}
                      className={`p-3 rounded-xl border text-xs font-medium transition-all ${
                        preferences.smokingPolicy === s
                          ? 'border-brand-600 bg-brand-50 text-brand-900 font-semibold'
                          : 'border-surface-200 bg-surface-50 text-ink-secondary hover:bg-surface-100'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* STEP 2: Circadian & Routines */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="text-lg font-semibold text-ink-primary flex items-center gap-2">
                <Clock className="w-5 h-5 text-brand-600" />
                Step 2: Circadian Rhythm & Daily Schedules
              </h2>
              <p className="text-xs text-ink-secondary mt-0.5">
                We use continuous fuzzy membership functions to score sleep and wake synchronization.
              </p>
            </div>

            <div className="space-y-6 pt-2">
              {/* Bedtime */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs font-medium text-ink-primary flex items-center gap-1.5">
                    <Moon className="w-4 h-4 text-indigo-500" />
                    Typical Bedtime (Hour)
                  </span>
                  <span className="text-xs font-bold text-brand-700">
                    {preferences.bedtime > 12 ? `${preferences.bedtime - 12} PM` : `${preferences.bedtime} AM`}
                  </span>
                </div>
                <input
                  type="range"
                  min="21"
                  max="28"
                  value={preferences.bedtime}
                  onChange={(e) => setPreferences({ ...preferences, bedtime: Number(e.target.value) })}
                  className="w-full accent-brand-600 cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-ink-tertiary mt-1">
                  <span>9:00 PM (Early)</span>
                  <span>11:30 PM (Average)</span>
                  <span>3:00 AM+ (Night Owl)</span>
                </div>
              </div>

              {/* Wake-up time */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs font-medium text-ink-primary flex items-center gap-1.5">
                    <Sun className="w-4 h-4 text-amber-500" />
                    Typical Wake-up Time
                  </span>
                  <span className="text-xs font-bold text-brand-700">{preferences.wakeTime}:00 AM</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="11"
                  value={preferences.wakeTime}
                  onChange={(e) => setPreferences({ ...preferences, wakeTime: Number(e.target.value) })}
                  className="w-full accent-brand-600 cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-ink-tertiary mt-1">
                  <span>5:00 AM</span>
                  <span>7:30 AM</span>
                  <span>11:00 AM</span>
                </div>
              </div>

              {/* WFH Days */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs font-medium text-ink-primary flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4 text-teal-600" />
                    Work From Home Days per Week
                  </span>
                  <span className="text-xs font-bold text-brand-700">{preferences.wfhDays} Days/Week</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="7"
                  value={preferences.wfhDays}
                  onChange={(e) => setPreferences({ ...preferences, wfhDays: Number(e.target.value) })}
                  className="w-full accent-brand-600 cursor-pointer"
                />
              </div>

            </div>
          </div>
        )}

        {/* STEP 3: Social & Boundaries */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="text-lg font-semibold text-ink-primary flex items-center gap-2">
                <Users className="w-5 h-5 text-brand-600" />
                Step 3: Social Preferences & Space Boundaries
              </h2>
              <p className="text-xs text-ink-secondary mt-0.5">
                Set expectations for visitors, cleanliness standards, and personal sanctuary.
              </p>
            </div>

            <div className="space-y-5 pt-2">
              {/* Cleanliness rating */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs font-medium text-ink-primary">Cleanliness Standards (1 to 5)</span>
                  <span className="text-xs font-bold text-brand-700">{preferences.cleanliness} / 5</span>
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
                  <span>1: Relaxed / Casual</span>
                  <span>3: Regular Dusting</span>
                  <span>5: Impeccable / Daily Maid</span>
                </div>
              </div>

              {/* Noise Tolerance */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs font-medium text-ink-primary flex items-center gap-1.5">
                    <Volume2 className="w-4 h-4 text-ink-tertiary" />
                    Noise Tolerance
                  </span>
                  <span className="text-xs font-bold text-brand-700">{preferences.noiseTolerance} / 5</span>
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
                  <span>Moderate Ambient Activity</span>
                  <span>Speakers & Music Friendly</span>
                </div>
              </div>

              {/* Guest Policy */}
              <div>
                <label className="text-xs font-medium text-ink-primary block mb-2">Overnight Guests Policy</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Strictly No Overnight', 'With 24h Advance Notice', 'Anytime Welcome'].map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setPreferences({ ...preferences, overnightGuests: g })}
                      className={`p-3 rounded-xl border text-xs font-medium transition-all ${
                        preferences.overnightGuests === g
                          ? 'border-brand-600 bg-brand-50 text-brand-900 font-semibold'
                          : 'border-surface-200 bg-surface-50 text-ink-secondary hover:bg-surface-100'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* STEP 4: Custom Importance Weights */}
        {currentStep === 4 && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="text-lg font-semibold text-ink-primary flex items-center gap-2">
                <Sliders className="w-5 h-5 text-brand-600" />
                Step 4: Personal Importance Weights
              </h2>
              <p className="text-xs text-ink-secondary mt-0.5">
                Assign importance weights (1 = Minor, 5 = Critical) used in the weighted compatibility calculation.
              </p>
            </div>

            <div className="space-y-4 pt-2">
              {[
                { key: 'sleepSync', label: 'Sleep & Wake Schedule Synchronization', desc: 'Prevents late night noise vs early morning alarms.' },
                { key: 'cleanliness', label: 'Cleanliness & Kitchen Hygiene Standards', desc: 'Dishes in sink, dusting, and trash disposal.' },
                { key: 'noise', label: 'Quiet Hours & Acoustic Quietude', desc: 'Headphones usage during late work hours.' },
                { key: 'guests', label: 'Guest & Social Boundaries', desc: 'Advance notice for visitors.' },
                { key: 'wfh', label: 'Work-from-Home Desk Exclusivity', desc: 'Bandwidth and calls in living area.' },
              ].map((item) => (
                <div key={item.key} className="p-4 rounded-2xl bg-surface-50 border border-surface-200">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-semibold text-ink-primary">{item.label}</span>
                    <span className="text-xs font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-md">
                      Weight: {preferences.weights[item.key]} / 5
                    </span>
                  </div>
                  <p className="text-[11px] text-ink-secondary mb-2">{item.desc}</p>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={preferences.weights[item.key]}
                    onChange={(e) => handleWeightChange(item.key, e.target.value)}
                    className="w-full accent-brand-600 cursor-pointer"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Wizard Navigation Footer */}
        <div className="mt-8 pt-6 border-t border-surface-200 flex items-center justify-between">
          {currentStep > 1 ? (
            <Button
              variant="secondary"
              size="sm"
              icon={ArrowLeft}
              disabled={saving}
              onClick={() => setCurrentStep(currentStep - 1)}
            >
              Previous
            </Button>
          ) : (
            <div />
          )}

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
            <Button
              variant="primary"
              size="md"
              icon={saving ? Loader2 : Sparkles}
              iconPosition="right"
              disabled={saving}
              onClick={handleFinish}
            >
              {saving ? 'Saving to RoomSync...' : 'Calculate Compatibility Matches'}
            </Button>
          )}
        </div>

      </Card>

    </div>
  );
};
