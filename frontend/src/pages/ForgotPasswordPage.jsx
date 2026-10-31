import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle, Loader2, KeyRound } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { forgotPasswordApi } from '../services/api';

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const validateEmail = (val) => {
    const trimmed = val.trim();
    if (!trimmed) {
      return 'Email address cannot be empty. Please enter your email.';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      return 'Please provide a valid email format (e.g., name@domain.com).';
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);

    const validationError = validateEmail(email);
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    const cleanEmail = email.trim().toLowerCase();

    try {
      setLoading(true);
      await forgotPasswordApi(cleanEmail);
      setSubmitted(true);
    } catch (err) {
      // In case of network errors or server exceptions
      setErrorMessage(
        err.message || 'Unable to process your request at this time. Please try again later.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md p-8 sm:p-10 shadow-apple bg-white rounded-3xl border border-black/[0.06]">
        
        {/* RoomSync Branding & Header Icon */}
        <div className="text-center space-y-3 mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 border border-brand-200/60 text-brand-800 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-brand-600 animate-pulse"></span>
            RoomSync Security
          </div>
          
          <div className="w-12 h-12 rounded-2xl bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-700 mx-auto">
            <KeyRound className="w-6 h-6" />
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-ink-primary">
            Forgot Your Password?
          </h1>
          <p className="text-xs text-ink-secondary leading-relaxed max-w-xs mx-auto">
            Enter your registered email address. We will send you a secure link to reset your password.
          </p>
        </div>

        {errorMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2.5 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {submitted ? (
          <div className="space-y-6 animate-fadeIn">
            <div className="p-5 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-900 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-semibold block text-emerald-950 text-sm">
                  Check Your Inbox
                </span>
                <p className="leading-relaxed text-emerald-800">
                  If an account exists with this email address, you will receive a password reset link shortly. Please check your inbox.
                </p>
              </div>
            </div>

            <p className="text-[11px] text-ink-tertiary text-center leading-relaxed">
              Didn't receive an email? Check your spam or promotions folder, or request another link in 15 minutes.
            </p>

            <div className="pt-2">
              <Link to="/login" className="block w-full">
                <Button variant="outline" className="w-full justify-center" icon={ArrowLeft}>
                  Back to Login
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div>
              <label htmlFor="reset-email" className="block text-xs font-medium text-ink-primary mb-1.5">
                Registered Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-ink-tertiary absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="reset-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="name@domain.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-surface-300 text-xs text-ink-primary focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 transition-all bg-surface-50/50"
                  disabled={loading}
                  autoComplete="email"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full justify-center"
              icon={loading ? Loader2 : null}
              disabled={loading}
            >
              {loading ? 'Sending Reset Link...' : 'Send Reset Link'}
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
        )}

      </Card>
    </div>
  );
};

export default ForgotPasswordPage;
