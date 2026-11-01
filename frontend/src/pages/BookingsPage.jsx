import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { 
  FileText, 
  ShieldCheck, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  XCircle, 
  ArrowRight, 
  RefreshCw, 
  Home, 
  Calendar, 
  MapPin, 
  ExternalLink,
  FileCheck,
  Loader2,
  User
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useAuth } from '../context/AuthContext';
import { 
  fetchMyBookings, 
  cancelBookingApi, 
  fetchMyVisitsApi,
  downloadAgreementPdfApi
} from '../services/api';
import { MutualAgreementModal } from '../components/modals/MutualAgreementModal';

export const BookingsPage = () => {
  const [searchParams] = useSearchParams();
  const highlightBookingId = searchParams.get('bookingId');
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [myBookings, setMyBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [myVisits, setMyVisits] = useState([]);
  const [loadingVisits, setLoadingVisits] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [noticeMessage, setNoticeMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // Agreement Modal state
  const [selectedAgreementId, setSelectedAgreementId] = useState(null);
  const [selectedBookingId, setSelectedBookingId] = useState(null);
  const [isAgreementModalOpen, setIsAgreementModalOpen] = useState(false);
  const [downloadingAgreementId, setDownloadingAgreementId] = useState(null);

  // Load user's bookings and visits
  const loadData = () => {
    if (!isAuthenticated) {
      setLoadingBookings(false);
      setLoadingVisits(false);
      return;
    }

    setLoadingBookings(true);
    fetchMyBookings()
      .then((data) => {
        setMyBookings(data || []);
        setLoadingBookings(false);
      })
      .catch((err) => {
        console.warn('Could not fetch bookings:', err.message);
        setLoadingBookings(false);
      });

    setLoadingVisits(true);
    fetchMyVisitsApi('seeker')
      .then((data) => {
        setMyVisits(data || []);
        setLoadingVisits(false);
      })
      .catch((err) => {
        console.warn('Could not fetch visits:', err.message);
        setLoadingVisits(false);
      });
  };

  useEffect(() => {
    loadData();
  }, [isAuthenticated]);

  // Handle Cancellation
  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking request? The room availability hold will be released.')) {
      return;
    }

    setCancellingId(bookingId);
    setErrorMessage(null);
    setNoticeMessage(null);
    try {
      await cancelBookingApi(bookingId);
      setNoticeMessage('Your booking request has been cancelled.');
      loadData();
    } catch (err) {
      setErrorMessage(`Could not cancel booking request: ${err.message}`);
    } finally {
      setCancellingId(null);
    }
  };

  const handleDownloadPDF = async (agreementId, agreementNumber) => {
    setDownloadingAgreementId(agreementId);
    try {
      await downloadAgreementPdfApi(agreementId, agreementNumber);
    } catch (err) {
      alert(`Could not download agreement PDF: ${err.message}`);
    } finally {
      setDownloadingAgreementId(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-brand-50 border border-brand-200/60 text-brand-800 text-xs font-medium mb-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-brand-600" />
            <span>Digital Tenancy Protocol</span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-ink-primary">
            Bookings & Mutual Agreements
          </h1>
          <p className="text-xs text-ink-secondary mt-1">
            Track your tenancy proposals, review and sign mutual digital agreements, and coordinate walkthroughs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isAuthenticated && (
            <Button variant="ghost" size="sm" icon={RefreshCw} onClick={loadData}>
              Refresh
            </Button>
          )}
          <Link to="/explore">
            <Button variant="secondary" size="sm" icon={Home}>
              Explore Rooms
            </Button>
          </Link>
        </div>
      </div>

      {/* Notifications */}
      {noticeMessage && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between shadow-subtle animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{noticeMessage}</span>
          </div>
          <button 
            onClick={() => setNoticeMessage(null)}
            className="text-xs text-emerald-700 hover:text-emerald-900 underline ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center justify-between shadow-subtle animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button 
            onClick={() => setErrorMessage(null)}
            className="text-xs text-rose-700 hover:text-rose-900 underline ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Bookings & Agreements */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-ink-primary flex items-center gap-2">
              <FileText className="w-5 h-5 text-brand-600" />
              Tenancy Booking Requests & Contracts
            </h2>
            <span className="text-xs text-ink-secondary">
              {myBookings.length} total
            </span>
          </div>

          {loadingBookings ? (
            <div className="py-12 text-center bg-white rounded-3xl border border-surface-200">
              <Loader2 className="w-6 h-6 text-brand-600 animate-spin mx-auto mb-2" />
              <p className="text-xs text-ink-secondary">Loading your tenancy records...</p>
            </div>
          ) : myBookings.length === 0 ? (
            <Card className="p-8 text-center bg-white border border-surface-200 rounded-3xl space-y-3">
              <FileText className="w-10 h-10 text-ink-tertiary mx-auto" />
              <div className="space-y-1">
                <h3 className="font-semibold text-sm text-ink-primary">No booking requests submitted yet</h3>
                <p className="text-xs text-ink-secondary max-w-sm mx-auto">
                  When you find a room that matches your 22 lifestyle preferences, click &quot;Send Booking Request&quot; on the room page.
                </p>
              </div>
              <div className="pt-2">
                <Link to="/explore">
                  <Button variant="primary" size="sm" icon={ArrowRight}>
                    Explore Compatible Rooms
                  </Button>
                </Link>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {myBookings.map((b) => {
                const bookingId = b.id || b._id;
                const room = b.room || {};
                const owner = b.owner || {};
                const isAccepted = b.status === 'accepted';
                const isPending = b.status === 'pending';
                const isRejected = b.status === 'rejected';
                const agreement = b.agreement;
                const agreementId = agreement?._id || agreement?.id || (typeof agreement === 'string' ? agreement : null);

                return (
                  <Card key={bookingId} className="p-5 sm:p-6 bg-white border border-surface-200 rounded-3xl space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-base text-ink-primary">
                            {room.title || 'Room Listing'}
                          </span>
                          <Badge 
                            variant={isAccepted ? 'emerald' : isPending ? 'amber' : 'neutral'} 
                            size="sm"
                          >
                            {isAccepted ? 'Owner Accepted' : b.status.toUpperCase()}
                          </Badge>
                        </div>

                        <p className="text-xs text-ink-secondary">
                          {room.locality ? `${room.locality}, ${room.city || 'Mumbai'}` : 'Mumbai'} · Host: <strong>{owner.fullName || 'Property Landlord'}</strong>
                        </p>

                        <div className="flex flex-wrap items-center gap-3 text-xs pt-1">
                          <span className="flex items-center gap-1 font-medium text-ink-primary bg-surface-50 px-2.5 py-1 rounded-lg border border-surface-200">
                            <Calendar className="w-3.5 h-3.5 text-brand-600" />
                            Move-in: {b.moveInDate ? new Date(b.moveInDate).toLocaleDateString() : 'Immediate'}
                          </span>
                          <span className="flex items-center gap-1 font-medium text-ink-primary bg-surface-50 px-2.5 py-1 rounded-lg border border-surface-200">
                            <Clock className="w-3.5 h-3.5 text-brand-600" />
                            {b.stayDuration || 6} Months
                          </span>
                          <span className="font-semibold text-brand-700 bg-brand-50 px-2.5 py-1 rounded-lg border border-brand-200/50">
                            ₹{(room.rent || 0).toLocaleString('en-IN')}/mo
                          </span>
                        </div>

                        {b.message && (
                          <div className="p-2.5 rounded-xl bg-surface-50 border border-surface-200/60 text-xs text-ink-secondary italic">
                            &quot;{b.message}&quot;
                          </div>
                        )}

                        {isRejected && b.rejectionReason && (
                          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
                            <strong>Host feedback:</strong> {b.rejectionReason}
                          </div>
                        )}
                      </div>

                    </div>

                    {/* Agreement Status / Actions Banner */}
                    {isAccepted ? (
                      <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 font-bold text-emerald-950">
                            <FileCheck className="w-4 h-4 text-emerald-700" />
                            <span>Mutual Agreement Ready for Digital Assent</span>
                          </div>
                          <p className="text-[11px] text-emerald-800">
                            Review terms, house rules, and sign independently. No cash or deposit required upfront.
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            variant="primary"
                            size="sm"
                            icon={FileCheck}
                            onClick={() => {
                              setSelectedBookingId(bookingId);
                              setSelectedAgreementId(agreementId);
                              setIsAgreementModalOpen(true);
                            }}
                          >
                            Review & Sign Agreement
                          </Button>
                        </div>
                      </div>
                    ) : isPending ? (
                      <div className="pt-2 border-t border-surface-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                        <span className="text-amber-800 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          Awaiting owner review. The owner will accept or decline your proposal.
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                          icon={XCircle}
                          disabled={cancellingId === bookingId}
                          onClick={() => handleCancelBooking(bookingId)}
                        >
                          {cancellingId === bookingId ? 'Cancelling...' : 'Cancel Request'}
                        </Button>
                      </div>
                    ) : null}
                  </Card>
                );
              })}
            </div>
          )}

          {/* Scheduled In-Person Visits Section */}
          <div className="pt-6 border-t border-surface-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-ink-primary flex items-center gap-2">
                <Calendar className="w-5 h-5 text-brand-600" />
                Scheduled In-Person Room Visits
              </h2>
              <span className="text-xs text-ink-secondary">{myVisits.length} visits</span>
            </div>

            {loadingVisits ? (
              <p className="text-xs text-ink-secondary py-2">Loading visits...</p>
            ) : myVisits.length === 0 ? (
              <div className="p-5 rounded-2xl bg-surface-50 border border-surface-200 text-xs text-ink-secondary text-center">
                No room walkthroughs scheduled. You can request a visit directly from any room listing.
              </div>
            ) : (
              <div className="space-y-3">
                {myVisits.map((v) => {
                  const statusVariant = v.status === 'Accepted' ? 'emerald' : v.status === 'Pending' ? 'amber' : 'neutral';
                  const roomId = v.room?._id || v.room?.id || v.room;
                  return (
                    <div key={v.id || v._id} className="p-4 rounded-2xl bg-white border border-surface-200 space-y-2 text-xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-ink-primary">{v.room?.title || 'Room Listing'}</span>
                            <Badge variant={statusVariant} size="sm">
                              {v.status}
                            </Badge>
                          </div>
                          <p className="text-ink-secondary text-[11px] mt-0.5">
                            Host: {v.owner?.fullName || 'Property Host'} {v.owner?.phone ? `· Phone: ${v.owner.phone}` : ''}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-medium text-ink-primary">
                          <span className="flex items-center gap-1 bg-surface-50 px-2.5 py-1 rounded-lg border border-surface-200">
                            <Calendar className="w-3.5 h-3.5 text-brand-600" />
                            {v.visitDate}
                          </span>
                          <span className="flex items-center gap-1 bg-surface-50 px-2.5 py-1 rounded-lg border border-surface-200">
                            <Clock className="w-3.5 h-3.5 text-brand-600" />
                            {v.visitTime}
                          </span>
                        </div>
                      </div>

                      {v.status === 'Accepted' ? (
                        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-surface-200 text-emerald-800">
                          <div className="flex items-center gap-1.5 font-medium text-[11px]">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>Visit Accepted! Exact property address and Google Maps location are unlocked.</span>
                          </div>
                          <Link to={`/rooms/${roomId}`}>
                            <Button variant="secondary" size="sm" icon={ExternalLink}>
                              View Map & Room
                            </Button>
                          </Link>
                        </div>
                      ) : (
                        <p className="text-[11px] text-ink-tertiary pt-1">
                          Exact location unlocks automatically once the owner accepts your walkthrough proposal.
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Right Col: Safe Living Protocol & Guidelines */}
        <div className="space-y-6">
          <Card className="p-6 bg-white shadow-subtle rounded-3xl space-y-4 border border-surface-200">
            <div className="w-10 h-10 rounded-2xl bg-brand-50 border border-brand-200 text-brand-700 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-base text-ink-primary">
                Safe Tenancy Protocol
              </h3>
              <p className="text-xs text-ink-secondary mt-1 leading-relaxed">
                RoomSync provides a transparent, zero-token rental framework to eliminate rental scams and fraudulent deposit requests.
              </p>
            </div>

            <div className="space-y-3 border-t border-surface-200 pt-4 text-xs text-ink-secondary">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-800 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <div>
                  <strong className="text-ink-primary block">Zero Upfront Token</strong>
                  <span>Never pay arbitrary holding fees. Send booking requests directly to verified landlords.</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-800 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <div>
                  <strong className="text-ink-primary block">Mutual Digital Agreement</strong>
                  <span>When accepted, a structured mutual agreement is generated with rent, deposit, and 22 living rules.</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-800 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  3
                </span>
                <div>
                  <strong className="text-ink-primary block">Independent Signatures</strong>
                  <span>Both parties must independently review and sign with timestamp and IP audit log.</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-800 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  4
                </span>
                <div>
                  <strong className="text-ink-primary block">Audit-Ready PDF</strong>
                  <span>Download an official PDF document with statutory disclaimer for your tenancy records.</span>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-5 bg-surface-50 border border-black/[0.05] rounded-3xl text-xs text-ink-secondary space-y-2">
            <span className="font-semibold text-ink-primary block">Statutory Legal Notice</span>
            <p className="leading-relaxed text-[11px]">
              Mutual agreements generated via RoomSync reflect the operational understanding and lifestyle concordat between roommates and owners. They do not replace formal stamp duty registration required under regional rent control laws.
            </p>
          </Card>
        </div>

      </div>

      {/* Mutual Agreement Modal */}
      <MutualAgreementModal
        isOpen={isAgreementModalOpen}
        onClose={() => {
          setIsAgreementModalOpen(false);
          setSelectedAgreementId(null);
          setSelectedBookingId(null);
          loadData();
        }}
        agreementId={selectedAgreementId}
        bookingId={selectedBookingId}
        onAgreementUpdated={() => {
          loadData();
        }}
      />

    </div>
  );
};
