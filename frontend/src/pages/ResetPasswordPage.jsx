import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2, ArrowRight, ShieldCheck } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { resetPasswordApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const ResetPasswordPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { setToken, setUser } = useAuth();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const isMinLength = password.length >= 6;
  const hasNumber = /[0-9]/.test(password);
  const hasUpper = /[A-Z]/.test(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter.');
      return;
    }

    try {
      setLoading(true);
      const data = await resetPasswordApi(token, password);
      if (data?.token) {
        setToken(data.token);
      }
      if (data?.user) {
        setUser(data.user);
      }
      setSuccess(true);
    } catch (err) {
      setErrorMessage(err.message || 'Password reset token is invalid or has expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md p-8 sm:p-10 shadow-apple bg-white">
        
        {/* Header Icon */}
        <div className="w-12 h-12 rounded-2xl bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-700 mx-auto mb-6">
          <ShieldCheck className="w-6 h-6" />
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-ink-primary">
            Create New Password
          </h1>
          <p className="text-xs text-ink-secondary mt-1.5 leading-relaxed">
            Choose a strong, unique password to secure your RoomSync profile.
          </p>
        </div>

        {errorMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span>{errorMessage}</span>
              {errorMessage.includes('expired') || errorMessage.includes('invalid') ? (
                <div>
                  <Link to="/forgot-password" className="text-brand-700 font-semibold underline block mt-1">
                    Request a new reset link
                  </Link>
                </div>
              ) : null}
            </div>
          </div>
        )}

        {success ? (
          <div className="space-y-6 animate-fadeIn text-center">
            <div className="p-5 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-900 flex flex-col items-center gap-3">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0" />
              <div className="space-y-1">
                <span className="font-semibold block text-sm">Password Successfully Reset</span>
                <p className="text-emerald-800 leading-relaxed text-xs">
                  Your credentials have been updated securely. You are now logged into RoomSync.
                </p>
              </div>
            </div>

            <Button
              variant="primary"
              className="w-full justify-center"
              icon={ArrowRight}
              iconPosition="right"
              onClick={() => navigate('/explore')}
            >
              Continue to Explore
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            
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
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-surface-300 text-xs text-ink-primary focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 transition-all bg-surface-50/50"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-tertiary hover:text-ink-secondary"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password Input */}
            <div>
              <label htmlFor="confirm-password" className="block text-xs font-medium text-ink-primary mb-1.5">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-ink-tertiary absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-surface-300 text-xs text-ink-primary focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 transition-all bg-surface-50/50"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password Requirements Checklist */}
            <div className="p-3.5 rounded-xl bg-surface-50 border border-surface-200 space-y-1.5 text-[11px]">
              <span className="font-semibold text-ink-secondary block mb-1">Password Strength Checklist:</span>
              <div className={`flex items-center gap-1.5 ${isMinLength ? 'text-emerald-700 font-medium' : 'text-ink-tertiary'}`}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>At least 6 characters long</span>
              </div>
              <div className={`flex items-center gap-1.5 ${hasUpper ? 'text-emerald-700 font-medium' : 'text-ink-tertiary'}`}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Contains an uppercase letter</span>
              </div>
              <div className={`flex items-center gap-1.5 ${hasNumber ? 'text-emerald-700 font-medium' : 'text-ink-tertiary'}`}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Contains a number</span>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full justify-center"
              icon={loading ? Loader2 : ArrowRight}
              iconPosition="right"
              disabled={loading}
            >
              {loading ? 'Updating Password...' : 'Save New Password'}
            </Button>

          </form>
        )}

      </Card>
    </div>
  );
};
