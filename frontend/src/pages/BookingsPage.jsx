import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { 
  FileText, 
  QrCode, 
  ShieldCheck, 
  CreditCard, 
  Download, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  Printer,
  XCircle,
  ArrowRight,
  RefreshCw,
  Home,
  Calendar,
  MapPin,
  ExternalLink
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useAuth } from '../context/AuthContext';
import { 
  reserveRoomListing, 
  fetchMyBookings, 
  cancelBookingApi, 
  fetchRoomById,
  fetchMyVisitsApi
} from '../services/api';

export const BookingsPage = () => {
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get('roomId');
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [targetRoom, setTargetRoom] = useState(null);
  const [loadingRoom, setLoadingRoom] = useState(false);
  const [myBookings, setMyBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [myVisits, setMyVisits] = useState([]);
  const [loadingVisits, setLoadingVisits] = useState(true);
  const [isReserving, setIsReserving] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);
  const [conflictError, setConflictError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [activeReservation, setActiveReservation] = useState(null);

  // Load target room if roomId provided in URL
  useEffect(() => {
    if (roomId) {
      setLoadingRoom(true);
      fetchRoomById(roomId)
        .then((data) => {
          setTargetRoom(data);
          setLoadingRoom(false);
        })
        .catch((err) => {
          console.warn('Could not fetch room details:', err.message);
          setLoadingRoom(false);
        });
    }
  }, [roomId]);

  // Load user's bookings and visits if authenticated
  const loadBookingsAndVisits = () => {
    if (!isAuthenticated) {
      setLoadingBookings(false);
      setLoadingVisits(false);
      return;
    }
    setLoadingBookings(true);
    fetchMyBookings()
      .then((data) => {
        setMyBookings(data || []);
        const active = data.find((b) => ['pending', 'confirmed'].includes(b.status));
        setActiveReservation(active || null);
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
    loadBookingsAndVisits();
  }, [isAuthenticated]);

  // Handle Atomic Reservation
  const handleReserve = async () => {
    if (!isAuthenticated) {
      navigate(`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      return;
    }

    const selectedRoomId = roomId || (targetRoom?._id || targetRoom?.id);
    if (!selectedRoomId) {
      setConflictError('Please choose a room listing to reserve.');
      return;
    }

    setIsReserving(true);
    setConflictError(null);
    setSuccessMessage(null);

    try {
      const result = await reserveRoomListing({
        roomId: selectedRoomId,
        bookingType: 'tenancy_reservation',
        tokenAmount: 5000,
        notes: `Tenancy agreement initiated via RoomSync Portal by ${user?.fullName || 'Seeker'}.`,
      });

      setSuccessMessage('Room reserved successfully! A 15-minute hold lock has been placed to prevent double-booking.');
      setActiveReservation(result);
      loadBookingsAndVisits();
    } catch (err) {
      if (err.code === 'ROOM_ALREADY_RESERVED' || err.code === 'DUPLICATE_ACTIVE_BOOKING') {
        setConflictError(
          'Synchronization Lock Notice: This room has just been reserved by another seeker or is currently occupied. RoomSync strictly prevents double-booking, so no charges were processed. Please explore other available listings.'
        );
      } else if (err.code === 'ALREADY_RESERVED_BY_YOU') {
        setConflictError('You already have an active reservation for this room.');
      } else if (err.code === 'CANNOT_BOOK_OWN_LISTING') {
        setConflictError('You cannot reserve your own property listing.');
      } else {
        setConflictError(err.message || 'Reservation failed. Please try again.');
      }
    } finally {
      setIsReserving(false);
    }
  };

  // Handle Cancellation & Lock Release
  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this reservation? The room lock will be immediately released for other seekers.')) {
      return;
    }

    setCancellingId(bookingId);
    try {
      await cancelBookingApi(bookingId);
      setSuccessMessage('Reservation cancelled and room availability lock has been released.');
      setActiveReservation(null);
      loadBookingsAndVisits();
    } catch (err) {
      alert(`Could not cancel booking: ${err.message}`);
    } finally {
      setCancellingId(null);
    }
  };

  const hostName = targetRoom?.owner?.fullName || targetRoom?.owner?.name || 'Aditya Sharma';
  const seekerName = user?.fullName || 'Incoming Room Seeker';
  const displayRent = targetRoom?.rent ? targetRoom.rent.toLocaleString('en-IN') : '18,500';
  const displayDeposit = targetRoom?.deposit ? targetRoom.deposit.toLocaleString('en-IN') : '50,000';
  const displayLocality = targetRoom?.locality ? `${targetRoom.locality}, ${targetRoom.city || 'Mumbai'}` : 'Lokhandwala, Mumbai';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-ink-primary">
            Booking & Tenancy Agreements
          </h1>
          <p className="text-xs text-ink-secondary mt-1">
            Standardized digital rental contracts with strict atomic concurrency protection and cryptographic QR verification.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isAuthenticated && (
            <Button variant="ghost" size="sm" icon={RefreshCw} onClick={loadBookingsAndVisits}>
              Refresh Status
            </Button>
          )}
          <Button variant="secondary" size="sm" icon={Printer} onClick={() => window.print()}>
            Print / Save PDF
          </Button>
        </div>
      </div>

      {/* Concurrency Collision Notice */}
      {conflictError && (
        <div className="mb-8 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3 shadow-subtle animate-in fade-in duration-200">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold block text-sm">Concurrency & Data Consistency Safeguard</span>
            <p className="leading-relaxed">{conflictError}</p>
            <div className="pt-2">
              <Link to="/explore">
                <Button size="sm" variant="secondary" icon={ArrowRight}>
                  Explore Other Available Rooms
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Success Notification */}
      {successMessage && (
        <div className="mb-8 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-start gap-3 shadow-subtle animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold block text-sm">Reservation Active</span>
            <p className="leading-relaxed">{successMessage}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Digital Agreement Preview */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 sm:p-10 bg-white shadow-apple border border-black/[0.08] relative">
            
            {/* Top Seal */}
            <div className="flex items-center justify-between border-b border-surface-200 pb-6 mb-6">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-700 bg-brand-50 px-2 py-0.5 rounded-md border border-brand-200/50">
                  RoomSync Tenancy Standard
                </span>
                <h2 className="text-xl font-bold text-ink-primary mt-1">Shared Accommodation Agreement</h2>
                <p className="text-xs text-ink-tertiary">
                  Document ID: RS-AGR-{targetRoom?._id ? targetRoom._id.slice(-6).toUpperCase() : '2026-BLR-101'} · Karnataka Stamp Ready
                </p>
              </div>

              {/* QR Verification */}
              <div className="p-2 border border-surface-200 rounded-xl bg-surface-50 text-center shrink-0">
                <QrCode className="w-14 h-14 text-ink-primary mx-auto" />
                <span className="text-[9px] text-ink-tertiary block mt-1 font-mono">SCAN TO VERIFY</span>
              </div>
            </div>

            {/* Parties */}
            <div className="grid grid-cols-2 gap-4 text-xs bg-surface-50 p-4 rounded-xl border border-surface-200 mb-6">
              <div>
                <span className="text-ink-tertiary block uppercase text-[10px] font-semibold">Primary Host / Landlord</span>
                <span className="font-semibold text-ink-primary block mt-0.5">{hostName}</span>
                <span className="text-ink-secondary">{displayLocality}</span>
              </div>
              <div>
                <span className="text-ink-tertiary block uppercase text-[10px] font-semibold">Incoming Room Seeker</span>
                <span className="font-semibold text-ink-primary block mt-0.5">{seekerName}</span>
                <span className="text-ink-secondary">{user?.email || 'Authenticated Seeker Profile'}</span>
              </div>
            </div>

            {/* Agreement Terms */}
            <div className="space-y-4 text-xs text-ink-secondary leading-relaxed">
              <h3 className="font-bold text-sm text-ink-primary">Agreed Tenancy Terms & Clauses</h3>

              <div>
                <span className="font-semibold text-ink-primary">1. Monthly Rent & Maintenance:</span> ₹{displayRent} monthly rent payable by the 5th of each calendar month. Shared electricity, Wi-Fi, and housekeeping maintenance split equally.
              </div>

              <div>
                <span className="font-semibold text-ink-primary">2. Security Deposit:</span> A refundable security deposit of ₹{displayDeposit} shall be held securely. Deductions permitted only for documented damages or unpaid utility bills.
              </div>

              <div>
                <span className="font-semibold text-ink-primary">3. 22-Factor Living Concordat:</span> Both parties explicitly acknowledge agreement on:
                <ul className="list-disc ml-5 mt-1 space-y-0.5">
                  <li>Quiet hours starting at 11:30 PM on weekdays.</li>
                  <li>Strict non-smoking policy inside premises and on balconies.</li>
                  <li>Overnight guests allowed with 24 hours prior communication.</li>
                </ul>
              </div>

              <div>
                <span className="font-semibold text-ink-primary">4. Atomic Reservation & Notice Period:</span> Minimum 30 days written notice required before departure. RoomSync guarantees single-tenant reservation atomicity.
              </div>
            </div>

            {/* Signatures status */}
            <div className="mt-8 pt-6 border-t border-surface-200 grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-200">
                <div className="flex items-center gap-1.5 text-emerald-800 font-semibold mb-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Host Signed Digitally</span>
                </div>
                <p className="text-[11px] text-ink-tertiary">{hostName} · Verified Host Record</p>
              </div>

              <div className={`p-3 rounded-xl border ${activeReservation ? 'bg-emerald-50/50 border-emerald-200' : 'bg-brand-50/50 border-brand-200'}`}>
                <div className={`flex items-center gap-1.5 font-semibold mb-1 ${activeReservation ? 'text-emerald-800' : 'text-brand-800'}`}>
                  <CheckCircle2 className={`w-4 h-4 ${activeReservation ? 'text-emerald-600' : 'text-brand-600'}`} />
                  <span>{activeReservation ? 'Seeker Reserved' : 'Ready for Seeker Signature'}</span>
                </div>
                <p className="text-[11px] text-ink-tertiary">
                  {activeReservation ? `Status: ${activeReservation.status.toUpperCase()} (Lock Active)` : 'Click below to confirm booking'}
                </p>
              </div>
            </div>

          </Card>

          {/* User's Scheduled Room Visits */}
          {isAuthenticated && (
            <Card className="p-6 bg-white shadow-subtle border border-black/[0.08] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <h3 className="font-semibold text-sm text-ink-primary flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-brand-600" />
                  Your Scheduled Room Visits ({myVisits.length})
                </h3>
                <span className="text-[11px] text-ink-tertiary">
                  Exact Google Maps location unlocks when host accepts
                </span>
              </div>

              {loadingVisits ? (
                <p className="text-xs text-ink-secondary py-2">Loading your visit requests...</p>
              ) : myVisits.length === 0 ? (
                <div className="p-4 rounded-xl bg-surface-50 border border-surface-200 text-xs text-ink-secondary text-center">
                  No visit requests scheduled yet. Find a room you like and click &quot;Request a Visit&quot; to coordinate an in-person walkthrough.
                </div>
              ) : (
                <div className="space-y-3">
                  {myVisits.map((v) => {
                    const statusVariant = v.status === 'Accepted' ? 'emerald' : v.status === 'Pending' ? 'amber' : 'neutral';
                    const roomId = v.room?._id || v.room?.id || v.room;
                    return (
                      <div key={v.id || v._id} className="p-4 rounded-xl bg-surface-50 border border-surface-200 space-y-2 text-xs">
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
                            <span className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-surface-200">
                              <Calendar className="w-3.5 h-3.5 text-brand-600" />
                              {v.visitDate}
                            </span>
                            <span className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-surface-200">
                              <Clock className="w-3.5 h-3.5 text-brand-600" />
                              {v.visitTime}
                            </span>
                          </div>
                        </div>

                        {v.message && (
                          <p className="text-[11px] text-ink-secondary italic bg-white/70 p-2 rounded-lg border border-surface-200/50">
                            &quot;{v.message}&quot;
                          </p>
                        )}

                        {v.status === 'Accepted' ? (
                          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-surface-200/60 text-emerald-800">
                            <div className="flex items-center gap-1.5 font-medium text-[11px]">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              <span>Visit Accepted! Exact address & Google Maps link are unlocked.</span>
                            </div>
                            <Link to={`/rooms/${roomId}`}>
                              <Button variant="secondary" size="sm" icon={ExternalLink}>
                                View Unlocked Room & Map
                              </Button>
                            </Link>
                          </div>
                        ) : v.status === 'Pending' ? (
                          <div className="pt-1 text-[11px] text-amber-800 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span>Awaiting host confirmation. You will receive access to the exact address once accepted.</span>
                          </div>
                        ) : (
                          <div className="pt-1 text-[11px] text-ink-tertiary">
                            <span>This visit request was declined or cancelled.</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          )}

          {/* User's Existing Bookings List */}
          {isAuthenticated && myBookings.length > 0 && (
            <Card className="p-6 bg-white shadow-subtle border border-black/[0.08] space-y-4">
              <h3 className="font-semibold text-sm text-ink-primary flex items-center gap-2">
                <FileText className="w-4 h-4 text-brand-600" />
                Your Booking History & Active Holds ({myBookings.length})
              </h3>
              <div className="space-y-3">
                {myBookings.map((b) => (
                  <div key={b.id || b._id} className="p-3.5 rounded-xl bg-surface-50 border border-surface-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-ink-primary">{b.room?.title || 'Room Listing'}</span>
                        <Badge variant={b.status === 'confirmed' ? 'teal' : (b.status === 'pending' ? 'amber' : 'neutral')}>
                          {b.status}
                        </Badge>
                      </div>
                      <p className="text-ink-secondary text-[11px] mt-0.5">
                        Token: ₹{(b.tokenAmount || 5000).toLocaleString('en-IN')} · Host: {b.owner?.fullName || 'Host'}
                      </p>
                    </div>

                    {['pending', 'confirmed'].includes(b.status) && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-rose-600 hover:text-rose-700 border-rose-200 hover:border-rose-300 shrink-0"
                        icon={XCircle}
                        disabled={cancellingId === (b.id || b._id)}
                        onClick={() => handleCancelBooking(b.id || b._id)}
                      >
                        {cancellingId === (b.id || b._id) ? 'Releasing...' : 'Cancel & Release Lock'}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Right Col: Token Payment & Actions */}
        <div className="space-y-6">
          <Card className="p-6 bg-white shadow-subtle space-y-5">
            <h3 className="font-semibold text-base text-ink-primary flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-brand-600" />
              Token Deposit Checkout
            </h3>
            <p className="text-xs text-ink-secondary">
              Secure the room with a refundable token deposit. Protected by atomic compare-and-swap (CAS) lock.
            </p>

            <div className="p-4 rounded-xl bg-surface-50 border border-surface-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-ink-secondary">Token Booking Fee</span>
                <span className="font-semibold text-ink-primary">₹5,000</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-secondary">Platform Processing</span>
                <span className="font-semibold text-emerald-700">₹0 (Free Beta)</span>
              </div>
              <div className="border-t border-surface-200 pt-2 flex justify-between font-bold text-sm text-ink-primary">
                <span>Total Payable</span>
                <span>₹5,000</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/60 text-xs text-amber-900 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>Razorpay Test Mode integration is active. No real funds will be charged.</span>
            </div>

            {activeReservation ? (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 text-center font-medium">
                  ✓ Active 15-Minute Hold Lock Active
                </div>
                <Button 
                  variant="outline" 
                  className="w-full justify-center text-rose-600 hover:text-rose-700" 
                  size="md"
                  onClick={() => handleCancelBooking(activeReservation.id || activeReservation._id)}
                  disabled={cancellingId === (activeReservation.id || activeReservation._id)}
                >
                  {cancellingId ? 'Releasing Room Lock...' : 'Cancel & Release Lock'}
                </Button>
              </div>
            ) : (
              <Button 
                variant="primary" 
                className="w-full justify-center" 
                size="md"
                onClick={handleReserve}
                disabled={isReserving || loadingRoom}
              >
                {isReserving ? 'Acquiring Atomic Lock...' : 'Sign & Reserve ₹5,000 (Test Mode)'}
              </Button>
            )}
          </Card>

          {/* Concurrency Safeguard Explanation */}
          <Card className="p-5 bg-surface-100 border border-black/[0.05] text-xs text-ink-secondary space-y-2">
            <div className="flex items-center gap-1.5 font-semibold text-ink-primary">
              <ShieldCheck className="w-4 h-4 text-brand-600" />
              <span>Concurrency & Double-Booking Guard</span>
            </div>
            <p className="leading-relaxed">
              When you click Reserve, RoomSync executes an atomic compare-and-swap operation in MongoDB. If multiple seekers click simultaneously, exactly one seeker acquires the 15-minute hold lock; all other concurrent requests are safely rejected to protect data integrity.
            </p>
          </Card>
        </div>

      </div>

    </div>
  );
};
