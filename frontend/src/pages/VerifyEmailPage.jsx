import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, CheckCircle2, AlertCircle, Loader2, ArrowRight, Mail, KeyRound } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { verifyEmailApi, resendVerificationApi } from '../services/api';

export const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  const [loading, setLoading] = useState(Boolean(token));
  const [success, setSuccess] = useState(false);
  const [alreadyVerified, setAlreadyVerified] = useState(false);
  const [errorMessage, setErrorMessage] = useState(token ? null : 'Missing email verification token.');
  const [resendEmail, setResendEmail] = useState('');
  const [resending, setResending] = useState(false);
  const [resendStatus, setResendStatus] = useState(null);

  const hasRequested = useRef(false);

  useEffect(() => {
    if (!token || hasRequested.current) return;
    hasRequested.current = true;

    async function verify() {
      try {
        setLoading(true);
        const res = await verifyEmailApi(token);
        setSuccess(true);
        if (res?.alreadyVerified) {
          setAlreadyVerified(true);
        }
        setErrorMessage(null);
      } catch (err) {
        if (
          err.code === 'TOKEN_ALREADY_USED' ||
          (err.message && err.message.toLowerCase().includes('already been used'))
        ) {
          // Token was already consumed (e.g. user already clicked or reloaded the link)
          setSuccess(true);
          setAlreadyVerified(true);
          setErrorMessage(null);
        } else {
          setErrorMessage(
            err.message || 'This verification link is invalid, expired, or has already been used.'
          );
        }
      } finally {
        setLoading(false);
      }
    }

    verify();
  }, [token]);

  const handleResend = async (e) => {
    e.preventDefault();
    if (!resendEmail.trim()) return;

    try {
      setResending(true);
      setResendStatus(null);
      await resendVerificationApi(resendEmail.trim());
      setResendStatus({
        type: 'success',
        message: 'A fresh verification link has been dispatched to your email address.',
      });
    } catch (err) {
      setResendStatus({
        type: 'error',
        message: err.message || 'Could not resend verification email.',
      });
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md p-8 sm:p-10 shadow-apple bg-white rounded-3xl border border-black/[0.06]">
        
        {/* Header Icon */}
        <div className="w-12 h-12 rounded-2xl bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-700 mx-auto mb-6">
          <ShieldCheck className="w-6 h-6" />
        </div>

        <div className="text-center mb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-ink-primary">
            Email Verification
          </h1>
          <p className="text-xs text-ink-secondary mt-1.5 leading-relaxed">
            RoomSync Verified Resident &amp; Shared Rental Network
          </p>
        </div>

        {loading ? (
          <div className="py-8 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-brand-600 animate-spin mx-auto" />
            <p className="text-xs text-ink-secondary">Verifying your email address with RoomSync security...</p>
          </div>
        ) : success ? (
          <div className="space-y-6 text-center animate-fadeIn">
            <div className="p-5 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-900 flex flex-col items-center gap-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 shrink-0" />
              <div className="space-y-1">
                <span className="font-semibold block text-sm text-emerald-950">
                  {alreadyVerified ? 'Email Already Verified!' : 'Email Successfully Verified!'}
                </span>
                <p className="text-emerald-800 leading-relaxed text-xs">
                  Your RoomSync account is verified and fully active. You have full access to roommate matching, direct landlord chats, and password recovery privileges.
                </p>
              </div>
            </div>

            <div className="space-y-2.5">
              <Button
                variant="primary"
                className="w-full justify-center"
                icon={ArrowRight}
                iconPosition="right"
                onClick={() => navigate('/login')}
              >
                Sign In to Your Account
              </Button>

              <Button
                variant="outline"
                className="w-full justify-center text-xs"
                icon={KeyRound}
                onClick={() => navigate('/forgot-password')}
              >
                Forgot Password? Reset Here
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1.5 flex-1">
                <span className="font-semibold block">Verification Notice</span>
                <p>{errorMessage}</p>
                <div className="pt-1.5 flex flex-wrap gap-3">
                  <Link to="/login" className="text-brand-700 hover:text-brand-800 font-semibold underline">
                    Go to Sign In &rarr;
                  </Link>
                  <Link to="/forgot-password" className="text-brand-700 hover:text-brand-800 font-semibold underline">
                    Reset Password &rarr;
                  </Link>
                </div>
              </div>
            </div>

            {/* Resend Verification Form */}
            <form onSubmit={handleResend} className="space-y-3 pt-2">
              <label className="block text-xs font-medium text-ink-primary">
                Need a new verification link? Enter your email:
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-ink-tertiary absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  required
                  placeholder="name@domain.com"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-surface-300 text-xs text-ink-primary focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 transition-all bg-surface-50/50"
                  disabled={resending}
                />
              </div>

              {resendStatus && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    resendStatus.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  {resendStatus.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  )}
                  <span>{resendStatus.message}</span>
                </div>
              )}

              <Button
                type="submit"
                variant="outline"
                className="w-full justify-center text-xs"
                disabled={resending}
              >
                {resending ? 'Sending Link...' : 'Resend Verification Email'}
              </Button>
            </form>

            <div className="text-center pt-2">
              <Link to="/login" className="text-xs text-ink-secondary hover:text-brand-700 font-medium">
                Back to Login
              </Link>
            </div>
          </div>
        )}

      </Card>
    </div>
  );
};

export default VerifyEmailPage;
