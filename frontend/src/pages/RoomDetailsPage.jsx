import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  MapPin, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
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
  PawPrint
} from 'lucide-react';
import { fetchRoomById } from '../services/api';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { CompatibilityBadge } from '../components/ui/CompatibilityBadge';
import { Card, CardContent } from '../components/ui/Card';

export const RoomDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    fetchRoomById(id)
      .then((data) => {
        if (isMounted) {
          setRoom(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

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

  const { livingConditions } = room;

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
            variant="ghost" 
            size="sm" 
            icon={Bookmark} 
            onClick={() => setIsSaved(!isSaved)}
            className={isSaved ? "text-brand-700 bg-brand-50" : ""}
          >
            {isSaved ? "Saved" : "Bookmark"}
          </Button>
        </div>
      </div>

      {/* Main Title & Headline */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <CompatibilityBadge score={room.compatibilityScore} />
            <Badge variant="teal">{room.furnishing}</Badge>
            <Badge variant="neutral">{room.roomType}</Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-ink-primary">
            {room.title}
          </h1>
          <div className="flex items-center gap-2 text-xs text-ink-secondary mt-1.5">
            <MapPin className="w-4 h-4 text-brand-600 shrink-0" />
            <span>{room.locality}, {room.city}, {room.state} - {room.pinCode}</span>
          </div>
        </div>

        {/* Pricing Summary */}
        <div className="text-left md:text-right bg-surface-100 md:bg-transparent p-4 md:p-0 rounded-2xl">
          <div className="text-2xl sm:text-3xl font-semibold text-ink-primary">
            ₹{room.rent.toLocaleString('en-IN')}
            <span className="text-xs font-normal text-ink-secondary"> / month</span>
          </div>
          <p className="text-xs text-ink-tertiary mt-0.5">
            +₹{room.maintenance.toLocaleString('en-IN')} maint · Deposit: ₹{room.deposit.toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      {/* High-Resolution Photo Gallery */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
        <div className="md:col-span-3 aspect-[16/10] sm:aspect-[16/9] rounded-2xl sm:rounded-3xl overflow-hidden bg-surface-200">
          <img
            src={room.images[activeImageIndex]}
            alt={room.title}
            className="w-full h-full object-cover transition-all duration-300"
          />
        </div>
        <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto">
          {room.images.map((img, idx) => (
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
          <section className="bg-white rounded-3xl p-6 sm:p-8 border border-black/[0.06] shadow-subtle">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-brand-600" />
                <h2 className="text-lg font-semibold text-ink-primary">Why This Room Matches You</h2>
              </div>
              <span className="text-xs font-semibold text-brand-800 bg-brand-50 px-3 py-1 rounded-full border border-brand-200/60">
                Score: {room.compatibilityScore}% (Synergy)
              </span>
            </div>
            <p className="text-xs text-ink-secondary leading-relaxed mb-6">
              Our 22-factor engine evaluates circadian rhythms, shared kitchen expectations, and personal boundaries to ensure peaceful co-living.
            </p>

            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-emerald-800 mb-2">Key Synergies & Alignment</h4>
                <div className="space-y-2">
                  {room.strengths.map((s, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-ink-primary bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-100">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
              </div>

              {room.mismatches && room.mismatches.length > 0 && (
                <div className="pt-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-800 mb-2">Noted Friction Points (Explainability)</h4>
                  <div className="space-y-2">
                    {room.mismatches.map((m, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-amber-900 bg-amber-50/70 p-2.5 rounded-xl border border-amber-200/60">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <span>{m}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

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
              {room.amenities.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 p-3 rounded-xl bg-surface-50 border border-surface-200 text-xs text-ink-primary font-medium">
                  <CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </section>

        </div>

        {/* Right Sidebar: Contact & Flatmate Bio */}
        <div className="space-y-6">
          
          {/* Owner/Flatmate Card */}
          <div className="bg-white rounded-3xl p-6 border border-black/[0.06] shadow-subtle space-y-5">
            <div className="flex items-center gap-3.5">
              <img
                src={room.owner.avatar}
                alt={room.owner.name}
                className="w-14 h-14 rounded-full object-cover border border-brand-200"
              />
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-semibold text-base text-ink-primary">{room.owner.name}</h3>
                  {room.owner.verified && (
                    <ShieldCheck className="w-4 h-4 text-brand-600" title="Verified Member" />
                  )}
                </div>
                <p className="text-xs text-ink-secondary">{room.owner.role}</p>
              </div>
            </div>

            <div className="border-t border-surface-200 pt-4 space-y-2 text-xs">
              <div className="flex justify-between py-1">
                <span className="text-ink-secondary">Available From</span>
                <span className="font-medium text-ink-primary">{room.availableFrom}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-ink-secondary">Min Stay Tenure</span>
                <span className="font-medium text-ink-primary">{room.minStayMonths} Months</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-ink-secondary">Ranking Score (TOPSIS)</span>
                <span className="font-semibold text-brand-700">{room.rankingScore} / 10</span>
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-2.5">
              <Link to="/messages">
                <Button variant="primary" className="w-full justify-center" icon={MessageSquare}>
                  Chat with {room.owner.name.split(' ')[0]}
                </Button>
              </Link>
              <Link to="/bookings">
                <Button variant="outline" className="w-full justify-center">
                  Review Agreement & Book
                </Button>
              </Link>
            </div>
          </div>

          {/* Safety & Anti-Fraud Notice */}
          <div className="p-5 rounded-2xl bg-surface-100 border border-black/[0.05] text-xs text-ink-secondary space-y-2">
            <div className="flex items-center gap-2 font-medium text-ink-primary">
              <Shield className="w-4 h-4 text-brand-600" />
              <span>RoomSync Safe Living Protocol</span>
            </div>
            <p className="leading-relaxed">
              Never transfer cash or deposits outside RoomSync. Use our digital agreement system with QR verification and test escrow safeguards.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
};
