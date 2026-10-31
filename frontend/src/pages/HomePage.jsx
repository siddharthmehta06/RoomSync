import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, 
  MapPin, 
  SlidersHorizontal, 
  Calendar, 
  ArrowRight, 
  Bookmark, 
  CheckCircle2, 
  Sparkles, 
  HeartHandshake, 
  Building2, 
  Clock, 
  Utensils, 
  Volume2, 
  Users 
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { MOCK_ROOMS } from '../data/mockRooms';

export const HomePage = () => {
  const navigate = useNavigate();

  // Search panel state
  const [selectedCity, setSelectedCity] = useState('Mumbai');
  const [maxRent, setMaxRent] = useState('');
  const [moveInTimeline, setMoveInTimeline] = useState('Flexible');
  const [savedRooms, setSavedRooms] = useState({});

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (selectedCity && selectedCity !== 'All') params.append('city', selectedCity);
    if (maxRent) params.append('maxRent', maxRent);
    if (moveInTimeline && moveInTimeline !== 'Flexible') params.append('timeline', moveInTimeline);
    navigate(`/explore?${params.toString()}`);
  };

  const toggleSave = (roomId, e) => {
    e.preventDefault();
    e.stopPropagation();
    setSavedRooms(prev => ({
      ...prev,
      [roomId]: !prev[roomId]
    }));
  };

  // Lifestyle comparison cards
  const lifestyleFactors = [
    {
      title: 'Sleep & Quiet Hours',
      desc: 'Synchronized sleep schedules ensure night owls and early risers never disturb each other.',
      icon: Clock,
      synergy: 'Circadian sync',
    },
    {
      title: 'Kitchen & Dietary Culture',
      desc: 'Whether pure-veg, non-veg, or shared cookware, set kitchen guidelines before moving in.',
      icon: Utensils,
      synergy: 'Dietary harmony',
    },
    {
      title: 'Work & Study Focus',
      desc: 'Know WFH desk bandwidth, call habits, and quiet focus blocks across the flat.',
      icon: Volume2,
      synergy: 'Acoustic comfort',
    },
    {
      title: 'Guests & Boundaries',
      desc: 'Advance notice for weekend visitors and overnight friends, agreed without awkwardness.',
      icon: Users,
      synergy: 'Clear expectations',
    },
  ];

  return (
    <div className="flex flex-col bg-ivory">
      
      {/* =========================================================================
          HERO SECTION (Two-Column Layout)
      ========================================================================= */}
      <section className="pt-8 pb-16 md:pt-14 md:pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          
          {/* Left Column: Headline, Narrative & Search */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            
            {/* Small teal eyebrow label */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 border border-brand-200/70 text-brand-800 text-xs font-medium w-fit mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-600"></span>
              A smarter way to share a home
            </div>

            {/* Large Hero Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-semibold tracking-tight text-ink-primary leading-[1.12] mb-4">
              Find a room. Find <span className="text-brand-600">your people.</span>
            </h1>

            {/* Supporting text */}
            <p className="text-base sm:text-lg text-ink-secondary leading-relaxed font-normal mb-8 max-w-xl">
              Find a home that fits your budget, your routine, and the way you live.
            </p>

            {/* Functional Search Panel */}
            <form 
              onSubmit={handleSearch}
              className="bg-white rounded-2xl sm:rounded-full border border-surface-200 shadow-search p-2 sm:p-2.5 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 transition-all focus-within:border-brand-500/50"
            >
              {/* City selector */}
              <div className="flex-1 px-4 py-2 border-b sm:border-b-0 sm:border-r border-surface-200">
                <label className="block text-[11px] font-medium text-ink-secondary uppercase tracking-wider mb-0.5">
                  City
                </label>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="w-full bg-transparent text-sm font-medium text-ink-primary focus:outline-none cursor-pointer"
                  >
                    <option value="Mumbai">Mumbai (Andheri Focus)</option>
                    <option value="All">All Localities</option>
                  </select>
                </div>
              </div>

              {/* Monthly budget in INR */}
              <div className="flex-1 px-4 py-2 border-b sm:border-b-0 sm:border-r border-surface-200">
                <label className="block text-[11px] font-medium text-ink-secondary uppercase tracking-wider mb-0.5">
                  Max Budget
                </label>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium text-ink-secondary">₹</span>
                  <input
                    type="number"
                    placeholder="e.g. 20,000"
                    value={maxRent}
                    onChange={(e) => setMaxRent(e.target.value)}
                    className="w-full bg-transparent text-sm font-medium text-ink-primary focus:outline-none placeholder:text-ink-tertiary"
                  />
                </div>
              </div>

              {/* Move-in timeline */}
              <div className="flex-1 px-4 py-2 border-b sm:border-b-0 border-surface-200">
                <label className="block text-[11px] font-medium text-ink-secondary uppercase tracking-wider mb-0.5">
                  Move-in Date
                </label>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-ink-secondary shrink-0" />
                  <select
                    value={moveInTimeline}
                    onChange={(e) => setMoveInTimeline(e.target.value)}
                    className="w-full bg-transparent text-sm font-medium text-ink-primary focus:outline-none cursor-pointer"
                  >
                    <option value="Flexible">Flexible date</option>
                    <option value="Immediate">Immediate</option>
                    <option value="Within 15 days">Within 15 days</option>
                    <option value="Next month">Next month</option>
                  </select>
                </div>
              </div>

              {/* Teal Action Button */}
              <button
                type="submit"
                className="bg-brand-600 hover:bg-brand-700 text-white font-medium text-sm px-6 py-3 rounded-xl sm:rounded-full transition-all duration-150 shadow-2xs hover:shadow-sm shrink-0 flex items-center justify-center gap-2 mt-1 sm:mt-0 active:scale-[0.98]"
              >
                <span>Explore rooms</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Popular Neighborhood Links */}
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-ink-secondary px-1">
              <span className="text-ink-tertiary">Popular:</span>
              {[
                { name: 'Koramangala', city: 'Bengaluru' },
                { name: 'HSR Layout', city: 'Bengaluru' },
                { name: 'Hinjewadi', city: 'Pune' },
                { name: 'Gachibowli', city: 'Hyderabad' },
              ].map((loc) => (
                <Link
                  key={loc.name}
                  to={`/explore?city=${loc.city}&locality=${loc.name}`}
                  className="px-2.5 py-1 rounded-full bg-white border border-surface-200 text-ink-primary hover:border-surface-300 hover:text-brand-700 transition-colors"
                >
                  {loc.name}
                </Link>
              ))}
            </div>

          </div>

          {/* Right Column: Clean, Sunlit Modern Interior Photograph */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-3xl overflow-hidden border border-surface-200 shadow-soft bg-white aspect-[4/3] sm:aspect-[14/11] lg:aspect-[5/4]">
              <img
                src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=85"
                alt="Sunlit minimalist modern apartment interior with warm wood and natural light"
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to local asset if network image is unreachable
                  e.target.src = '/hero-bg.jpg';
                }}
              />
              
              {/* Subtle Floating Compatibility Card */}
              <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:max-w-xs bg-white/95 backdrop-blur-md p-3.5 rounded-2xl border border-surface-200 shadow-card flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-brand-50 border border-brand-200/80 flex items-center justify-center text-brand-700 shrink-0 font-semibold text-xs">
                  94%
                </div>
                <div>
                  <div className="text-xs font-semibold text-ink-primary flex items-center gap-1.5">
                    <span>Lifestyle Synergy Match</span>
                    <Sparkles className="w-3 h-3 text-brand-600" />
                  </div>
                  <p className="text-[11px] text-ink-secondary mt-0.5">
                    Synchronized quiet hours & cooking habits
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* =========================================================================
          TRUST STRIP (3 Concise Benefits)
      ========================================================================= */}
      <section className="border-y border-surface-200 bg-white py-10 md:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-surface-50 border border-surface-200 flex items-center justify-center text-brand-700 shrink-0">
                <SlidersHorizontal className="w-4 h-4 stroke-[2]" />
              </div>
              <div>
                <h3 className="font-semibold text-sm sm:text-base text-ink-primary mb-1">
                  Lifestyle-aware matching
                </h3>
                <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed font-normal">
                  Compare sleep schedules, cleanliness standards, and work-from-home routines before contacting.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-surface-50 border border-surface-200 flex items-center justify-center text-brand-700 shrink-0">
                <CheckCircle2 className="w-4 h-4 stroke-[2]" />
              </div>
              <div>
                <h3 className="font-semibold text-sm sm:text-base text-ink-primary mb-1">
                  Clear compatibility insights
                </h3>
                <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed font-normal">
                  Transparent breakdown showing where habits naturally align and explicit notes on any potential friction.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-surface-50 border border-surface-200 flex items-center justify-center text-brand-700 shrink-0">
                <Building2 className="w-4 h-4 stroke-[2]" />
              </div>
              <div>
                <h3 className="font-semibold text-sm sm:text-base text-ink-primary mb-1">
                  Rooms across Indian cities
                </h3>
                <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed font-normal">
                  Curated shared homes across student and IT hubs in Bengaluru, Pune, Hyderabad, and Delhi-NCR.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* =========================================================================
          FEATURED ROOMS ("Rooms worth sharing")
      ========================================================================= */}
      <section className="py-16 md:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-ink-primary">
              Rooms worth sharing
            </h2>
            <p className="text-sm text-ink-secondary mt-1">
              Thoughtful spaces for your next chapter.
            </p>
          </div>
          <Link 
            to="/explore" 
            className="text-xs sm:text-sm font-medium text-brand-700 hover:text-brand-800 flex items-center gap-1.5 transition-colors"
          >
            <span>View all listings</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Room Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {MOCK_ROOMS.slice(0, 3).map((room) => {
            const isSaved = Boolean(savedRooms[room.id]);
            return (
              <Card 
                key={room.id} 
                hoverable 
                className="overflow-hidden flex flex-col group bg-white border border-surface-200 rounded-2xl"
              >
                {/* Image & Save Button */}
                <div className="relative aspect-[16/11] overflow-hidden bg-surface-100">
                  <img
                    src={room.images[0]}
                    alt={room.title}
                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                  />
                  {/* Subtle top pill: Furnishing */}
                  <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-medium text-ink-primary border border-surface-200">
                    {room.furnishing}
                  </div>

                  {/* Bookmark Button */}
                  <button
                    onClick={(e) => toggleSave(room.id, e)}
                    className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md border transition-all ${
                      isSaved
                        ? 'bg-brand-600 text-white border-brand-600'
                        : 'bg-white/90 text-ink-secondary hover:text-ink-primary border-surface-200 hover:bg-white'
                    }`}
                    aria-label="Save listing"
                  >
                    <Bookmark className="w-3.5 h-3.5 fill-current" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    {/* Location */}
                    <div className="flex items-center gap-1.5 text-xs text-ink-secondary mb-1">
                      <MapPin className="w-3 h-3 text-brand-600 shrink-0" />
                      <span>{room.locality}, {room.city}</span>
                    </div>

                    {/* Title */}
                    <h3 className="font-semibold text-base text-ink-primary group-hover:text-brand-700 transition-colors line-clamp-1">
                      {room.title}
                    </h3>
                    <p className="text-xs text-ink-secondary mt-0.5">{room.roomType}</p>

                    {/* Amenities Snippets */}
                    <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-surface-200">
                      {room.amenities.slice(0, 3).map((a, i) => (
                        <span key={i} className="text-[11px] px-2 py-0.5 rounded-md bg-surface-50 text-ink-secondary border border-surface-200">
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Rent and View Details */}
                  <div className="mt-5 pt-3.5 border-t border-surface-200 flex items-center justify-between">
                    <div>
                      <span className="text-lg font-semibold text-ink-primary">₹{room.rent.toLocaleString('en-IN')}</span>
                      <span className="text-xs text-ink-secondary"> / month</span>
                    </div>
                    <Link to={`/rooms/${room.id}`}>
                      <Button variant="secondary" size="sm">
                        View details
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Demo Data Transparency Note */}
        <p className="text-center text-xs text-ink-tertiary mt-8">
          Showing sample accommodations for demonstration. All listings feature explicit living rules.
        </p>

      </section>

      {/* =========================================================================
          COMPATIBILITY INTRODUCTION ("More than a room. A better fit.")
      ========================================================================= */}
      <section className="py-16 md:py-24 bg-white border-y border-surface-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-ink-primary">
              More than a room. A better fit.
            </h2>
            <p className="text-sm sm:text-base text-ink-secondary mt-3 leading-relaxed">
              Living together works best when routines harmonize naturally. RoomSync helps you align on expectations before you sign a lease.
            </p>
          </div>

          {/* Factor Highlights Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {lifestyleFactors.map((f, i) => {
              const Icon = f.icon;
              return (
                <div 
                  key={i} 
                  className="p-6 rounded-2xl bg-surface-50 border border-surface-200 flex flex-col justify-between"
                >
                  <div>
                    <div className="w-9 h-9 rounded-xl bg-white border border-surface-200 flex items-center justify-center text-brand-700 mb-4 shadow-2xs">
                      <Icon className="w-4 h-4 stroke-[2]" />
                    </div>
                    <h3 className="font-semibold text-sm sm:text-base text-ink-primary mb-1.5">
                      {f.title}
                    </h3>
                    <p className="text-xs text-ink-secondary leading-relaxed">
                      {f.desc}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-surface-200 text-[11px] font-medium text-brand-700">
                    ✓ {f.synergy}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Survey CTA link */}
          <div className="mt-12 text-center">
            <Link to="/onboarding">
              <Button variant="secondary" size="md" icon={ArrowRight} iconPosition="right">
                Take the 22-factor lifestyle survey
              </Button>
            </Link>
          </div>

        </div>
      </section>

      {/* =========================================================================
          FINAL CALL TO ACTION (Calm & Minimal)
      ========================================================================= */}
      <section className="py-20 md:py-28 max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-ink-primary mb-3">
          Find a place you'll genuinely look forward to coming home to.
        </h2>
        <p className="text-sm sm:text-base text-ink-secondary max-w-xl mx-auto mb-8 font-normal leading-relaxed">
          Browse verified rooms or set your lifestyle preferences to see who you naturally align with.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link to="/explore">
            <Button variant="primary" size="lg">
              Explore all rooms
            </Button>
          </Link>
          <Link to="/onboarding">
            <Button variant="outline" size="lg">
              Set your preferences
            </Button>
          </Link>
        </div>
      </section>

    </div>
  );
};
