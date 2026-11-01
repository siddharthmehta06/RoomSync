import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  ShieldAlert,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  UserCheck,
  Building,
  Lock,
  ArrowRight,
  Info,
  Loader2,
  RefreshCw,
  PlusCircle,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import {
  fetchMyVerificationStatusApi,
  submitOwnerVerificationApi,
  becomeOwnerApi,
} from '../services/api';

export const OwnerVerificationPage = () => {
  const { user, token, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [verification, setVerification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Form Fields
  const [formData, setFormData] = useState({
    legalFullName: user?.fullName || '',
    phone: user?.phone || '',
    currentAddress: '',
    idDocumentType: 'Aadhaar',
    idNumber: '',
    explicitConsent: false,
  });

  const loadVerificationStatus = async () => {
    try {
      setLoading(true);
      const data = await fetchMyVerificationStatusApi(token);
      setVerification(data);
      if (data?.verification) {
        setFormData((prev) => ({
          ...prev,
          legalFullName: data.verification.legalFullName || prev.legalFullName,
          currentAddress: data.verification.currentAddress || '',
          idDocumentType: data.verification.idDocumentType || 'Aadhaar',
        }));
      }
    } catch (err) {
      console.warn('Failed to load verification status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadVerificationStatus();
    } else {
      setLoading(false);
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!formData.legalFullName.trim()) {
      setErrorMessage('Full legal name is required.');
      return;
    }

    if (!formData.currentAddress.trim()) {
      setErrorMessage('Current residential address is required.');
      return;
    }

    if (!formData.idNumber.trim()) {
      setErrorMessage('Government identity number is required.');
      return;
    }

    if (!formData.explicitConsent) {
      setErrorMessage('You must review and check the explicit consent declaration to proceed.');
      return;
    }

    try {
      setSubmitting(true);

      // If user is currently a seeker, initiate role transition
      if (user?.role === 'seeker') {
        await becomeOwnerApi(token);
      }

      const result = await submitOwnerVerificationApi(
        {
          legalFullName: formData.legalFullName.trim(),
          phone: formData.phone.trim(),
          currentAddress: formData.currentAddress.trim(),
          idDocumentType: formData.idDocumentType,
          idNumber: formData.idNumber.trim(),
          explicitConsent: true,
        },
        token
      );

      setSuccessMessage('Identity verification submitted successfully! It is now under authorized review.');
      await loadVerificationStatus();
      if (refreshUser) refreshUser();
    } catch (err) {
      setErrorMessage(err.message || 'Failed to submit verification.');
    } finally {
      setSubmitting(false);
    }
  };

  const status = verification?.status || user?.ownerVerificationStatus || 'Not Started';

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 md:py-16">
      
      {/* Header */}
      <div className="text-center mb-10">
        <div className="w-14 h-14 rounded-2xl bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-700 mx-auto mb-4 shadow-sm">
          <ShieldCheck className="w-7 h-7" />
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-ink-primary">
          Room Owner Identity Verification
        </h1>
        <p className="text-xs text-ink-secondary max-w-lg mx-auto mt-2 leading-relaxed">
          To maintain tenant safety, reduce rental scams, and ensure trustworthy listings, all property owners must complete identity verification before publishing room listings.
        </p>
      </div>

      {/* Verification Status Banner */}
      <div className="mb-8">
        {status === 'Verified' && (
          <div className="p-5 rounded-3xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-start gap-4 shadow-2xs animate-fadeIn">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold text-sm block">Identity Verified</span>
              <p className="text-xs text-emerald-800 leading-relaxed">
                Your government identity has been verified. You have full property owner privileges to create listings and accept tenant booking requests.
              </p>
              <div className="pt-3">
                <Button
                  variant="primary"
                  size="sm"
                  icon={PlusCircle}
                  onClick={() => navigate('/owner/listings/new')}
                >
                  Create New Room Listing
                </Button>
              </div>
            </div>
          </div>
        )}

        {status === 'Pending' && (
          <div className="p-5 rounded-3xl bg-amber-50 border border-amber-200 text-amber-950 flex items-start gap-4 shadow-2xs animate-fadeIn">
            <Clock className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold text-sm block">Verification Pending Review</span>
              <p className="text-xs text-amber-800 leading-relaxed">
                Your identity verification details have been received and are awaiting verification. Room publishing capabilities will be unlocked once approved.
              </p>
              {verification?.verification?.maskedIdNumber && (
                <p className="text-[11px] text-amber-900 font-mono mt-1">
                  Document Reference: {verification.verification.idDocumentType} ({verification.verification.maskedIdNumber})
                </p>
              )}
            </div>
          </div>
        )}

        {status === 'Rejected' && (
          <div className="p-5 rounded-3xl bg-rose-50 border border-rose-200 text-rose-950 flex items-start gap-4 shadow-2xs animate-fadeIn">
            <ShieldAlert className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold text-sm block">Verification Rejected</span>
              <p className="text-xs text-rose-800 leading-relaxed">
                {verification?.verification?.reviewerNotes ||
                  'Your submitted identification details could not be validated. Please check your legal name and document numbers and resubmit below.'}
              </p>
            </div>
          </div>
        )}

        {status === 'Not Started' && (
          <div className="p-5 rounded-3xl bg-surface-100 border border-black/[0.06] text-ink-primary flex items-start gap-4 shadow-2xs">
            <Info className="w-6 h-6 text-brand-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold text-sm block">Verification Not Started</span>
              <p className="text-xs text-ink-secondary leading-relaxed">
                Complete the brief form below with your official government identity document. Verification takes only a few minutes.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Form (Active when Not Started, Rejected, or Requires Resubmission) */}
      {(status === 'Not Started' || status === 'Rejected' || status === 'Requires Resubmission') && (
        <Card className="p-6 sm:p-8 bg-white border border-black/[0.06] shadow-apple rounded-3xl">
          
          <div className="border-b border-surface-100 pb-4 mb-6">
            <h2 className="text-base font-semibold text-ink-primary">
              Personal & Government Identity Details
            </h2>
            <p className="text-xs text-ink-secondary mt-0.5">
              Please enter details matching your government-issued ID card.
            </p>
          </div>

          {errorMessage && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2.5 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-ink-primary mb-1.5">
                Full Legal Name (as per ID document) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.legalFullName}
                onChange={(e) => setFormData({ ...formData, legalFullName: e.target.value })}
                placeholder="e.g. Vikramaditya Singhania"
                className="w-full px-3.5 py-2.5 rounded-xl border border-black/[0.1] text-xs text-ink-primary focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-ink-primary mb-1.5">
                  Verified Contact Phone <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="10-digit mobile number"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-black/[0.1] text-xs text-ink-primary focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-ink-primary mb-1.5">
                  ID Document Type <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.idDocumentType}
                  onChange={(e) => setFormData({ ...formData, idDocumentType: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-black/[0.1] text-xs text-ink-primary focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 transition-all bg-white"
                >
                  <option value="Aadhaar">Aadhaar Card (12-digit)</option>
                  <option value="Passport">Indian Passport</option>
                  <option value="Voter ID">Voter ID (EPIC)</option>
                  <option value="Driving License">Driving License</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-primary mb-1.5">
                Government ID Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.idNumber}
                onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                placeholder={
                  formData.idDocumentType === 'Aadhaar'
                    ? '12-digit Aadhaar number (Stored securely masked as XXXX-XXXX-1234)'
                    : 'Official document alphanumeric ID'
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-black/[0.1] text-xs text-ink-primary font-mono focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 transition-all"
              />
              <p className="text-[11px] text-ink-tertiary mt-1 flex items-center gap-1">
                <Lock className="w-3 h-3" />
                Data Privacy Guarantee: Raw identity numbers are never exposed in user APIs. The system displays only masked tokens.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-primary mb-1.5">
                Current Residential Address <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={formData.currentAddress}
                onChange={(e) => setFormData({ ...formData, currentAddress: e.target.value })}
                placeholder="Complete current address with landmark and PIN code"
                className="w-full px-3.5 py-2.5 rounded-xl border border-black/[0.1] text-xs text-ink-primary focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 transition-all"
              />
            </div>

            {/* Explicit Consent Declaration */}
            <div className="p-4 bg-brand-50/50 rounded-2xl border border-brand-200/60 space-y-2">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={formData.explicitConsent}
                  onChange={(e) => setFormData({ ...formData, explicitConsent: e.target.checked })}
                  className="mt-0.5 rounded text-brand-600 focus:ring-brand-500 w-4 h-4"
                />
                <span className="text-xs text-ink-primary leading-relaxed">
                  I solemnly declare that the identification details provided above are true and accurate. I explicitly consent to RoomSync verifying my identity against government records for the sole purpose of validating rental listings and mitigating residential fraud.
                </span>
              </label>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full justify-center"
              disabled={submitting}
              icon={submitting ? Loader2 : ArrowRight}
            >
              {submitting ? 'Submitting for Review...' : 'Submit Identity Verification'}
            </Button>
          </form>
        </Card>
      )}

      {/* Safety Notice & Platform Disclaimer */}
      <div className="mt-8 p-4 rounded-2xl bg-surface-50 border border-black/[0.04] text-[11px] text-ink-secondary leading-relaxed">
        <strong className="text-ink-primary block mb-0.5">Platform Safety Disclaimer:</strong>
        RoomSync identity verification is an active risk-mitigation measure designed to reduce impersonation and fake property listings. Verification does not constitute a guarantee of future tenant or landlord conduct. Always exercise due diligence before entering financial transactions.
      </div>

    </div>
  );
};

export default OwnerVerificationPage;

