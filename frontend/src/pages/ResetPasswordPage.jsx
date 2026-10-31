import React, { useState } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2, ArrowLeft, ArrowRight, ShieldCheck } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { resetPasswordApi } from '../services/api';

export const ResetPasswordPage = () => {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Extract reset token from URL query parameters (?token=...) or path params (/:token)
  const token = searchParams.get('token') || params.token || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Password strength checklist rules
  const isMinLength = password.length >= 6;
  const hasNumber = /[0-9]/.test(password);
  const hasLetter = /[a-zA-Z]/.test(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);

    // 1. Token validation
    if (!token.trim()) {
      setErrorMessage('This password reset link is invalid.');
      return;
    }

    // 2. Field validations (Phase 6)
    if (!password) {
      setErrorMessage('Password cannot be empty.');
      return;
    }

    if (!confirmPassword) {
      setErrorMessage('Confirm Password cannot be empty.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please ensure both fields are identical.');
      return;
    }

    try {
      setLoading(true);
      // Submit original token and new password directly to backend
      // Token is NEVER stored in localStorage or sessionStorage
      await resetPasswordApi(token.trim(), password);
      setSuccess(true);
    } catch (err) {
      const rawMsg = err.message || '';
      // Map error responses cleanly according to Phase 8 specifications
      if (rawMsg.toLowerCase().includes('expired')) {
        setErrorMessage('This password reset link has expired. Please request a new one.');
      } else if (rawMsg.toLowerCase().includes('already been used') || rawMsg.toLowerCase().includes('used')) {
        setErrorMessage('This password reset link has already been used.');
      } else if (rawMsg.toLowerCase().includes('invalid')) {
        setErrorMessage('This password reset link is invalid.');
      } else {
        setErrorMessage(
          rawMsg || 'This password reset link is invalid. Please request a new one.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const isTokenMissing = !token.trim();

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md p-8 sm:p-10 shadow-apple bg-white rounded-3xl border border-black/[0.06]">
        
        {/* Header Branding */}
        <div className="text-center space-y-3 mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 border border-brand-200/60 text-brand-800 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-brand-600"></span>
            RoomSync Security
          </div>

          <div className="w-12 h-12 rounded-2xl bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-700 mx-auto">
            <ShieldCheck className="w-6 h-6" />
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-ink-primary">
            Create New Password
          </h1>
          <p className="text-xs text-ink-secondary leading-relaxed max-w-xs mx-auto">
            Choose a strong, unique password to secure your RoomSync profile.
          </p>
        </div>

        {/* Missing Token Alert */}
        {isTokenMissing && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1.5">
              <span className="font-semibold block">Missing Reset Token</span>
              <p>This password reset link is invalid. Please request a new reset link from the forgot password page.</p>
              <Link to="/forgot-password" className="text-brand-700 font-semibold underline block pt-1">
                Request New Reset Link
              </Link>
            </div>
          </div>
        )}

        {/* Error Notification */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2.5 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1.5 flex-1">
              <span className="leading-relaxed block">{errorMessage}</span>
              {(errorMessage.includes('expired') || errorMessage.includes('already been used') || errorMessage.includes('invalid')) && (
                <div>
                  <Link
                    to="/forgot-password"
                    className="text-brand-700 hover:text-brand-800 font-semibold underline inline-flex items-center gap-1 mt-1"
                  >
                    Request a new reset link &rarr;
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Success State (Phase 8) */}
        {success ? (
          <div className="space-y-6 animate-fadeIn text-center">
            <div className="p-5 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-900 flex flex-col items-center gap-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 shrink-0" />
              <div className="space-y-1">
                <span className="font-semibold block text-sm text-emerald-950">
                  Password Reset Successful
                </span>
                <p className="text-emerald-800 leading-relaxed text-xs">
                  Your password has been reset successfully. You can now log in using your new password.
                </p>
              </div>
            </div>

            <Button
              variant="primary"
              className="w-full justify-center"
              icon={ArrowRight}
              iconPosition="right"
              onClick={() => navigate('/login')}
            >
              Back to Login
            </Button>
          </div>
        ) : (
          !isTokenMissing && (
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              
              {/* New Password Input */}
              <div>
                <label htmlFor="new-password" className="block text-xs font-medium text-ink-primary mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-ink-tertiary absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder="Enter new password (min. 6 characters)"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-surface-300 text-xs text-ink-primary focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 transition-all bg-surface-50/50"
                    disabled={loading}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-tertiary hover:text-ink-secondary p-1"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password Input */}
              <div>
                <label htmlFor="confirm-new-password" className="block text-xs font-medium text-ink-primary mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-ink-tertiary absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="confirm-new-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder="Confirm new password"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-surface-300 text-xs text-ink-primary focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 transition-all bg-surface-50/50"
                    disabled={loading}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-tertiary hover:text-ink-secondary p-1"
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Password Requirements Guide */}
              <div className="p-3.5 rounded-2xl bg-surface-50 border border-surface-200/80 space-y-1.5 text-[11px]">
                <span className="font-semibold text-ink-secondary block mb-1">
                  Password Requirements:
                </span>
                <div className={`flex items-center gap-1.5 ${isMinLength ? 'text-emerald-700 font-medium' : 'text-ink-tertiary'}`}>
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>At least 6 characters long</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasLetter && hasNumber ? 'text-emerald-700 font-medium' : 'text-ink-tertiary'}`}>
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Contains both letters and numbers</span>
                </div>
              </div>

              {/* Action Buttons */}
              <Button
                type="submit"
                variant="primary"
                className="w-full justify-center"
                icon={loading ? Loader2 : null}
                disabled={loading}
              >
                {loading ? 'Resetting Password...' : 'Reset Password'}
              </Button>

              <div className="text-center pt-2">
                <Link
                  to="/login"
                  className="text-xs text-ink-secondary hover:text-brand-700 font-medium transition-colors inline-flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
                </Link>
              </div>

            </form>
          )
        )}

      </Card>
    </div>
  );
};

export default ResetPasswordPage;
