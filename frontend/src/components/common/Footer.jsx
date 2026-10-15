import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ShieldCheck } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-white border-t border-surface-200 text-ink-secondary text-sm mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 lg:gap-12">
          
          {/* Brand & Mission Column */}
          <div className="md:col-span-2 space-y-3.5">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-7 h-7 rounded-lg bg-brand-50 border border-brand-200/80 flex items-center justify-center text-brand-600">
                <Home className="w-3.5 h-3.5 stroke-[2.2]" />
              </div>
              <span className="font-semibold text-base text-ink-primary tracking-tight">RoomSync</span>
            </Link>
            <p className="text-ink-secondary text-xs sm:text-sm leading-relaxed max-w-sm font-normal">
              A thoughtful shared-living platform for students and working professionals. Matching shared flats through physical property standards and 22 daily lifestyle factors.
            </p>
            <div className="pt-1 flex items-center gap-2 text-xs text-brand-800 font-medium">
              <ShieldCheck className="w-4 h-4 text-brand-600 shrink-0" />
              <span>Transparent lifestyle insights · Zero fabricated scores</span>
            </div>
          </div>

          {/* Key Metros */}
          <div>
            <h4 className="font-semibold text-xs uppercase tracking-wider text-ink-primary mb-3">Popular Hubs</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/explore?city=Bengaluru" className="hover:text-brand-700 transition-colors">Bengaluru (HSR, Koramangala)</Link></li>
              <li><Link to="/explore?city=Pune" className="hover:text-brand-700 transition-colors">Pune (Hinjewadi, Baner)</Link></li>
              <li><Link to="/explore?city=Hyderabad" className="hover:text-brand-700 transition-colors">Hyderabad (Gachibowli, Hitec)</Link></li>
              <li><Link to="/explore?city=Delhi-NCR" className="hover:text-brand-700 transition-colors">Delhi-NCR (Gurugram, Noida)</Link></li>
              <li><Link to="/explore?city=Mumbai" className="hover:text-brand-700 transition-colors">Mumbai (Powai, Andheri)</Link></li>
            </ul>
          </div>

          {/* Product & Engine */}
          <div>
            <h4 className="font-semibold text-xs uppercase tracking-wider text-ink-primary mb-3">Navigation</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/explore" className="hover:text-brand-700 transition-colors">Explore Rooms</Link></li>
              <li><Link to="/onboarding" className="hover:text-brand-700 transition-colors">Lifestyle Survey</Link></li>
              <li><Link to="/matches" className="hover:text-brand-700 transition-colors">Compatibility Matches</Link></li>
              <li><Link to="/owner/dashboard" className="hover:text-brand-700 transition-colors">Owner Hub</Link></li>
              <li><Link to="/bookings" className="hover:text-brand-700 transition-colors">Agreements & Booking</Link></li>
            </ul>
          </div>

          {/* Transparency & Standards */}
          <div>
            <h4 className="font-semibold text-xs uppercase tracking-wider text-ink-primary mb-3">Trust & Standards</h4>
            <ul className="space-y-2 text-xs text-ink-secondary">
              <li><span>Fuzzy Logic Matching</span></li>
              <li><span>TOPSIS Multi-Criteria</span></li>
              <li><span>Document Verification</span></li>
              <li><span>Community Guidelines</span></li>
              <li><span>Privacy Safeguard</span></li>
            </ul>
          </div>

        </div>

        {/* Bottom copyright */}
        <div className="mt-12 pt-6 border-t border-surface-200 flex flex-col sm:flex-row items-center justify-between text-xs text-ink-tertiary gap-3">
          <p>© {new Date().getFullYear()} RoomSync India. All rights reserved.</p>
          <p className="text-center sm:text-right">
            Curated accommodation and lifestyle synergy.
          </p>
        </div>
      </div>
    </footer>
  );
};
