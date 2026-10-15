import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Home, Compass, Sparkles, Bookmark, MessageSquare, PlusCircle, User, Menu, X, ShieldCheck } from 'lucide-react';
import { Button } from '../ui/Button';

export const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const navLinks = [
    { name: 'Explore', path: '/explore', icon: Compass },
    { name: 'Matches', path: '/matches', icon: Sparkles, badge: '22 Factors' },
    { name: 'Saved', path: '/saved', icon: Bookmark },
    { name: 'Messages', path: '/messages', icon: MessageSquare },
    { name: 'Owner Hub', path: '/owner/dashboard', icon: Home },
  ];

  return (
    <header className="sticky top-0 z-50 glass-nav border-b border-black/[0.05] transition-all duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-sm group-hover:bg-brand-700 transition-colors">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 32 32">
                <path d="M16 6L7 13.5V25C7 25.5523 7.44772 26 8 26H13V19C13 18.4477 13.4477 18 14 18H18C18.5523 18 19 18.4477 19 19V26H24C24.5523 26 25 25.5523 25 25V13.5L16 6Z"/>
                <circle cx="23" cy="9" r="4" fill="#99F6E4"/>
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-lg tracking-tight text-ink-primary flex items-center gap-1.5">
                RoomSync
                <span className="text-[10px] font-medium bg-brand-50 text-brand-700 px-1.5 py-0.2 rounded-md border border-brand-200/50">Beta</span>
              </span>
              <span className="text-[10px] text-ink-tertiary -mt-1 hidden sm:inline">22-Factor Living Synergy</span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.path}
                  to={link.path}
                  className={({ isActive }) =>
                    `px-3.5 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 ${
                      isActive
                        ? 'text-brand-700 bg-brand-50/80 font-semibold'
                        : 'text-ink-secondary hover:text-ink-primary hover:bg-surface-100'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 opacity-75" />
                  <span>{link.name}</span>
                  {link.badge && (
                    <span className="text-[10px] bg-brand-100/80 text-brand-800 font-semibold px-1.5 py-0.5 rounded-full">
                      {link.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link to="/owner/listings/new">
              <Button variant="secondary" size="sm" icon={PlusCircle}>
                List Room
              </Button>
            </Link>

            <Link to="/onboarding">
              <Button variant="outline" size="sm">
                Set Preferences
              </Button>
            </Link>

            <Link to="/login">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>

            <Link to="/profile" className="p-1.5 rounded-xl hover:bg-surface-100 text-ink-secondary hover:text-ink-primary transition-colors">
              <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-800 flex items-center justify-center font-medium text-xs">
                SS
              </div>
            </Link>
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="flex md:hidden items-center gap-2">
            <Link to="/onboarding">
              <Button variant="primary" size="sm">
                Preferences
              </Button>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-ink-secondary hover:text-ink-primary hover:bg-surface-100 transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-black/[0.05] bg-surface-50 px-4 pt-3 pb-6 space-y-2 animate-fadeIn">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium ${
                    isActive ? 'text-brand-700 bg-brand-50' : 'text-ink-primary hover:bg-surface-100'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 text-ink-secondary" />
                  <span>{link.name}</span>
                </div>
                {link.badge && (
                  <span className="text-xs bg-brand-100 text-brand-800 px-2 py-0.5 rounded-full">
                    {link.badge}
                  </span>
                )}
              </NavLink>
            );
          })}

          <div className="pt-4 border-t border-surface-200/80 flex flex-col gap-2">
            <Link to="/owner/listings/new" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="secondary" className="w-full justify-center" icon={PlusCircle}>
                List a Room (Owner)
              </Button>
            </Link>
            <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="ghost" className="w-full justify-center">
                Sign In
              </Button>
            </Link>
            <Link to="/signup" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="primary" className="w-full justify-center">
                Create Account
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
