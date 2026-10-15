import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Heart, Sparkles, SlidersHorizontal, CheckCircle2 } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-surface-100 border-t border-black/[0.06] text-ink-secondary text-sm mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 lg:gap-12">
          
          {/* Brand & Mission Column */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 32 32">
                  <path d="M16 6L7 13.5V25C7 25.5523 7.44772 26 8 26H13V19C13 18.4477 13.4477 18 14 18H18C18.5523 18 19 18.4477 19 19V26H24C24.5523 26 25 25.5523 25 25V13.5L16 6Z"/>
                  <circle cx="23" cy="9" r="4" fill="#99F6E4"/>
                </svg>
              </div>
              <span className="font-semibold text-lg text-ink-primary tracking-tight">RoomSync</span>
            </div>
            <p className="text-ink-secondary text-sm leading-relaxed max-w-sm">
              The explainable roommate & shared rental matching platform. Evaluating 22 multidimensional factors to build conflict-free living partnerships across Indian metropolises.
            </p>
            <div className="pt-2 flex items-center gap-2 text-xs text-brand-800 font-medium">
              <ShieldCheck className="w-4 h-4 text-brand-600" />
              <span>Algorithmic transparency · Zero fabricated scores</span>
            </div>
          </div>

          {/* Key Metros */}
          <div>
            <h4 className="font-semibold text-xs uppercase tracking-wider text-ink-primary mb-3">Popular Hubs</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/explore?city=Bengaluru" className="hover:text-brand-600 transition-colors">Bengaluru (HSR, Koramangala)</Link></li>
              <li><Link to="/explore?city=Pune" className="hover:text-brand-600 transition-colors">Pune (Hinjewadi, Baner)</Link></li>
              <li><Link to="/explore?city=Hyderabad" className="hover:text-brand-600 transition-colors">Hyderabad (Gachibowli, Hitec)</Link></li>
              <li><Link to="/explore?city=Delhi-NCR" className="hover:text-brand-600 transition-colors">Delhi-NCR (Gurugram, Noida)</Link></li>
              <li><Link to="/explore?city=Mumbai" className="hover:text-brand-600 transition-colors">Mumbai (Powai, Andheri)</Link></li>
            </ul>
          </div>

          {/* Product & Engine */}
          <div>
            <h4 className="font-semibold text-xs uppercase tracking-wider text-ink-primary mb-3">Product</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/onboarding" className="hover:text-brand-600 transition-colors">22-Factor Questionnaire</Link></li>
              <li><Link to="/matches" className="hover:text-brand-600 transition-colors">Compatibility Matches</Link></li>
              <li><Link to="/owner/dashboard" className="hover:text-brand-600 transition-colors">Owner & Flatmate Portal</Link></li>
              <li><Link to="/bookings" className="hover:text-brand-600 transition-colors">Agreements & Verification</Link></li>
              <li><Link to="/reviews-complaints" className="hover:text-brand-600 transition-colors">Reviews & Dispute Log</Link></li>
            </ul>
          </div>

          {/* Transparency & Standards */}
          <div>
            <h4 className="font-semibold text-xs uppercase tracking-wider text-ink-primary mb-3">Verification & Trust</h4>
            <ul className="space-y-2 text-xs">
              <li><span className="text-ink-secondary">Fuzzy Logic Matching</span></li>
              <li><span className="text-ink-secondary">TOPSIS Ranking Engine</span></li>
              <li><span className="text-ink-secondary">QR Agreement Stamping</span></li>
              <li><span className="text-ink-secondary">Community Guidelines</span></li>
              <li><span className="text-ink-secondary">Data Privacy Shield</span></li>
            </ul>
          </div>

        </div>

        {/* Bottom copyright & attribution */}
        <div className="mt-12 pt-6 border-t border-black/[0.05] flex flex-col sm:flex-row items-center justify-between text-xs text-ink-tertiary gap-4">
          <p>© {new Date().getFullYear()} RoomSync India. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span>Interpersonal compatibility is a measured index, not a legal guarantee.</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
