import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  MapPin, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle,
  Calendar, 
  Clock, 
  Sparkles, 
  Bookmark, 
  Share2, 
  MessageSquare, 
  ArrowLeft,
  Utensils,
  Volume2,
  Briefcase,
  Users,
  Shield,
  PawPrint,
  Phone,
  Mail,
  Check,
  Lock,
  SlidersHorizontal,
  ExternalLink,
  Star,
  FileCheck,
} from 'lucide-react';
import { 
  fetchRoomById, 
  createOrGetConversation, 
  getAuthToken, 
  loginDemoUser,
  saveRoom,
  removeSavedRoom,
  fetchSavedRooms,
  sendConversationMessage,
  fetchCompatibilityPreview,
  submitRoomReview,
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { CompatibilityBadge } from '../components/ui/CompatibilityBadge';
import { Card, CardContent } from '../components/ui/Card';
import { RequestVisitModal } from '../components/modals/RequestVisitModal';
import { SendBookingRequestModal } from '../components/modals/SendBookingRequestModal';

export const RoomDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token, isAuthenticated } = useAuth();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [savingBookmark, setSavingBookmark] = useState(false);
  const [openingChat, setOpeningChat] = useState(false);
  const [isVisitModalOpen, setIsVisitModalOpen] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  
  // Deterministic 22-Factor Compatibility Engine State
  const [compatStatus, setCompatStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'incomplete' | 'error' | 'unauthenticated' | 'owner'
  const [compatData, setCompatData] = useState(null);
  const [compatErrorInfo, setCompatErrorInfo] = useState(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewFeedback, setReviewFeedback] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewMessage, setReviewMessage] = useState(null);

  const handleRequestVisit = () => {
    if (!isAuthenticated) {
      navigate(`/login?redirect=/rooms/${id}`);
      return;
    }
    setIsVisitModalOpen(true);
  };

  const handleStartChat = async (initialMessage = null) => {
    try {
      setOpeningChat(true);
      let token = getAuthToken();
      if (!token) {
        navigate(`/login?redirect=/rooms/${id}`);
        return;
      }

      const ownerId = room.owner?._id || room.owner?.id;
      const roomId = room._id || room.id;

      if (roomId) {
        try {
          const conversation = await createOrGetConversation({
            roomId,
            recipientId: ownerId,
          }, token);

          const convId = conversation._id || conversation.id;

          if (initialMessage && convId) {
            try {
              await sendConversationMessage(convId, initialMessage, token);
            } catch (msgErr) {
              console.warn('Initial message sending error:', msgErr.message);
            }
          }

          navigate(`/messages?conversationId=${convId}`);
          return;
        } catch (convErr) {
          console.warn('Could not create direct conversation:', convErr.message);
        }
      }

      navigate(`/messages?roomId=${roomId || ''}`);
    } catch (err) {
      navigate('/messages');
    } finally {
      setOpeningChat(false);
    }
  };

  const handleToggleSave = async () => {
    if (!isAuthenticated) {
      navigate(`/login?redirect=/rooms/${id}`);
      return;
    }

    const roomId = room?._id || room?.id;
    if (!roomId) return;

    setSavingBookmark(true);
    try {
      if (isSaved) {
        await removeSavedRoom(roomId);
        setIsSaved(false);
      } else {
        await saveRoom(roomId);
        setIsSaved(true);
      }
    } catch (e) {
      console.warn('Could not toggle saved room bookmark:', e.message);
    } finally {
      setSavingBookmark(false);
    }
  };

  // Automatic compatibility calculation for room seekers
  const runCompatibilityCheck = useCallback(async (targetRoomId = id, authToken = token) => {
    if (!authToken) {
      setCompatStatus('unauthenticated');
      return;
    }

    if (user?.role === 'owner') {
      setCompatStatus('owner');
      return;
    }

    setCompatStatus('loading');
    setCompatErrorInfo(null);

    try {
      const preview = await fetchCompatibilityPreview(targetRoomId, authToken);
      if (preview) {
        setCompatData(preview);
        setCompatStatus('success');
        setRoom((prev) => (prev ? {
          ...prev,
          compatibilityScore: preview.compatibilityScore,
          rankingScore: preview.rankingScore,
          strengths: preview.strengths || prev.strengths,
          mismatches: preview.mismatches || prev.mismatches,
        } : prev));
      }
    } catch (error) {
      console.warn('[Compatibility] Preview calculation error:', error);
      setCompatErrorInfo(error);
      if (error.code === 'PROFILE_INCOMPLETE') {
        setCompatStatus('incomplete');
      } else {
        setCompatStatus('error');
      }
    }
  }, [id, token, user?.role]);

  const handleSubmitReview = async (event) => {
    event.preventDefault();
    setReviewMessage(null);
    if (reviewRating < 1 || reviewRating > 5) {
      setReviewMessage({ type: 'error', text: 'Choose a rating from 1 to 5 stars.' });
      return;
    }
    setReviewSubmitting(true);
    try {
      const reviewSummary = await submitRoomReview(id, { rating: reviewRating, feedback: reviewFeedback }, token);
      setRoom((current) => ({ ...current, reviewSummary }));
      setReviewMessage({ type: 'success', text: 'Your rating and feedback have been saved.' });
    } catch (error) {
      setReviewMessage({ type: 'error', text: error.message });
    } finally {
      setReviewSubmitting(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    fetchRoomById(id, token)
      .then((data) => {
        if (isMounted) {
          setRoom(data);
          setReviewRating(data.reviewSummary?.myReview?.rating || 0);
          setReviewFeedback(data.reviewSummary?.myReview?.feedback || '');
          setLoading(false);

          // Automatically evaluate compatibility for signed-in seeker upon opening room
          runCompatibilityCheck(id, token);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setLoading(false);
        }
      });

    if (isAuthenticated) {
      fetchSavedRooms()
        .then((saved) => {
          if (isMounted && Array.isArray(saved)) {
            const match = saved.some((s) => (s.id || s._id) === id);
            setIsSaved(match);
          }
        })
        .catch(() => {});
    }

    return () => {
      isMounted = false;
    };
  }, [id, isAuthenticated, token, runCompatibilityCheck]);

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="inline-block animate-spin w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full" />
        <p className="text-xs text-ink-secondary mt-3">Loading listing details...</p>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="max-w-xl mx-auto py-24 text-center px-4">
        <h2 className="text-xl font-semibold text-ink-primary">Room Not Found</h2>
        <p className="text-xs text-ink-secondary mt-2">The room listing you requested may have been unlisted or rented.</p>
        <Link to="/explore">
          <Button variant="secondary" size="sm" className="mt-4" icon={ArrowLeft}>
            Return to Explore
          </Button>
        </Link>
      </div>
    );
  }

  const livingConditions = room.livingConditions || room.questionnaire || {};
  const amenities = Array.isArray(room.amenities) ? room.amenities : [];
  const images = Array.isArray(room.images) && room.images.length > 0 ? room.images : ['https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1200&q=80'];
  const ownerName = room.owner?.fullName || room.owner?.name || 'Property Owner';
  const rawPhone = room.owner?.phone || '';
  const cleanPhone = rawPhone.replace(/[^0-9+]/g, '');
  const formattedPhone = rawPhone ? (rawPhone.startsWith('+') ? rawPhone : `+91 ${rawPhone}`) : null;
  const currentUserId = user?._id || user?.id;
  const roomOwnerId = room.owner?._id || room.owner?.id || (typeof room.owner === 'string' ? room.owner : null);
  const isOwnerOfListing = Boolean(currentUserId && roomOwnerId && String(currentUserId) === String(roomOwnerId));
  const isReservedOrOccupied = room.status === 'reserved' || room.status === 'occupied';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      
      {/* Back button & top bar */}
      <div className="flex items-center justify-between mb-6">
        <button 
          onClick={() => navigate(-1)} 
          className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-secondary hover:text-ink-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to listings</span>
        </button>

        <div className="flex items-center gap-2">
          <Button 
            variant={isSaved ? "primary" : "ghost"} 
            size="sm" 
            icon={Bookmark} 
            onClick={handleToggleSave}
            disabled={savingBookmark}
            className={isSaved ? "text-white bg-brand-600" : ""}
          >
            {savingBookmark ? "Updating..." : (isSaved ? "Saved in Shortlist" : "Bookmark")}
          </Button>
        </div>
      </div>

      {/* Main Title & Headline */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            {compatStatus === 'loading' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-50 text-brand-700 border border-brand-200">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-600 animate-pulse" />
                Calculating synergy...
              </span>
            )}
            {compatStatus === 'success' && compatData?.compatibilityScore !== undefined && (
              <CompatibilityBadge score={compatData.compatibilityScore} />
            )}
            <Badge variant="teal">{room.furnishing}</Badge>
            <Badge variant="neutral">{room.roomType}</Badge>
            {room.status === 'reserved' && (
              <Badge variant="amber" className="bg-amber-100 text-amber-800 border-amber-300">Reserved</Badge>
            )}
            {room.status === 'occupied' && (
              <Badge variant="rose" className="bg-rose-100 text-rose-800 border-rose-300">Occupied</Badge>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-ink-primary">
            {room.title}
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-xs text-ink-secondary mt-1.5">
            <MapPin className="w-4 h-4 text-brand-600 shrink-0" />
            <span>{room.locality}, {room.city}, {room.state} - {room.pinCode}</span>
            {room.exactAddress && (
              <span className="text-ink-tertiary">· {room.exactAddress}</span>
            )}
          </div>

          {/* Google Maps Property Location (Shown before visit) */}
          <div className="mt-3 flex flex-wrap items-center gap-2.5">
            {room.googleMapsUrl && (
              <a
                href={room.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs font-semibold text-brand-700 bg-brand-50 border border-brand-200 px-3.5 py-1.5 rounded-full hover:bg-brand-100 hover:border-brand-300 transition-all shadow-xs group"
                title="Open location on Google Maps in a new tab"
              >
                <MapPin className="w-3.5 h-3.5 text-brand-600 group-hover:scale-110 transition-transform" />
                <span>View on Google Maps</span>
                <ExternalLink className="w-3 h-3 text-brand-500 opacity-80" />
              </a>
            )}
            {room.isExactAddressPrivate && (
              <span className="text-[11px] text-ink-tertiary">
                (Exact flat number provided upon confirmed visit)
              </span>
            )}
          </div>
        </div>

        {/* Pricing Summary */}
        <div className="text-left md:text-right bg-surface-100 md:bg-transparent p-4 md:p-0 rounded-2xl flex flex-col md:items-end justify-between">
          <div>
            <div className="text-2xl sm:text-3xl font-semibold text-ink-primary">
              ₹{room.rent.toLocaleString('en-IN')}
              <span className="text-xs font-normal text-ink-secondary"> / month</span>
            </div>
            <p className="text-xs text-ink-tertiary mt-0.5">
              +₹{room.maintenance.toLocaleString('en-IN')} maint · Deposit: ₹{room.deposit.toLocaleString('en-IN')}
            </p>
          </div>
          {!isOwnerOfListing && !isReservedOrOccupied && (
            <div className="mt-3 hidden sm:block">
              <Button
                variant="primary"
                size="sm"
                className="bg-teal-800 hover:bg-teal-900 text-white shadow-xs"
                icon={FileCheck}
                onClick={() => {
                  if (!isAuthenticated) {
                    navigate(`/login?redirect=/rooms/${id}`);
                    return;
                  }
                  setIsBookingModalOpen(true);
                }}
              >
                Send Booking Request
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* High-Resolution Photo Gallery */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
        <div className="md:col-span-3 aspect-[16/10] sm:aspect-[16/9] rounded-2xl sm:rounded-3xl overflow-hidden bg-surface-200">
          <img
            src={images[activeImageIndex] || images[0]}
            alt={room.title}
            className="w-full h-full object-cover transition-all duration-300"
          />
        </div>
        <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setActiveImageIndex(idx)}
              className={`aspect-[4/3] rounded-xl overflow-hidden border-2 transition-all shrink-0 w-24 md:w-full ${
                activeImageIndex === idx ? 'border-brand-600 ring-2 ring-brand-500/20' : 'border-transparent opacity-70 hover:opacity-100'
              }`}
            >
              <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Details on Left, Booking/Contact on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
        
        {/* Left Column (2 Cols) */}
        <div className="lg:col-span-2 space-y-10">
          
          {/* Explainable Compatibility Deep Dive */}
          {compatStatus === 'loading' ? (
            <section className="bg-white rounded-3xl p-6 sm:p-8 border border-black/[0.06] shadow-subtle">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shrink-0">
                  <div className="animate-spin w-5 h-5 border-2 border-brand-600 border-t-transparent rounded-full" />
                </div>
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-ink-primary">Comparing Your 22 Preferences</h3>
                    <span className="text-[11px] font-medium text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-full border border-brand-200">
                      Deterministic Algorithm
                    </span>
                  </div>
                  <p className="text-xs text-ink-secondary leading-relaxed">
                    Evaluating circadian rhythm synchronicity, dietary kitchen rules, cleanliness tolerance, noise boundaries, and WFH schedules with this space...
                  </p>
                </div>
              </div>
            </section>
          ) : compatStatus === 'success' && compatData ? (
            <section className="bg-white rounded-3xl p-6 sm:p-8 border border-black/[0.06] shadow-subtle animate-fadeIn space-y-6">
              {/* Header & Badges */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-surface-200/80">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-semibold text-ink-primary">
                      Personalized Room Compatibility
                    </h2>
                    <p className="text-xs text-ink-secondary">
                      Calculated automatically using your saved 22 lifestyle factors against this listing's actual conditions.
                    </p>
                  </div>
                </div>
                <Link
                  to="/onboarding"
                  className="inline-flex items-center gap-1.5 text-xs text-brand-700 font-semibold hover:underline shrink-0"
                  title="Edit your 22 factors in onboarding"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Edit Preferences</span>
                </Link>
              </div>

              {/* Dual Score Cards: Compatibility Score vs Property Ranking Score */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* 1. Compatibility Score (Lifestyle Synergy) */}
                <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-200/80 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-teal-900">
                      Compatibility Score
                    </span>
                    <span className="text-xl font-bold text-teal-800">
                      {compatData.compatibilityScore}%
                    </span>
                  </div>
                  <p className="text-xs font-medium text-teal-950 mt-1">
                    Interpersonal Lifestyle Synergy
                  </p>
                  <p className="text-[11px] text-teal-800/90 mt-1 leading-relaxed">
                    Quantifies circadian synchronicity, kitchen habits, personal space, and noise harmony between you and flatmates.
                  </p>
                </div>

                {/* 2. Property Ranking Score (TOPSIS Multi-Criteria) */}
                <div className="p-4 rounded-2xl bg-surface-100 border border-surface-300 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-secondary">
                      Ranking Score (TOPSIS)
                    </span>
                    <span className="text-xl font-bold text-ink-primary">
                      {compatData.rankingScore} <span className="text-xs font-normal text-ink-tertiary">/ 10</span>
                    </span>
                  </div>
                  <p className="text-xs font-medium text-ink-primary mt-1">
                    Multi-Criteria Property Value
                  </p>
                  <p className="text-[11px] text-ink-secondary mt-1 leading-relaxed">
                    Evaluates property fundamentals: rent fairness, security deposit ratio, transit proximity, and included amenities.
                  </p>
                </div>

              </div>

              {/* Hard-Constraint Alert if Deal-Breaker triggered */}
              {compatData.eligible === false && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1.5">
                  <div className="flex items-center gap-2 font-semibold text-amber-950">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Deal-Breaker / Hard-Constraint Friction</span>
                  </div>
                  <p className="text-amber-800 text-[11px] leading-relaxed">
                    This room does not satisfy one of your strict constraints (e.g. rent ceiling, dietary requirement, or smoking rule):
                  </p>
                  <ul className="list-disc pl-5 space-y-0.5 text-[11px] text-amber-900">
                    {(compatData.exclusionReasons || ['Listing does not meet all deal-breaker rules.']).map((reason, idx) => (
                      <li key={idx}>{reason}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Explainable Strengths & Friction Points */}
              <div className="space-y-4">
                
                {/* Strengths */}
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-emerald-800 mb-2 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Explainable Strengths & Synergies ({compatData.strengths?.length || 0})</span>
                  </h4>
                  <div className="space-y-2">
                    {compatData.strengths && compatData.strengths.length > 0 ? (
                      compatData.strengths.map((s, idx) => (
                        <div key={idx} className="flex items-start gap-2.5 text-xs text-ink-primary bg-emerald-50/50 p-3 rounded-xl border border-emerald-100/80">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span className="leading-relaxed">{s}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-ink-tertiary italic p-3 bg-surface-50 rounded-xl">
                        Standard criteria satisfied with neutral synergy.
                      </p>
                    )}
                  </div>
                </div>

                {/* Mismatches */}
                {compatData.mismatches && compatData.mismatches.length > 0 && (
                  <div className="pt-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-800 mb-2 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      <span>Noted Friction Points ({compatData.mismatches.length})</span>
                    </h4>
                    <div className="space-y-2">
                      {compatData.mismatches.map((m, idx) => (
                        <div key={idx} className="flex items-start gap-2.5 text-xs text-amber-950 bg-amber-50/60 p-3 rounded-xl border border-amber-200/60">
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <span className="leading-relaxed">{m}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </section>
          ) : compatStatus === 'incomplete' ? (
            <section className="bg-surface-50 rounded-3xl p-6 sm:p-8 border border-surface-200 shadow-2xs">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0">
                  <SlidersHorizontal className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-ink-primary">Personalized Compatibility Score Locked</h3>
                    {compatErrorInfo?.completedCount !== undefined && (
                      <span className="text-[11px] font-medium text-amber-800 bg-amber-100/80 px-2.5 py-0.5 rounded-full border border-amber-200">
                        {compatErrorInfo.completedCount}/22 factors
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-ink-secondary leading-relaxed">
                    Please complete all 22 preference factors to evaluate your compatibility score for this room. RoomSync evaluates circadian rhythms, shared kitchen expectations, and guest boundaries, and never fabricates arbitrary scores.
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-surface-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <span className="text-[11px] text-ink-tertiary">
                  Quick 2-minute setup covering budget, diet, sleep, hygiene, and noise boundaries.
                </span>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate('/onboarding')}
                  className="shrink-0"
                >
                  Complete 22 Factors
                </Button>
              </div>
            </section>
          ) : compatStatus === 'error' ? (
            <section className="bg-rose-50/60 rounded-3xl p-6 sm:p-8 border border-rose-200 shadow-2xs">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div className="space-y-1 flex-1">
                  <h3 className="text-sm font-semibold text-rose-950">Compatibility Calculation Unavailable</h3>
                  <p className="text-xs text-rose-800 leading-relaxed">
                    {compatErrorInfo?.message || 'RoomSync could not calculate your compatibility score for this room.'} We never substitute unverified or arbitrary percentages.
                  </p>
                  <div className="pt-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => runCompatibilityCheck()}
                      className="text-xs"
                    >
                      Retry Calculation
                    </Button>
                  </div>
                </div>
              </div>
            </section>
          ) : compatStatus === 'owner' ? (
            <section className="bg-surface-50 rounded-3xl p-6 sm:p-8 border border-surface-200 shadow-2xs">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-surface-200 flex items-center justify-center text-ink-secondary shrink-0">
                  <Shield className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-ink-primary">Property Owner Listing View</h3>
                  <p className="text-xs text-ink-secondary leading-relaxed">
                    You are viewing this listing as a Property Owner. Room seekers with completed 22-factor profiles will see their personalized lifestyle synergy, explainable strengths, and friction points here.
                  </p>
                </div>
              </div>
            </section>
          ) : (
            <section className="bg-surface-50 rounded-3xl p-6 sm:p-8 border border-surface-200 shadow-2xs">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-700 shrink-0">
                  <SlidersHorizontal className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-ink-primary">Sign in to Compare Compatibility</h3>
                  <p className="text-xs text-ink-secondary leading-relaxed">
                    Sign in as a room seeker with your 22 preferences to evaluate compatibility with this room's living conditions and view explainable lifestyle synergies.
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-surface-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <span className="text-[11px] text-ink-tertiary">
                  RoomSync compares actual house habits with your personal criteria.
                </span>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate(`/login?redirect=/rooms/${id}`)}
                  className="shrink-0"
                >
                  Sign In as Seeker
                </Button>
              </div>
            </section>
          )}

          {/* Living Conditions & House Rules Across Factors */}
          <section className="bg-white rounded-3xl p-6 sm:p-8 border border-black/[0.06] shadow-subtle">
            <h2 className="text-lg font-semibold text-ink-primary mb-4">Actual Living Conditions</h2>
            <p className="text-xs text-ink-secondary mb-6">
              Verified details submitted by existing flatmates and property owners.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              
              <div className="p-3.5 rounded-xl bg-surface-50 border border-surface-200">
                <span className="font-semibold text-ink-primary block mb-1">Diet & Cooking</span>
                <span className="text-ink-secondary">{livingConditions.foodPreference} · {livingConditions.cookingFrequency}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-surface-50 border border-surface-200">
                <span className="font-semibold text-ink-primary block mb-1">Smoking & Alcohol</span>
                <span className="text-ink-secondary">{livingConditions.smoking} · {livingConditions.alcohol}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-surface-50 border border-surface-200">
                <span className="font-semibold text-ink-primary block mb-1">Sleep & Wake Routine</span>
                <span className="text-ink-secondary">Bedtime: ~{livingConditions.sleepSchedule}:00 · Rise: ~{livingConditions.wakeSchedule}:00</span>
              </div>

              <div className="p-3.5 rounded-xl bg-surface-50 border border-surface-200">
                <span className="font-semibold text-ink-primary block mb-1">Cleanliness & Chores</span>
                <span className="text-ink-secondary">Standard: {livingConditions.cleanliness}/5 · Maid / Dusting routine active</span>
              </div>

              <div className="p-3.5 rounded-xl bg-surface-50 border border-surface-200">
                <span className="font-semibold text-ink-primary block mb-1">Visitors & Guests</span>
                <span className="text-ink-secondary">{livingConditions.guestsDay} · Overnight: {livingConditions.guestsOvernight}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-surface-50 border border-surface-200">
                <span className="font-semibold text-ink-primary block mb-1">WFH & Noise Level</span>
                <span className="text-ink-secondary">{livingConditions.wfhFrequency} days/wk remote · Noise tolerance: {livingConditions.noiseTolerance}/5</span>
              </div>

              <div className="p-3.5 rounded-xl bg-surface-50 border border-surface-200 sm:col-span-2">
                <span className="font-semibold text-ink-primary block mb-1">Society & Gate Curfew</span>
                <span className="text-ink-secondary">{livingConditions.rulesStrictness}</span>
              </div>

            </div>
          </section>

          {/* Amenities */}
          <section className="bg-white rounded-3xl p-6 sm:p-8 border border-black/[0.06] shadow-subtle">
            <h2 className="text-lg font-semibold text-ink-primary mb-4">Included Amenities</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {amenities.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 p-3 rounded-xl bg-surface-50 border border-surface-200 text-xs text-ink-primary font-medium">
                  <CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Property Location & Neighborhood */}
          <section className="bg-white rounded-3xl p-6 sm:p-8 border border-black/[0.06] shadow-subtle space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-ink-primary flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-brand-600" />
                  Property Location & Neighborhood
                </h2>
                <p className="text-xs text-ink-secondary mt-0.5">
                  Explore transit access, metro stations, and local conveniences on Google Maps before your visit.
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-surface-50 border border-surface-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-ink-primary block">
                  {room.locality}, {room.city}
                </span>
                <p className="text-xs text-ink-secondary">
                  {room.livingConditions?.locationCommute || 'Convenient access to metro feeder lines and Western Railway.'}
                </p>
                <p className="text-[11px] text-ink-tertiary">
                  Pin Code: {room.pinCode} · State: {room.state}
                </p>
              </div>

              {room.googleMapsUrl && (
                <a
                  href={room.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-brand-600 text-white rounded-xl text-xs font-semibold hover:bg-brand-700 transition-colors shadow-sm shrink-0"
                >
                  <MapPin className="w-4 h-4" />
                  <span>Open in Google Maps</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-90" />
                </a>
              )}
            </div>
          </section>

        </div>

        {/* Right Sidebar: Contact & Flatmate Bio */}
        <div className="space-y-6">
          
          {/* Property Owner & Landlord Card */}
          <div className="bg-white rounded-3xl p-6 border border-black/[0.06] shadow-subtle space-y-5">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-700 block mb-3">
                Property Owner & Landlord
              </span>
              <div className="flex items-center gap-3.5">
                {room.owner?.avatar ? (
                  <img
                    src={room.owner.avatar}
                    alt={ownerName}
                    className="w-14 h-14 rounded-full object-cover border border-brand-200"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-brand-50 border border-brand-200 text-brand-800 text-lg font-semibold flex items-center justify-center">
                    {ownerName ? ownerName[0] : 'O'}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-semibold text-base text-ink-primary">{ownerName}</h3>
                    {room.owner?.isVerified && (
                      <ShieldCheck className="w-4 h-4 text-brand-600" title="Verified Landlord" />
                    )}
                  </div>
                  <p className="text-xs text-ink-secondary">
                    {room.owner?.role === 'owner' ? 'Verified Property Landlord' : (room.owner?.role || 'Property Host')}
                  </p>
                </div>
              </div>
            </div>

            {/* Real Owner Contact Information */}
            <div className="border-t border-surface-200 pt-4 space-y-2.5 text-xs">
              <div className="flex items-center justify-between py-1">
                <span className="text-ink-secondary flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-ink-tertiary" /> Phone
                </span>
                {cleanPhone ? (
                  <a
                    href={`tel:${cleanPhone}`}
                    className="font-medium text-brand-700 hover:text-brand-800 hover:underline flex items-center gap-1"
                    title="Click to call owner"
                  >
                    <span>{formattedPhone}</span>
                  </a>
                ) : (
                  <span className="text-ink-tertiary italic">Phone number not provided</span>
                )}
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-ink-secondary flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-ink-tertiary" /> Email
                </span>
                {room.owner?.email ? (
                  <a
                    href={`mailto:${room.owner.email}`}
                    className="font-medium text-ink-primary hover:text-brand-700 hover:underline truncate max-w-[180px]"
                    title="Click to email owner"
                  >
                    {room.owner.email}
                  </a>
                ) : (
                  <span className="text-ink-tertiary italic">Available upon enquiry</span>
                )}
              </div>

              <div className="flex justify-between py-1">
                <span className="text-ink-secondary">Available From</span>
                <span className="font-medium text-ink-primary">{room.availableFrom || 'Immediate'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-ink-secondary">Min Stay Tenure</span>
                <span className="font-medium text-ink-primary">{room.minStayMonths || 6} Months</span>
              </div>
              {user?.role === 'seeker' && (
                <form onSubmit={handleSubmitReview} className="border-t border-surface-200 pt-4 space-y-3">
                  {isAuthenticated ? (
                    <>
                      <div className="flex items-center gap-1" role="radiogroup" aria-label="Room rating from 1 to 5 stars">
                        {[1, 2, 3, 4, 5].map((value) => (
                          <button
                            key={value}
                            type="button"
                            role="radio"
                            aria-checked={reviewRating === value}
                            aria-label={`${value} star${value === 1 ? '' : 's'}`}
                            onClick={() => setReviewRating(value)}
                            className="p-1 text-amber-500 hover:scale-110 transition-transform"
                          >
                            <Star className={`w-5 h-5 ${reviewRating >= value ? 'fill-current' : ''}`} />
                          </button>
                        ))}
                        <span className="ml-2 text-xs text-ink-secondary">{reviewRating ? `${reviewRating}/5` : 'Your rating'}</span>
                      </div>
                      <Button type="submit" variant="secondary" size="sm" className="w-full" disabled={reviewSubmitting}>
                        {reviewSubmitting ? 'Saving review...' : room.reviewSummary?.myReview ? 'Update your review' : 'Submit review'}
                      </Button>
                    </>
                  ) : (
                    <Link to={`/login?redirect=/rooms/${id}`} className="text-xs font-semibold text-brand-700 hover:underline">
                      Sign in as a seeker to leave a review
                    </Link>
                  )}
                  {reviewMessage && (
                    <p className={`text-xs ${reviewMessage.type === 'error' ? 'text-rose-700' : 'text-emerald-700'}`} role="status">
                      {reviewMessage.text}
                    </p>
                  )}
                </form>
              )}
              <div className="flex items-center justify-between border-t border-surface-200 pt-4 text-xs">
                <span className="text-ink-secondary">Seeker rating</span>
                {room.reviewSummary?.ratingCount > 0 ? (
                  <span className="inline-flex items-center gap-1.5 font-semibold text-ink-primary">
                    <Star className="w-4 h-4 text-amber-500 fill-current" />
                    {room.reviewSummary.ratingAverage} / 5
                    <span className="font-normal text-ink-tertiary">({room.reviewSummary.ratingCount} {room.reviewSummary.ratingCount === 1 ? 'review' : 'reviews'})</span>
                  </span>
                ) : (
                  <span className="text-ink-tertiary">Not rated</span>
                )}
              </div>
              {room.reviewSummary?.reviews?.some((review) => review.feedback?.trim()) && (
                <div className="space-y-2 border-t border-surface-200 pt-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-tertiary">Recent seeker feedback</p>
                  {room.reviewSummary.reviews.filter((review) => review.feedback?.trim()).map((review, index) => (
                    <div key={`${review.createdAt || 'review'}-${index}`} className="rounded-xl bg-surface-50 p-3">
                      <div className="flex items-center gap-1 text-amber-500 mb-1">
                        {Array.from({ length: review.rating }, (_, starIndex) => <Star key={starIndex} className="w-3 h-3 fill-current" />)}
                        <span className="ml-1 text-[10px] text-ink-tertiary">{review.rating}/5</span>
                      </div>
                      <p className="text-xs leading-relaxed text-ink-secondary">{review.feedback}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons: [Call Owner] [Message Owner] [Request a Visit] */}
            <div className="pt-2 flex flex-col gap-2.5">
              {cleanPhone && (
                <a href={`tel:${cleanPhone}`} className="w-full">
                  <Button variant="secondary" className="w-full justify-center" icon={Phone}>
                    Call Owner ({formattedPhone})
                  </Button>
                </a>
              )}

              <Button 
                variant="primary" 
                className="w-full justify-center" 
                icon={MessageSquare}
                onClick={() => handleStartChat()}
                disabled={openingChat}
              >
                {openingChat 
                  ? 'Connecting with Owner...' 
                  : `Message Owner (${ownerName ? ownerName.split(' ')[0] : 'Landlord'})`
                }
              </Button>

              <Button
                variant="outline"
                className="w-full justify-center"
                icon={Calendar}
                onClick={handleRequestVisit}
                disabled={openingChat}
              >
                Request a Visit
              </Button>

              {isOwnerOfListing ? (
                <div className="p-3 text-center rounded-xl bg-surface-100 text-xs text-ink-tertiary">
                  You are the owner of this listing.
                </div>
              ) : isReservedOrOccupied ? (
                <div className="p-3 text-center rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 font-medium">
                  This room is currently {room?.status}. Booking requests are closed.
                </div>
              ) : (
                <Button 
                  variant="primary" 
                  className="w-full justify-center bg-teal-800 hover:bg-teal-900 text-white shadow-xs" 
                  icon={FileCheck}
                  onClick={() => {
                    if (!isAuthenticated) {
                      navigate(`/login?redirect=/rooms/${id}`);
                      return;
                    }
                    setIsBookingModalOpen(true);
                  }}
                >
                  Send Booking Request
                </Button>
              )}
            </div>
          </div>

          {/* Safety & Anti-Fraud Notice */}
          <div className="p-5 rounded-2xl bg-surface-100 border border-black/[0.05] text-xs text-ink-secondary space-y-2">
            <div className="flex items-center gap-2 font-medium text-ink-primary">
              <Shield className="w-4 h-4 text-brand-600" />
              <span>RoomSync Safe Living Protocol</span>
            </div>
            <p className="leading-relaxed">
              Never transfer cash or deposits outside RoomSync. Use our digital mutual agreement system with verified owner credentials and transparent tenancy terms.
            </p>
          </div>

        </div>

      </div>

      {/* Request a Visit Modal */}
      <RequestVisitModal
        isOpen={isVisitModalOpen}
        onClose={() => setIsVisitModalOpen(false)}
        room={room}
        owner={room.owner}
        onVisitCreated={() => {
          // Refresh room data to check if privacy unlocked
          fetchRoomById(id, token).then((r) => setRoom(r)).catch(() => {});
        }}
      />

    {/* Send Booking Request Modal */}
      <SendBookingRequestModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        room={room}
        onRequestSubmitted={() => {
          fetchRoomById(id, token).then((r) => setRoom(r)).catch(() => {});
        }}
      />
    </div>
  );
};
