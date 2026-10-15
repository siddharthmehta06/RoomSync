import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Home, Menu, X } from 'lucide-react';

export const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: 'Explore', path: '/explore' },
    { name: 'Matches', path: '/matches' },
    { name: 'Saved', path: '/saved' },
    { name: 'Messages', path: '/messages' },
    { name: 'Owner Hub', path: '/owner/dashboard' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-ivory/95 backdrop-blur-md border-b border-surface-200 transition-all duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Left: Brand & Tagline */}
          <Link to="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="w-8 h-8 rounded-lg bg-brand-50 border border-brand-200/80 flex items-center justify-center text-brand-600 transition-transform group-hover:scale-105">
              <Home className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div className="flex items-center">
              <span className="font-semibold text-base sm:text-lg tracking-tight text-ink-primary">
                RoomSync
              </span>
              <span className="hidden sm:inline-block text-xs text-ink-secondary font-normal ml-3 pl-3 border-l border-surface-200">
                Live better, together
              </span>
            </div>
          </Link>

          {/* Center: Clean Nav Links (No clutter/badges) */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    isActive
                      ? 'text-brand-700 font-medium bg-brand-50/70'
                      : 'text-ink-secondary hover:text-ink-primary hover:bg-surface-100/60'
                  }`
                }
              >
                {link.name}
              </NavLink>
            ))}
          </nav>

          {/* Right: Actions */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/owner/listings/new"
              className="inline-flex items-center justify-center text-xs font-medium px-3.5 py-1.5 rounded-full border border-surface-200 bg-white hover:bg-surface-50 text-ink-primary transition-all duration-150 shadow-2xs hover:border-surface-300"
            >
              List a room
            </Link>

            <Link
              to="/login"
              className="text-xs font-medium text-ink-secondary hover:text-ink-primary px-2.5 py-1.5 transition-colors"
            >
              Sign in
            </Link>
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex md:hidden items-center gap-2">
            <Link
              to="/owner/listings/new"
              className="text-xs font-medium px-3 py-1.5 rounded-full border border-surface-200 bg-white text-ink-primary"
            >
              List a room
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-lg text-ink-secondary hover:text-ink-primary hover:bg-surface-100 transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-surface-200 bg-ivory px-4 pt-3 pb-6 space-y-1 animate-fadeIn">
          {navLinks.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-xl text-sm ${
                  isActive
                    ? 'text-brand-700 font-medium bg-brand-50'
                    : 'text-ink-primary hover:bg-surface-100'
                }`
              }
            >
              {link.name}
            </NavLink>
          ))}

          <div className="pt-3 border-t border-surface-200 mt-2 flex flex-col gap-2">
            <Link
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-2 text-sm text-ink-primary font-medium hover:bg-surface-100 rounded-xl"
            >
              Sign in
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
