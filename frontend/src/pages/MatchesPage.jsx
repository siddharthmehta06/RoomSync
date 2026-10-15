import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, 
  MapPin, 
  CheckCircle2, 
  AlertTriangle, 
  SlidersHorizontal, 
  ArrowRight, 
  MessageSquare, 
  Info,
  ShieldCheck,
  TrendingUp
} from 'lucide-react';
import { fetchMatches } from '../services/api';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { CompatibilityBadge } from '../components/ui/CompatibilityBadge';

export const MatchesPage = () => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    fetchMatches().then((data) => {
      if (isMounted) {
        setMatches(data);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 border border-brand-200/60 text-brand-800 text-xs font-medium mb-2">
            <Sparkles className="w-3.5 h-3.5 text-brand-600" />
            <span>Explainable Match Engine Active</span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-ink-primary">
            Your Compatibility Matches
          </h1>
          <p className="text-xs text-ink-secondary mt-1">
            Ranked by your customized 22-factor weights. Deal-breakers filtered automatically.
          </p>
        </div>

        <Link to="/onboarding">
          <Button variant="outline" size="sm" icon={SlidersHorizontal}>
            Adjust Lifestyle Weights
          </Button>
        </Link>
      </div>

      {/* Algorithmic Methodology Notice (Beginner clarity & honesty) */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-black/[0.06] shadow-2xs mb-8 flex items-start gap-3.5">
        <div className="w-8 h-8 rounded-lg bg-brand-100 text-brand-800 flex items-center justify-center shrink-0 mt-0.5">
          <Info className="w-4 h-4" />
        </div>
        <div className="text-xs text-ink-secondary leading-relaxed">
          <span className="font-semibold text-ink-primary block mb-0.5">Two Distinct Scores Explained:</span>
          <span className="font-semibold text-brand-700">compatibilityScore</span> evaluates your interpersonal living alignment (sleep times, kitchen habits, noise boundaries). <span className="font-semibold text-ink-primary">rankingScore (TOPSIS)</span> incorporates overall property value, transit distance, and tenant ratings.
        </div>
      </div>

      {/* Match Cards List */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="inline-block animate-spin w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full" />
          <p className="text-xs text-ink-secondary mt-3">Evaluating 22 compatibility factors...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {matches.map((room, idx) => (
            <Card key={room.id} className="overflow-hidden border border-black/[0.06] hover:shadow-card-hover transition-all">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-6">
                
                {/* Room Image & Badges (4 cols) */}
                <div className="md:col-span-4 relative rounded-2xl overflow-hidden aspect-[4/3] bg-surface-200">
                  <img
                    src={room.images[0]}
                    alt={room.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3">
                    <CompatibilityBadge score={room.compatibilityScore} />
                  </div>
                  <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-white text-[11px] font-medium px-2 py-0.5 rounded-full">
                    Rank #{idx + 1}
                  </div>
                </div>

                {/* Match Information (5 cols) */}
                <div className="md:col-span-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs text-ink-tertiary mb-1">
                      <MapPin className="w-3.5 h-3.5 text-brand-600" />
                      <span>{room.locality}, {room.city}</span>
                    </div>

                    <h3 className="text-lg font-semibold text-ink-primary line-clamp-1">
                      {room.title}
                    </h3>
                    <p className="text-xs text-ink-secondary mt-0.5">{room.roomType} · {room.furnishing}</p>

                    {/* Strengths */}
                    <div className="mt-3.5 space-y-1.5">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-800 block">
                        Calculated Synergies
                      </span>
                      {room.strengths.slice(0, 3).map((str, sIdx) => (
                        <div key={sIdx} className="flex items-start gap-1.5 text-xs text-ink-primary">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span className="line-clamp-1">{str}</span>
                        </div>
                      ))}
                    </div>

                    {/* Mismatch Alert */}
                    {room.mismatches && room.mismatches.length > 0 && (
                      <div className="mt-3 pt-2 border-t border-surface-200/80">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-800 block mb-1">
                          Potential Friction Warning
                        </span>
                        <div className="flex items-start gap-1.5 text-xs text-amber-900 bg-amber-50/60 p-2 rounded-lg border border-amber-200/50">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                          <span className="line-clamp-1">{room.mismatches[0]}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Rent, Scores & CTA (3 cols) */}
                <div className="md:col-span-3 flex flex-col justify-between md:border-l md:border-surface-200 md:pl-6 pt-4 md:pt-0 border-t md:border-t-0 border-surface-200">
                  <div>
                    <div className="text-xl font-semibold text-ink-primary">
                      ₹{room.rent.toLocaleString('en-IN')}
                      <span className="text-xs font-normal text-ink-tertiary"> / mo</span>
                    </div>
                    <p className="text-[11px] text-ink-tertiary mt-0.5">
                      Maint: ₹{room.maintenance} · Deposit: ₹{room.deposit.toLocaleString('en-IN')}
                    </p>

                    <div className="mt-4 p-3 rounded-xl bg-surface-50 border border-surface-200 space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-ink-secondary">Lifestyle Fit:</span>
                        <span className="font-semibold text-brand-700">{room.compatibilityScore}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-ink-secondary">TOPSIS Rank:</span>
                        <span className="font-semibold text-ink-primary">{room.rankingScore} / 10</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col gap-2">
                    <Link to={`/rooms/${room.id}`}>
                      <Button variant="primary" size="sm" className="w-full justify-center">
                        View Factor Breakdown
                      </Button>
                    </Link>
                    <Link to="/messages">
                      <Button variant="secondary" size="sm" className="w-full justify-center" icon={MessageSquare}>
                        Message Flatmate
                      </Button>
                    </Link>
                  </div>
                </div>

              </div>
            </Card>
          ))}
        </div>
      )}

    </div>
  );
};
