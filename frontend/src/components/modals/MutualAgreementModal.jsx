import React, { useState, useEffect } from 'react';
import { 
  X, 
  FileText, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  Download, 
  AlertCircle, 
  Loader2, 
  User, 
  Home, 
  Calendar,
  Lock,
  Printer
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useAuth } from '../../context/AuthContext';
import { 
  fetchAgreementByIdApi, 
  fetchAgreementByBookingApi, 
  signAgreementApi, 
  downloadAgreementPdfApi 
} from '../../services/api';

export const MutualAgreementModal = ({ 
  isOpen, 
  onClose, 
  agreementId, 
  bookingId, 
  initialAgreement, 
  onAgreementUpdated 
}) => {
  const { user } = useAuth();
  const [agreement, setAgreement] = useState(initialAgreement || null);
  const [loading, setLoading] = useState(!initialAgreement);
  const [signing, setSigning] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [hasAgreedCheckbox, setHasAgreedCheckbox] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Fetch agreement if ID provided
  useEffect(() => {
    if (!isOpen) {
      setHasAgreedCheckbox(false);
      setErrorMessage(null);
      setSuccessMessage(null);
      return;
    }

    if (initialAgreement) {
      setAgreement(initialAgreement);
      setLoading(false);
      return;
    }

    const fetchAgreement = async () => {
      setLoading(true);
      setErrorMessage(null);
      try {
        let data;
        if (agreementId) {
          data = await fetchAgreementByIdApi(agreementId);
        } else if (bookingId) {
          data = await fetchAgreementByBookingApi(bookingId);
        }
        setAgreement(data);
      } catch (err) {
        setErrorMessage(err.message || 'Could not load agreement details.');
      } finally {
        setLoading(false);
      }
    };

    fetchAgreement();
  }, [isOpen, agreementId, bookingId, initialAgreement]);

  if (!isOpen) return null;

  const isSeeker = user?.id === agreement?.seeker?._id || user?.id === agreement?.seeker?.id;
  const isOwner = user?.id === agreement?.owner?._id || user?.id === agreement?.owner?.id;

  const mySignatureCompleted = isSeeker ? agreement?.seekerAccepted : isOwner ? agreement?.ownerAccepted : false;
  const isFullyCompleted = agreement?.status === 'completed';

  const handleSignAgreement = async () => {
    if (!hasAgreedCheckbox) {
      setErrorMessage('Please confirm that you have read and accepted the agreement terms by checking the box.');
      return;
    }

    setSigning(true);
    setErrorMessage(null);
    try {
      const updated = await signAgreementApi(agreement._id || agreement.id);
      setAgreement(updated);
      setSuccessMessage('You have successfully signed the mutual agreement!');
      if (onAgreementUpdated) {
        onAgreementUpdated(updated);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to sign the agreement. Please try again.');
    } finally {
      setSigning(false);
    }
  };

  const handleDownloadPDF = async () => {
    setDownloading(true);
    setErrorMessage(null);
    try {
      await downloadAgreementPdfApi(agreement._id || agreement.id, agreement.agreementNumber);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to download agreement PDF.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        className="relative bg-white w-full max-w-2xl rounded-3xl shadow-apple border border-black/[0.08] overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="agreement-modal-title"
      >
        {/* Top Bar */}
        <div className="p-6 pb-4 border-b border-surface-200 flex items-center justify-between bg-surface-50">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-700 bg-brand-50 px-2 py-0.5 rounded-md border border-brand-200/50">
                Official Tenancy Record
              </span>
              {agreement?.agreementNumber && (
                <span className="text-xs font-mono font-semibold text-ink-primary">
                  {agreement.agreementNumber}
                </span>
              )}
            </div>
            <h2 id="agreement-modal-title" className="text-lg font-bold text-ink-primary">
              Mutual Accommodation Agreement
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {isFullyCompleted && (
              <Button
                variant="secondary"
                size="sm"
                icon={Download}
                onClick={handleDownloadPDF}
                disabled={downloading}
              >
                {downloading ? 'Downloading...' : 'Download PDF'}
              </Button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-surface-200 text-ink-tertiary hover:text-ink-primary transition-colors"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-6">
          {loading ? (
            <div className="py-16 text-center">
              <Loader2 className="w-8 h-8 text-brand-600 animate-spin mx-auto mb-2" />
              <p className="text-xs text-ink-secondary">Loading mutual agreement terms...</p>
            </div>
          ) : !agreement ? (
            <div className="py-12 text-center text-xs text-ink-secondary">
              <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
              <p>{errorMessage || 'Agreement details could not be found.'}</p>
            </div>
          ) : (
            <>
              {/* Feedback Notifications */}
              {errorMessage && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">{errorMessage}</p>
                </div>
              )}

              {successMessage && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">{successMessage}</p>
                </div>
              )}

              {/* Status Header Banner */}
              <div className={`p-4 rounded-2xl border text-xs flex items-center justify-between ${
                isFullyCompleted 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                  : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}>
                <div className="flex items-center gap-2.5">
                  {isFullyCompleted ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  ) : (
                    <Clock className="w-5 h-5 text-amber-600 shrink-0" />
                  )}
                  <div>
                    <span className="font-semibold block">
                      {isFullyCompleted 
                        ? 'Agreement Fully Executed' 
                        : 'Awaiting Digital Signatures'}
                    </span>
                    <span className="text-[11px] opacity-90">
                      {isFullyCompleted 
                        ? 'Both Seeker and Owner have signed. Official PDF is ready.' 
                        : `${agreement.seekerAccepted ? '1 of 2 signatures' : agreement.ownerAccepted ? '1 of 2 signatures' : '0 of 2 signatures'} completed.`}
                    </span>
                  </div>
                </div>

                <Badge variant={isFullyCompleted ? 'emerald' : 'amber'} size="sm">
                  {agreement.status.toUpperCase()}
                </Badge>
              </div>

              {/* Parties Box */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-surface-50 p-4 rounded-2xl border border-surface-200">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-ink-tertiary tracking-wider block">
                    Property Owner / Lister
                  </span>
                  <div className="font-semibold text-ink-primary flex items-center gap-1.5">
                    <span>{agreement.owner?.fullName || 'Verified Owner'}</span>
                    <ShieldCheck className="w-3.5 h-3.5 text-brand-600" title="Verified Owner" />
                  </div>
                  <p className="text-ink-secondary">{agreement.owner?.email}</p>
                  {agreement.owner?.phone && (
                    <p className="text-ink-tertiary">Phone: {agreement.owner.phone}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-ink-tertiary tracking-wider block">
                    Incoming Room Seeker
                  </span>
                  <div className="font-semibold text-ink-primary">
                    {agreement.seeker?.fullName || 'Room Seeker'}
                  </div>
                  <p className="text-ink-secondary">{agreement.seeker?.email}</p>
                  {agreement.seeker?.phone && (
                    <p className="text-ink-tertiary">Phone: {agreement.seeker.phone}</p>
                  )}
                </div>
              </div>

              {/* Tenancy & Financial Terms */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-ink-primary">
                  Financial Terms & Tenancy Conditions
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-surface-50 border border-surface-200">
                    <span className="text-ink-tertiary block text-[10px]">Monthly Rent</span>
                    <span className="font-bold text-ink-primary text-sm mt-0.5 block">
                      ₹{(agreement.financialTerms?.monthlyRent || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-surface-50 border border-surface-200">
                    <span className="text-ink-tertiary block text-[10px]">Security Deposit</span>
                    <span className="font-bold text-ink-primary text-sm mt-0.5 block">
                      ₹{(agreement.financialTerms?.securityDeposit || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-surface-50 border border-surface-200">
                    <span className="text-ink-tertiary block text-[10px]">Move-in Date</span>
                    <span className="font-bold text-ink-primary text-sm mt-0.5 block">
                      {agreement.financialTerms?.moveInDate 
                        ? new Date(agreement.financialTerms.moveInDate).toLocaleDateString()
                        : 'Immediate'}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-surface-50 border border-surface-200">
                    <span className="text-ink-tertiary block text-[10px]">Duration</span>
                    <span className="font-bold text-ink-primary text-sm mt-0.5 block">
                      {agreement.financialTerms?.stayDurationMonths || 6} Months
                    </span>
                  </div>
                </div>
              </div>

              {/* House Rules & Agreed Living Conditions */}
              {agreement.houseRules && agreement.houseRules.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-ink-primary">
                    22-Factor Living Concordat & House Rules
                  </h3>
                  <div className="p-3.5 rounded-2xl bg-surface-50 border border-surface-200 text-xs text-ink-secondary space-y-1.5">
                    {agreement.houseRules.map((rule, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-600 mt-1.5 shrink-0" />
                        <span>{rule}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Digital Signatures Audit Box */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-ink-primary">
                  Independent Digital Signatures
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  {/* Seeker Signature */}
                  <div className={`p-4 rounded-2xl border ${
                    agreement.seekerAccepted 
                      ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950' 
                      : 'bg-surface-50 border-surface-200 text-ink-secondary'
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      {agreement.seekerAccepted ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Clock className="w-4 h-4 text-amber-500" />
                      )}
                      <span className="font-semibold text-xs">Seeker Digital Acceptance</span>
                    </div>
                    {agreement.seekerAccepted ? (
                      <div className="space-y-0.5 text-[11px] text-emerald-900 mt-2">
                        <p>Accepted by: {agreement.seeker?.fullName || 'Seeker'}</p>
                        <p>Timestamp: {new Date(agreement.seekerAcceptedAt).toLocaleString()}</p>
                        {agreement.seekerIp && <p className="font-mono text-[10px] text-emerald-800">IP: {agreement.seekerIp}</p>}
                      </div>
                    ) : (
                      <p className="text-[11px] text-ink-tertiary mt-2">
                        Pending signature by incoming room seeker.
                      </p>
                    )}
                  </div>

                  {/* Owner Signature */}
                  <div className={`p-4 rounded-2xl border ${
                    agreement.ownerAccepted 
                      ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950' 
                      : 'bg-surface-50 border-surface-200 text-ink-secondary'
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      {agreement.ownerAccepted ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Clock className="w-4 h-4 text-amber-500" />
                      )}
                      <span className="font-semibold text-xs">Owner Digital Acceptance</span>
                    </div>
                    {agreement.ownerAccepted ? (
                      <div className="space-y-0.5 text-[11px] text-emerald-900 mt-2">
                        <p>Accepted by: {agreement.owner?.fullName || 'Owner'}</p>
                        <p>Timestamp: {new Date(agreement.ownerAcceptedAt).toLocaleString()}</p>
                        {agreement.ownerIp && <p className="font-mono text-[10px] text-emerald-800">IP: {agreement.ownerIp}</p>}
                      </div>
                    ) : (
                      <p className="text-[11px] text-ink-tertiary mt-2">
                        Pending signature by property owner.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Statutory Legal Disclaimer Notice */}
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-[11px] text-amber-950 space-y-1 leading-relaxed">
                <span className="font-bold block uppercase tracking-wider text-[10px] text-amber-800">
                  Statutory Legal Notice
                </span>
                <p>
                  {agreement.legalDisclaimer || 
                    'This mutual agreement is generated through the RoomSync platform as an understanding between the parties. It does not replace a registered tenancy agreement required by applicable local tenancy laws. RoomSync is a technology platform and not a party to this agreement.'
                  }
                </p>
              </div>

              {/* Signature Action Section for Current User */}
              {!mySignatureCompleted && (isSeeker || isOwner) && (
                <div className="p-5 rounded-2xl bg-surface-50 border border-brand-200 space-y-4">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="agreement-checkbox"
                      checked={hasAgreedCheckbox}
                      onChange={(e) => setHasAgreedCheckbox(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded-sm border-surface-300 text-brand-600 focus:ring-brand-500"
                    />
                    <label htmlFor="agreement-checkbox" className="text-xs text-ink-primary leading-relaxed cursor-pointer select-none">
                      <strong>I have carefully reviewed and accept this Mutual Agreement.</strong> I acknowledge the specified rent, deposit, living conditions, and house rules. I understand this agreement serves as mutual operational assent and does not replace statutory tenancy registration.
                    </label>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onClose}
                      disabled={signing}
                    >
                      Close Preview
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleSignAgreement}
                      disabled={!hasAgreedCheckbox || signing}
                    >
                      {signing ? (
                        <span className="flex items-center gap-1.5">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Recording Signature...
                        </span>
                      ) : (
                        'Sign & Accept Agreement'
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Fully Signed Download Section */}
              {isFullyCompleted && (
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-surface-200">
                  <span className="text-xs text-emerald-800 font-medium flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Agreement executed by both parties
                  </span>
                  <Button
                    variant="primary"
                    size="md"
                    icon={Download}
                    onClick={handleDownloadPDF}
                    disabled={downloading}
                  >
                    {downloading ? 'Preparing PDF...' : 'Download Official Agreement PDF'}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

