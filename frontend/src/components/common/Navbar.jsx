import React, { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { 
  Home, 
  Menu, 
  X, 
  User, 
  Bookmark, 
  MessageSquare, 
  LogOut, 
  ChevronDown, 
  PlusCircle, 
  ShieldCheck,
  Building
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setDropdownOpen(false);
    setMobileMenuOpen(false);
    logout();
    navigate('/login');
  };

  const navLinks = [
    { name: 'Explore', path: '/explore' },
    { name: 'Matches', path: '/matches' },
    { name: 'Saved', path: '/saved' },
    { name: 'Messages', path: '/messages' },
    { name: 'Owner Hub', path: '/owner/dashboard' },
  ];

  // Helper for user initials
  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-50 bg-ivory/95 backdrop-blur-md border-b border-surface-200 transition-all duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Left: Brand */}
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

          {/* Center: Nav Links */}
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

          {/* Right: Actions & User Dropdown */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/owner/listings/new"
              className="inline-flex items-center gap-1.5 text-xs font-medium px-3.5 py-1.5 rounded-full border border-surface-200 bg-white hover:bg-surface-50 text-ink-primary transition-all duration-150 shadow-2xs hover:border-surface-300"
            >
              <PlusCircle className="w-3.5 h-3.5 text-brand-600" />
              <span>List a room</span>
            </Link>

            {isAuthenticated && user ? (
              /* Authenticated User Menu */
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-full hover:bg-surface-100 transition-colors border border-surface-200/80"
                  aria-expanded={dropdownOpen}
                >
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.fullName}
                      className="w-7 h-7 rounded-full object-cover border border-brand-200"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-brand-100 text-brand-800 text-xs font-semibold flex items-center justify-center border border-brand-200">
                      {getInitials(user.fullName)}
                    </div>
                  )}
                  <span className="text-xs font-medium text-ink-primary max-w-[120px] truncate">
                    {user.fullName}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-ink-secondary" />
                </button>

                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white shadow-apple border border-black/[0.08] py-2 z-50 animate-fadeIn">
                    <div className="px-4 py-2 border-b border-surface-100">
                      <p className="text-xs font-semibold text-ink-primary truncate">{user.fullName}</p>
                      <p className="text-[11px] text-ink-tertiary truncate">{user.email}</p>
                      <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full bg-surface-100 text-ink-secondary font-medium capitalize">
                        {user.role === 'owner' ? 'Property Owner' : 'Room Seeker'}
                      </span>
                    </div>

                    <div className="py-1 text-xs text-ink-secondary">
                      <Link
                        to="/profile"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 hover:bg-surface-50 hover:text-ink-primary transition-colors"
                      >
                        <User className="w-4 h-4 text-ink-tertiary" />
                        <span>My Profile</span>
                      </Link>
                      <Link
                        to="/saved"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 hover:bg-surface-50 hover:text-ink-primary transition-colors"
                      >
                        <Bookmark className="w-4 h-4 text-ink-tertiary" />
                        <span>My Shortlist</span>
                      </Link>
                      <Link
                        to="/messages"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 hover:bg-surface-50 hover:text-ink-primary transition-colors"
                      >
                        <MessageSquare className="w-4 h-4 text-ink-tertiary" />
                        <span>Enquiries & Visits</span>
                      </Link>
                      <Link
                        to="/owner/dashboard"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 hover:bg-surface-50 hover:text-ink-primary transition-colors"
                      >
                        <Building className="w-4 h-4 text-ink-tertiary" />
                        <span>Owner Dashboard</span>
                      </Link>
                    </div>

                    <div className="border-t border-surface-100 pt-1">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 transition-colors text-left font-medium"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Unauthenticated Actions */
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="text-xs font-medium text-ink-secondary hover:text-ink-primary px-3 py-1.5 transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  to="/signup"
                  className="text-xs font-medium text-white bg-brand-600 hover:bg-brand-700 px-3.5 py-1.5 rounded-full transition-all shadow-2xs"
                >
                  Sign up
                </Link>
              </div>
            )}
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
          {isAuthenticated && user && (
            <div className="px-3 py-2.5 mb-2 bg-surface-100/70 rounded-xl flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-800 text-xs font-semibold flex items-center justify-center">
                {getInitials(user.fullName)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-ink-primary truncate">{user.fullName}</p>
                <p className="text-[10px] text-ink-tertiary truncate">{user.email}</p>
              </div>
            </div>
          )}

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

          {isAuthenticated ? (
            <div className="pt-3 border-t border-surface-200 mt-2 space-y-1">
              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-xl text-sm text-ink-primary hover:bg-surface-100"
              >
                My Profile
              </Link>
              <button
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 text-sm text-rose-600 font-medium hover:bg-rose-50 rounded-xl"
              >
                Sign out
              </button>
            </div>
          ) : (
            <div className="pt-3 border-t border-surface-200 mt-2 flex flex-col gap-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2 text-sm text-ink-primary font-medium hover:bg-surface-100 rounded-xl"
              >
                Sign in
              </Link>
              <Link
                to="/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2 text-sm text-white bg-brand-600 hover:bg-brand-700 font-medium rounded-xl"
              >
                Create Account
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
