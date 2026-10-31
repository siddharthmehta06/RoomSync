import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowRight, ArrowLeft, CheckCircle2, AlertCircle, Loader2, KeyRound } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { forgotPasswordApi } from '../services/api';

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [devResetUrl, setDevResetUrl] = useState(null);
  const [emailDeliveryMode, setEmailDeliveryMode] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMessage('Please enter your registered email address.');
      return;
    }

    try {
      setLoading(true);
      const res = await forgotPasswordApi(cleanEmail);
      
      if (res.devMode?.accountFound === false) {
        setErrorMessage(res.devMode.hint);
        return;
      }

      setSubmitted(true);
      const url = res.resetUrl || res.devMode?.resetUrl;
      if (url) {
        setDevResetUrl(url);
        setEmailDeliveryMode(res.devMode?.emailDeliveryMode || 'development_simulated');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Unable to process your request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md p-8 sm:p-10 shadow-apple bg-white">
        
        {/* Header Icon */}
        <div className="w-12 h-12 rounded-2xl bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-700 mx-auto mb-6">
          <KeyRound className="w-6 h-6" />
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-ink-primary">
            Reset Your Password
          </h1>
          <p className="text-xs text-ink-secondary mt-1.5 leading-relaxed">
            Enter your registered email address and we'll send you a secure link to reset your account password.
          </p>
        </div>

        {errorMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {submitted ? (
          <div className="space-y-6 animate-fadeIn">
            <div className={`p-5 rounded-2xl border text-xs flex items-start gap-3 ${emailDeliveryMode === 'development_simulated' || emailDeliveryMode === 'fallback_logged' ? 'bg-amber-50 border-amber-200 text-amber-950' : 'bg-emerald-50/80 border-emerald-200 text-emerald-900'}`}>
              {emailDeliveryMode === 'development_simulated' || emailDeliveryMode === 'fallback_logged'
                ? <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                : <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />}
              <div className="space-y-1">
                <span className="font-semibold block">
                  Password Reset Link Generated
                </span>
                <p className={`leading-relaxed ${emailDeliveryMode === 'development_simulated' || emailDeliveryMode === 'fallback_logged' ? 'text-amber-800' : 'text-emerald-800'}`}>
                  {emailDeliveryMode === 'development_simulated' || emailDeliveryMode === 'fallback_logged'
                    ? `External email delivery is not configured in local development. Your secure 15-minute reset link has been generated below so you can proceed immediately.`
                    : `If an account with ${email} exists, a 15-minute secure reset link has been dispatched to your email.`}
                </p>
              </div>
            </div>

            {devResetUrl && (
              <div className="p-4 rounded-2xl bg-brand-50/60 border border-brand-200 space-y-3 text-xs">
                <div>
                  <span className="font-semibold text-brand-900 block text-xs">
                    Instant Password Reset Action
                  </span>
                  <p className="text-brand-700 text-[11px] mt-0.5">
                    Click the button below to set your new password immediately:
                  </p>
                </div>
                
                <a
                  href={devResetUrl}
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-brand-600 text-white rounded-xl font-medium text-xs hover:bg-brand-700 transition-colors shadow-sm"
                >
                  <span>Reset Password Now</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>

                <div className="pt-1">
                  <span className="text-[10px] text-ink-tertiary block mb-1">Direct URL:</span>
                  <a
                    href={devResetUrl}
                    className="font-mono text-[10px] text-ink-secondary hover:text-brand-700 underline break-all block p-2 bg-white rounded-lg border border-surface-200"
                  >
                    {devResetUrl}
                  </a>
                </div>
              </div>
            )}

            <div className="pt-2">
              <Link to="/login">
                <Button variant="outline" className="w-full justify-center" icon={ArrowLeft}>
                  Return to Login
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
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
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-surface-300 text-xs text-ink-primary focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 transition-all bg-surface-50/50"
                  disabled={loading}
                />
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
              {loading ? 'Sending Instructions...' : 'Send Reset Link'}
            </Button>

            <div className="text-center pt-2">
              <Link
                to="/login"
                className="text-xs text-ink-secondary hover:text-brand-700 font-medium transition-colors inline-flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
              </Link>
            </div>
          </form>
        )}

      </Card>
    </div>
  );
};
