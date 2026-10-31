import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  User, 
  ShieldCheck, 
  SlidersHorizontal, 
  Mail, 
  Phone, 
  Building, 
  MapPin,
  CheckCircle2,
  Clock,
  Volume2,
  AlertCircle,
  Home,
  Save,
  Loader2
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import {
  fetchUserProfile,
  updateUserProfile,
  fetchPreferences,
  resendVerificationApi,
} from '../services/api';

export const ProfilePage = () => {
  const { user: authUser, token, updateUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verificationNotice, setVerificationNotice] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    role: 'seeker',
    occupation: '',
    company: '',
    city: 'Bengaluru',
    bio: '',
    isVerified: false,
  });

  const [lifestyleSnapshot, setLifestyleSnapshot] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setLoading(true);
      try {
        const profile = await fetchUserProfile(token);
        if (isMounted && profile) {
          setFormData({
            fullName: profile.fullName || '',
            email: profile.email || '',
            phone: profile.phone || '',
            role: profile.role || 'seeker',
            occupation: profile.occupation || '',
            company: profile.company || '',
            city: profile.city || 'Bengaluru',
            bio: profile.bio || '',
            isVerified: Boolean(profile.isVerified),
          });
        }

        try {
          const pref = await fetchPreferences(token);
          if (isMounted && pref) {
            setLifestyleSnapshot(pref);
          }
        } catch (prefErr) {
          // Non-critical if user hasn't set preferences yet
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
        if (isMounted) {
          setErrorMessage('Could not load profile from server.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (token) {
      loadData();
    } else {
      setLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleSendVerification = async () => {
    if (!formData.email) return;
    try {
      setVerifying(true);
      setVerificationNotice(null);
      await resendVerificationApi(formData.email);
      setVerificationNotice({
        type: 'success',
        message: `Verification link dispatched to ${formData.email}. Please check your inbox.`,
      });
    } catch (err) {
      setVerificationNotice({
        type: 'error',
        message: err.message || 'Could not dispatch verification email.',
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    // Normalize phone number: extract digits
    const cleanedPhone = (formData.phone || '').replace(/\D/g, '');
    let finalPhone = cleanedPhone;
    if (cleanedPhone.length === 12 && cleanedPhone.startsWith('91')) {
      finalPhone = cleanedPhone.substring(2);
    }

    if (finalPhone && !/^[0-9]{10}$/.test(finalPhone)) {
      setErrorMessage('Please provide a valid 10-digit mobile number.');
      setSaving(false);
      return;
    }

    try {
      const payload = {
        fullName: formData.fullName.trim(),
        phone: finalPhone || formData.phone,
        occupation: formData.occupation.trim(),
        company: formData.company.trim(),
        city: formData.city.trim(),
        bio: formData.bio.trim(),
      };

      const updated = await updateUserProfile(payload, token);
      updateUser(updated);
      setSuccessMessage('Profile information updated successfully.');
      setFormData((prev) => ({
        ...prev,
        ...updated,
      }));
    } catch (err) {
      console.error('Failed to update profile:', err);
      setErrorMessage(err.message || 'Failed to save profile updates.');
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600 mx-auto mb-2" />
        <p className="text-xs text-ink-secondary">Loading profile details...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-ink-primary">Profile & Account</h1>
          <p className="text-xs text-ink-secondary mt-1">Manage your identity, landlord contact details, and lifestyle parameters.</p>
        </div>
        <div className="flex items-center gap-3">
          {formData.role === 'owner' && (
            <Link to="/owner/dashboard">
              <Button variant="secondary" size="sm" icon={Home}>
                Owner Dashboard
              </Button>
            </Link>
          )}
          <Link to="/onboarding">
            <Button variant="primary" size="sm" icon={SlidersHorizontal}>
              Update 22 Factors
            </Button>
          </Link>
        </div>
      </div>

      {successMessage && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-600 hover:text-emerald-800 text-xs underline">
            Dismiss
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-600 hover:text-rose-800 text-xs underline">
            Dismiss
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Column: Identity & Status */}
        <div className="space-y-6">
          <Card className="p-6 bg-white text-center">
            <div className="w-20 h-20 rounded-full bg-brand-100 text-brand-800 text-2xl font-bold flex items-center justify-center mx-auto mb-4 border-2 border-brand-200">
              {getInitials(formData.fullName)}
            </div>
            <h2 className="text-lg font-semibold text-ink-primary">{formData.fullName || 'User'}</h2>
            <p className="text-xs text-ink-secondary">{formData.occupation || formData.company || 'RoomSync Member'}</p>

            <div className="mt-3 flex flex-wrap justify-center gap-2 items-center">
              <Badge variant={formData.role === 'owner' ? 'teal' : 'neutral'} size="sm">
                {formData.role === 'owner' ? 'Property Owner' : 'Room Seeker'}
              </Badge>
              {formData.isVerified ? (
                <Badge variant="teal" size="sm" icon={ShieldCheck}>
                  Verified Member
                </Badge>
              ) : (
                <button
                  type="button"
                  onClick={handleSendVerification}
                  disabled={verifying}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200/80 hover:bg-amber-100 transition-colors"
                >
                  <Mail className="w-3 h-3 text-amber-600" />
                  <span>{verifying ? 'Sending...' : 'Unverified · Verify Email'}</span>
                </button>
              )}
            </div>

            {verificationNotice && (
              <div
                className={`mt-3 p-2.5 rounded-xl text-[11px] text-left flex items-start gap-1.5 ${
                  verificationNotice.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}
              >
                {verificationNotice.type === 'success' ? (
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600 mt-0.5" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600 mt-0.5" />
                )}
                <span>{verificationNotice.message}</span>
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-surface-200 space-y-2 text-xs text-left">
              <div className="flex items-center gap-2 text-ink-secondary">
                <Mail className="w-4 h-4 text-ink-tertiary shrink-0" />
                <span className="truncate">{formData.email}</span>
              </div>
              <div className="flex items-center gap-2 text-ink-secondary">
                <Phone className="w-4 h-4 text-ink-tertiary shrink-0" />
                <span>{formData.phone ? `+91 ${formData.phone}` : 'No phone set'}</span>
              </div>
              <div className="flex items-center gap-2 text-ink-secondary">
                <Building className="w-4 h-4 text-ink-tertiary shrink-0" />
                <span>{formData.city || 'Bangalore'}, India</span>
              </div>
            </div>
          </Card>

          {/* Verification Badge Info */}
          <Card className="p-5 bg-surface-100 border border-black/[0.05] text-xs text-ink-secondary space-y-2">
            <span className="font-semibold text-ink-primary block">Trust & Verification Policy</span>
            <p className="leading-relaxed">
              {formData.role === 'owner' 
                ? 'Your verified phone number is displayed on your room listings so prospective tenants and flatmates can reach you directly.'
                : 'Verified seekers receive 3x faster owner responses and get direct access to landlord call buttons.'}
            </p>
          </Card>
        </div>

        {/* Right Column: Profile Form & Lifestyle Snapshot */}
        <div className="md:col-span-2 space-y-8">
          
          {/* Account & Contact Settings Form */}
          <Card className="p-6 sm:p-8 bg-white shadow-subtle">
            <h3 className="text-base font-semibold text-ink-primary mb-1">Contact & Profile Information</h3>
            <p className="text-xs text-ink-secondary mb-6">
              Keep your contact details up to date. This information is shared with verified participants when you enquire or list rooms.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-ink-primary mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full bg-surface-50 border border-surface-200 rounded-xl px-3.5 py-2 text-sm text-ink-primary focus:outline-none focus:border-brand-600 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-ink-primary mb-1">Email Address</label>
                  <input
                    type="email"
                    disabled
                    value={formData.email}
                    className="w-full bg-surface-100 border border-surface-200 rounded-xl px-3.5 py-2 text-sm text-ink-tertiary cursor-not-allowed"
                    title="Email address is tied to your account login"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-ink-primary mb-1">
                    Phone Number (10 digits)
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="9876543210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-surface-50 border border-surface-200 rounded-xl px-3.5 py-2 text-sm text-ink-primary focus:outline-none focus:border-brand-600 focus:bg-white transition-all"
                  />
                  <p className="text-[11px] text-ink-tertiary mt-1">Used for verified landlord calls and visit coordination.</p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-ink-primary mb-1">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full bg-surface-50 border border-surface-200 rounded-xl px-3.5 py-2 text-sm text-ink-primary focus:outline-none focus:border-brand-600 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-ink-primary mb-1">Occupation</label>
                  <input
                    type="text"
                    placeholder="e.g. Software Engineer, Student"
                    value={formData.occupation}
                    onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                    className="w-full bg-surface-50 border border-surface-200 rounded-xl px-3.5 py-2 text-sm text-ink-primary focus:outline-none focus:border-brand-600 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-ink-primary mb-1">Company / University</label>
                  <input
                    type="text"
                    placeholder="e.g. Tech Corp / IISc"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full bg-surface-50 border border-surface-200 rounded-xl px-3.5 py-2 text-sm text-ink-primary focus:outline-none focus:border-brand-600 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-ink-primary mb-1">Bio / About Me</label>
                <textarea
                  rows={3}
                  placeholder="Share a short bio, your schedule, hobbies, or landlord guidelines..."
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full bg-surface-50 border border-surface-200 rounded-xl px-3.5 py-2 text-sm text-ink-primary focus:outline-none focus:border-brand-600 focus:bg-white transition-all resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  icon={Save}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Profile Updates'}
                </Button>
              </div>
            </form>
          </Card>

          {/* Current 22-Factor Living Profile Summary */}
          <Card className="p-6 sm:p-8 bg-white shadow-subtle">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-ink-primary">Active Lifestyle Snapshot</h3>
                <p className="text-xs text-ink-secondary">Evaluated by RoomSync's 22-factor compatibility algorithm.</p>
              </div>
              <Link to="/onboarding">
                <span className="text-xs text-brand-700 font-semibold hover:underline">Edit Preferences</span>
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-surface-50 border border-surface-200">
                <span className="text-ink-tertiary block text-[11px]">Bedtime</span>
                <span className="font-semibold text-ink-primary">
                  {lifestyleSnapshot?.lifestyle?.sleepSchedule ? `${lifestyleSnapshot.lifestyle.sleepSchedule}:00 hrs` : '11:00 PM'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-surface-50 border border-surface-200">
                <span className="text-ink-tertiary block text-[11px]">Wake-up</span>
                <span className="font-semibold text-ink-primary">
                  {lifestyleSnapshot?.lifestyle?.wakeSchedule ? `${lifestyleSnapshot.lifestyle.wakeSchedule}:00 hrs` : '7:00 AM'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-surface-50 border border-surface-200">
                <span className="text-ink-tertiary block text-[11px]">Food Habit</span>
                <span className="font-semibold text-ink-primary capitalize">
                  {lifestyleSnapshot?.lifestyle?.foodPreference || 'Vegetarian / Any'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-surface-50 border border-surface-200">
                <span className="text-ink-tertiary block text-[11px]">Smoking</span>
                <span className="font-semibold text-ink-primary capitalize">
                  {lifestyleSnapshot?.lifestyle?.smoking || 'Non-smoker'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-surface-50 border border-surface-200">
                <span className="text-ink-tertiary block text-[11px]">Cleanliness</span>
                <span className="font-semibold text-ink-primary">
                  {lifestyleSnapshot?.lifestyle?.cleanliness ? `${lifestyleSnapshot.lifestyle.cleanliness} / 5` : '4 / 5'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-surface-50 border border-surface-200">
                <span className="text-ink-tertiary block text-[11px]">WFH Frequency</span>
                <span className="font-semibold text-ink-primary">
                  {lifestyleSnapshot?.lifestyle?.wfhFrequency !== undefined ? `${lifestyleSnapshot.lifestyle.wfhFrequency} Days / Wk` : '3 Days / Wk'}
                </span>
              </div>
            </div>
          </Card>

        </div>

      </div>

    </div>
  );
};
