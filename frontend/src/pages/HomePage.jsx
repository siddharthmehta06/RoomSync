import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  Search, 
  MapPin, 
  ShieldCheck, 
  SlidersHorizontal, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Utensils, 
  Volume2, 
  Briefcase, 
  Users, 
  ChevronRight,
  Shield,
  Layers
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { CompatibilityBadge } from '../components/ui/CompatibilityBadge';
import { MOCK_ROOMS } from '../data/mockRooms';

export const HomePage = () => {
  const navigate = useNavigate();
  const [selectedCity, setSelectedCity] = useState('All');
  const [maxRent, setMaxRent] = useState('');

  const handleHeroSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (selectedCity && selectedCity !== 'All') params.append('city', selectedCity);
    if (maxRent) params.append('maxRent', maxRent);
    navigate(`/explore?${params.toString()}`);
  };

  const sampleFactors = [
    { name: 'Sleep & Wake Schedule', icon: Clock, desc: 'Synchronize quiet hours and bathroom access', tag: 'Circadian Fit' },
    { name: 'Diet & Kitchen Culture', icon: Utensils, desc: 'Pure-Veg, Non-Veg, or separate cookware', tag: 'Dietary Respect' },
    { name: 'Noise & Focus Tolerance', icon: Volume2, desc: 'Silent sanctuary vs ambient music', tag: 'Acoustic Synergy' },
    { name: 'WFH & Study Hours', icon: Briefcase, desc: 'Desk bandwidth and room presence', tag: 'Occupancy Flow' },
    { name: 'Guest & Social Policy', icon: Users, desc: 'Overnight rules and weekend gatherings', tag: 'Boundary Clarity' },
    { name: 'House Rules Strictness', icon: Shield, desc: 'Landlord curfews vs liberal consensus', tag: 'Governance' },
  ];

  return (
    <div className="flex flex-col">
      
      {/* Hero Section with Custom Living Room Background */}
      <section className="relative pt-14 pb-24 md:pt-24 md:pb-36 overflow-hidden">
        
        {/* Background Image Layer */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <img
            src="/hero-bg.jpg"
            alt="From architectural sketch to harmonious shared home"
            className="w-full h-full object-cover object-bottom opacity-80 sm:opacity-90"
          />
          {/* Soft radial and vertical lighting overlay for contrast & readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-surface-50/95 via-white/75 to-surface-50/95" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/90 via-transparent to-surface-50/60" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          {/* Eyebrow Pill */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-brand-200/80 shadow-subtle">
              <Sparkles className="w-4 h-4 text-brand-600" />
              <span className="text-xs font-medium text-brand-800">
                The Explainable 22-Factor Compatibility Engine
              </span>
            </div>
          </div>

          {/* Hero Typography */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight text-ink-primary leading-[1.12]">
              Shared living, matched with <span className="text-brand-600">mathematical clarity</span>.
            </h1>
            <p className="text-base sm:text-lg text-ink-secondary leading-relaxed font-normal max-w-2xl mx-auto pt-2">
              Don’t gamble on roommates who sleep at 3 AM while you rise at 6 AM. RoomSync pairs physical room standards with lifestyle habits across India's top tech hubs.
            </p>
          </div>

          {/* Hero Search Box */}
          <div className="mt-10 max-w-3xl mx-auto">
            <form 
              onSubmit={handleHeroSearch}
              className="bg-white/95 backdrop-blur-md p-3 sm:p-4 rounded-2xl sm:rounded-full border border-black/[0.08] shadow-apple flex flex-col sm:flex-row items-center gap-3"
            >
              <div className="flex-1 w-full flex items-center px-4 py-2 border-b sm:border-b-0 sm:border-r border-surface-200">
                <MapPin className="w-5 h-5 text-brand-600 mr-3 shrink-0" />
                <div className="w-full text-left">
                  <label className="block text-[11px] font-medium text-ink-tertiary uppercase tracking-wider">City</label>
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="w-full bg-transparent font-medium text-sm text-ink-primary focus:outline-none cursor-pointer"
                  >
                    <option value="All">All Indian Metros</option>
                    <option value="Bengaluru">Bengaluru</option>
                    <option value="Pune">Pune</option>
                    <option value="Hyderabad">Hyderabad</option>
                    <option value="Delhi-NCR">Delhi-NCR</option>
                    <option value="Mumbai">Mumbai</option>
                  </select>
                </div>
              </div>

              <div className="flex-1 w-full flex items-center px-4 py-2 border-b sm:border-b-0 sm:border-r border-surface-200">
                <SlidersHorizontal className="w-5 h-5 text-ink-tertiary mr-3 shrink-0" />
                <div className="w-full text-left">
                  <label className="block text-[11px] font-medium text-ink-tertiary uppercase tracking-wider">Max Budget (₹/mo)</label>
                  <input
                    type="number"
                    placeholder="e.g. 20000"
                    value={maxRent}
                    onChange={(e) => setMaxRent(e.target.value)}
                    className="w-full bg-transparent font-medium text-sm text-ink-primary focus:outline-none placeholder:text-ink-tertiary/60"
                  />
                </div>
              </div>

              <div className="w-full sm:w-auto p-1">
                <Button 
                  type="submit" 
                  size="pill" 
                  className="w-full sm:w-auto justify-center"
                  icon={Search}
                >
                  Find Rooms
                </Button>
              </div>
            </form>

            {/* Quick Suggestions */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-ink-tertiary">
              <span className="font-medium text-ink-secondary">Trending:</span>
              <Link to="/explore?city=Bengaluru" className="hover:text-brand-700 bg-white px-2.5 py-1 rounded-full border border-black/[0.04]">Koramangala</Link>
              <Link to="/explore?city=Bengaluru" className="hover:text-brand-700 bg-white px-2.5 py-1 rounded-full border border-black/[0.04]">HSR Layout</Link>
              <Link to="/explore?city=Pune" className="hover:text-brand-700 bg-white px-2.5 py-1 rounded-full border border-black/[0.04]">Hinjewadi Phase 1</Link>
              <Link to="/explore?city=Hyderabad" className="hover:text-brand-700 bg-white px-2.5 py-1 rounded-full border border-black/[0.04]">Gachibowli</Link>
            </div>
          </div>

        </div>
      </section>

      {/* 22 Factors Showcase */}
      <section className="py-16 md:py-24 bg-surface-100 border-y border-black/[0.05]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-brand-700 mb-2">Scientific Matchmaking</h2>
            <p className="text-3xl font-semibold tracking-tight text-ink-primary">
              22 Lifestyle Factors. Never an Arbitrary Percentage.
            </p>
            <p className="text-sm text-ink-secondary mt-3">
              RoomSync combines Fuzzy Logic and TOPSIS to evaluate continuous habits, cleanly distinguishing hard constraints from flexible preferences.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {sampleFactors.map((f, i) => {
              const Icon = f.icon;
              return (
                <div 
                  key={i}
                  className="p-6 rounded-2xl bg-white border border-black/[0.05] shadow-subtle hover:shadow-card-hover transition-all duration-300"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center text-brand-700">
                      <Icon className="w-5 h-5" />
                    </div>
                    <Badge variant="teal" size="sm">{f.tag}</Badge>
                  </div>
                  <h3 className="font-semibold text-base text-ink-primary mb-1">{f.name}</h3>
                  <p className="text-xs text-ink-secondary leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-10 text-center">
            <Link to="/onboarding">
              <Button variant="secondary" size="md" icon={ChevronRight} iconPosition="right">
                Explore All 22 Factors & Set Your Preferences
              </Button>
            </Link>
          </div>

        </div>
      </section>

      {/* Featured Verified Rooms */}
      <section className="py-16 md:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-brand-700 mb-2">Curated Living Spaces</h2>
            <p className="text-3xl font-semibold tracking-tight text-ink-primary">
              Verified Rooms with Transparent Living Rules
            </p>
          </div>
          <Link to="/explore">
            <Button variant="outline" size="sm" icon={ArrowRight} iconPosition="right">
              View All Listings
            </Button>
          </Link>
        </div>

        {/* Room Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {MOCK_ROOMS.slice(0, 3).map((room) => (
            <Card key={room.id} hoverable className="overflow-hidden flex flex-col group">
              {/* Photo Showcase with Badge */}
              <div className="relative aspect-[4/3] overflow-hidden bg-surface-200">
                <img
                  src={room.images[0]}
                  alt={room.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3">
                  <CompatibilityBadge score={room.compatibilityScore} />
                </div>
                <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-white text-xs font-medium px-2.5 py-1 rounded-full">
                  {room.furnishing}
                </div>
              </div>

              {/* Room Content */}
              <CardContent className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-ink-tertiary mb-1.5">
                    <MapPin className="w-3.5 h-3.5 text-brand-600" />
                    <span>{room.locality}, {room.city}</span>
                  </div>
                  <h3 className="font-semibold text-base text-ink-primary group-hover:text-brand-700 transition-colors line-clamp-1">
                    {room.title}
                  </h3>
                  <p className="text-xs text-ink-secondary mt-1">{room.roomType}</p>

                  {/* Strengths & Synergy Snippet */}
                  <div className="mt-3.5 pt-3 border-t border-surface-200/60 space-y-1.5">
                    {room.strengths.slice(0, 2).map((s, idx) => (
                      <div key={idx} className="flex items-start gap-1.5 text-xs text-emerald-800">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="line-clamp-1">{s}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pricing & CTA */}
                <div className="mt-5 pt-3 border-t border-surface-200 flex items-center justify-between">
                  <div>
                    <span className="text-lg font-semibold text-ink-primary">₹{room.rent.toLocaleString('en-IN')}</span>
                    <span className="text-xs text-ink-tertiary"> / month</span>
                  </div>
                  <Link to={`/rooms/${room.id}`}>
                    <Button variant="secondary" size="sm">
                      Inspect Details
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

      </section>

      {/* Algorithmic Integrity & Trust Banner */}
      <section className="py-16 bg-surface-50 border-t border-black/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-brand-900 text-white rounded-3xl p-8 sm:p-12 shadow-float relative overflow-hidden">
            <div className="relative z-10 max-w-2xl space-y-4">
              <Badge variant="dark" className="bg-brand-800 text-brand-100 border-brand-700">
                Ethical Engine Guarantee
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
                Zero fabricated scores. Real mathematical compatibility.
              </h2>
              <p className="text-sm sm:text-base text-brand-100/90 leading-relaxed font-light">
                We believe you deserve full honesty about where you and your future flatmates agree—and where you don't. We compute <span className="font-semibold text-white">compatibilityScore</span> separately from <span className="font-semibold text-white">rankingScore</span>, never conflating roommate lifestyle synergy with property features.
              </p>
              <div className="pt-2 flex flex-wrap gap-4">
                <Link to="/onboarding">
                  <Button variant="primary" className="bg-white text-brand-900 hover:bg-brand-50" size="md">
                    Start Onboarding Survey
                  </Button>
                </Link>
                <Link to="/explore">
                  <Button variant="outline" className="border-white/20 text-white hover:bg-white/10" size="md">
                    Browse All Listings
                  </Button>
                </Link>
              </div>
            </div>
            {/* Subtle decorative geometry */}
            <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial-gradient opacity-20 pointer-events-none hidden lg:block" />
          </div>
        </div>
      </section>

    </div>
  );
};
