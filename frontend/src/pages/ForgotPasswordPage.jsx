import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Mail,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  KeyRound,
  ShieldCheck,
  RotateCcw,
  Lock,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import {
  forgotPasswordApi,
  verifyResetOtpApi,
  resetPasswordWithOtpApi,
} from '../services/api';

export const ForgotPasswordPage = () => {
  const navigate = useNavigate();

  // Wizard Step: 1: Email, 2: OTP, 3: New Password, 4: Success
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [tempToken, setTempToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successInfo, setSuccessInfo] = useState(null);

  // Timer & Resend Cooldown
  const [countdown, setCountdown] = useState(0);
  const [attemptsRemaining, setAttemptsRemaining] = useState(5);
  const [devSimulatedOtp, setDevSimulatedOtp] = useState(null);

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  // Step 1: Request OTP
  const handleRequestOtp = async (e) => {
    e?.preventDefault();
    setErrorMessage(null);
    setSuccessInfo(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage('Please enter a valid registered email address.');
      return;
    }

    try {
      setLoading(true);
      const res = await forgotPasswordApi(cleanEmail);

      setStep(2);
      setCountdown(60);
      setAttemptsRemaining(5);

      if (res.devMode?.simulatedOtp) {
        setDevSimulatedOtp(res.devMode.simulatedOtp);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Unable to process your request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify 6-digit OTP
  const handleVerifyOtp = async (e) => {
    e?.preventDefault();
    setErrorMessage(null);

    const cleanOtp = otp.trim();
    if (!cleanOtp || cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
      setErrorMessage('Please enter the 6-digit numerical code sent to your email.');
      return;
    }

    try {
      setLoading(true);
      const data = await verifyResetOtpApi(email.trim(), cleanOtp);
      setTempToken(data.tempToken);
      setStep(3);
    } catch (err) {
      setErrorMessage(err.message || 'Invalid or expired OTP code.');
      if (err.attemptsRemaining !== undefined) {
        setAttemptsRemaining(err.attemptsRemaining);
      }
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Submit New Password
  const handleResetPassword = async (e) => {
    e?.preventDefault();
    setErrorMessage(null);

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password) || !/[!@#$%^&*]/.test(password)) {
      setErrorMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (!@#$%^&*).');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      await resetPasswordWithOtpApi(tempToken, password);
      setStep(4);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to update password. Your reset session may have expired.');
    } finally {
      setLoading(false);
    }
  };

  // Password Strength validation flags
  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*]/.test(password);

  return (
    <div className="min-h-[82vh] flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md p-8 sm:p-10 shadow-apple bg-white border border-black/[0.06] rounded-3xl">
        
        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                s === step
                  ? 'w-8 bg-brand-600'
                  : s < step
                  ? 'w-4 bg-brand-300'
                  : 'w-4 bg-surface-200'
              }`}
            />
          ))}
        </div>

        {/* Header Icon */}
        <div className="w-12 h-12 rounded-2xl bg-brand-50 border border-brand-200/60 flex items-center justify-center text-brand-700 mx-auto mb-5 shadow-2xs">
          {step === 4 ? (
            <CheckCircle2 className="w-6 h-6 text-brand-600" />
          ) : step === 2 ? (
            <ShieldCheck className="w-6 h-6" />
          ) : (
            <KeyRound className="w-6 h-6" />
          )}
        </div>

        {/* Header Title */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-ink-primary">
            {step === 1 && 'Reset Your Password'}
            {step === 2 && 'Enter 6-Digit Code'}
            {step === 3 && 'Create New Password'}
            {step === 4 && 'Password Updated!'}
          </h1>
          <p className="text-xs text-ink-secondary mt-1.5 leading-relaxed">
            {step === 1 && "Enter your registered email address to receive a secure 6-digit OTP verification code."}
            {step === 2 && `We've sent a 6-digit verification code to ${email}. The code expires in 5 minutes.`}
            {step === 3 && 'Choose a strong, secure password for your RoomSync account.'}
            {step === 4 && 'Your password has been securely updated. You can now sign in with your new credentials.'}
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2.5 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {/* Development Simulation Notice */}
        {step === 2 && devSimulatedOtp && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-50/90 border border-amber-200 text-xs text-amber-900 space-y-1">
            <span className="font-semibold block text-[11px] uppercase tracking-wider text-amber-800">
              Local Dev Simulation:
            </span>
            <p className="text-xs text-amber-900 leading-relaxed">
              Your 6-digit OTP is: <strong className="text-base tracking-widest text-ink-primary font-mono bg-white px-2 py-0.5 rounded border border-amber-300 ml-1">{devSimulatedOtp}</strong>
            </p>
          </div>
        )}

        {/* STEP 1: Enter Email */}
        {step === 1 && (
          <form onSubmit={handleRequestOtp} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-ink-primary mb-1.5">
                Registered Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  autoFocus
                  className="w-full px-4 py-3 rounded-xl border border-black/[0.1] text-xs text-ink-primary placeholder:text-ink-tertiary focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 transition-all pl-10"
                />
                <Mail className="w-4 h-4 text-ink-tertiary absolute left-3.5 top-3.5" />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full justify-center"
              disabled={loading}
              icon={loading ? Loader2 : ArrowRight}
            >
              {loading ? 'Sending Code...' : 'Send Verification Code'}
            </Button>

            <div className="text-center pt-2">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-xs text-ink-secondary hover:text-ink-primary transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Sign In</span>
              </Link>
            </div>
          </form>
        )}

        {/* STEP 2: Enter 6-Digit OTP */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-ink-primary mb-1.5">
                6-Digit Verification Code
              </label>
              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                required
                autoFocus
                className="w-full px-4 py-3 text-center tracking-[0.5em] text-xl font-mono rounded-xl border border-black/[0.1] text-ink-primary focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 transition-all"
              />
              <div className="flex items-center justify-between text-[11px] text-ink-secondary mt-2 px-1">
                <span>{attemptsRemaining} attempts remaining</span>
                {countdown > 0 ? (
                  <span className="text-ink-tertiary">Resend in {countdown}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={handleRequestOtp}
                    className="text-brand-600 hover:text-brand-700 font-medium inline-flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Resend Code
                  </button>
                )}
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full justify-center"
              disabled={loading || otp.length !== 6}
              icon={loading ? Loader2 : ArrowRight}
            >
              {loading ? 'Verifying Code...' : 'Verify Code'}
            </Button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-1.5 text-xs text-ink-secondary hover:text-ink-primary transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Change Email Address</span>
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: Enter New Password */}
        {step === 3 && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-ink-primary mb-1.5">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  autoFocus
                  className="w-full px-4 py-3 rounded-xl border border-black/[0.1] text-xs text-ink-primary placeholder:text-ink-tertiary focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 transition-all pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-ink-tertiary hover:text-ink-secondary"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-primary mb-1.5">
                Confirm New Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                className="w-full px-4 py-3 rounded-xl border border-black/[0.1] text-xs text-ink-primary placeholder:text-ink-tertiary focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 transition-all"
              />
            </div>

            {/* Password Strength Checklist */}
            <div className="p-3 bg-surface-50 rounded-xl border border-black/[0.04] space-y-1.5 text-[11px]">
              <span className="font-semibold text-ink-primary block text-[11px] mb-1">
                Password Security Requirements:
              </span>
              <div className="grid grid-cols-2 gap-1 text-ink-secondary">
                <span className={hasMinLength ? 'text-emerald-700 font-medium' : ''}>
                  • Min 8 characters
                </span>
                <span className={hasUpper ? 'text-emerald-700 font-medium' : ''}>
                  • 1 uppercase letter
                </span>
                <span className={hasLower ? 'text-emerald-700 font-medium' : ''}>
                  • 1 lowercase letter
                </span>
                <span className={hasNumber ? 'text-emerald-700 font-medium' : ''}>
                  • 1 number
                </span>
                <span className={hasSpecial ? 'text-emerald-700 font-medium' : ''}>
                  • 1 special char (!@#$)
                </span>
                <span className={password && password === confirmPassword ? 'text-emerald-700 font-medium' : ''}>
                  • Passwords match
                </span>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full justify-center mt-2"
              disabled={loading || !hasMinLength || password !== confirmPassword}
              icon={loading ? Loader2 : Lock}
            >
              {loading ? 'Updating Password...' : 'Save New Password'}
            </Button>
          </form>
        )}

        {/* STEP 4: Success Confirmation */}
        {step === 4 && (
          <div className="space-y-6 text-center animate-fadeIn">
            <div className="p-5 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-emerald-900 text-xs leading-relaxed">
              Your password has been successfully reset. A confirmation security notice has been sent to your email.
            </div>

            <Button
              variant="primary"
              size="lg"
              className="w-full justify-center"
              onClick={() => navigate('/login')}
              icon={ArrowRight}
            >
              Sign In with New Password
            </Button>
          </div>
        )}

      </Card>
    </div>
  );
};

export default ForgotPasswordPage;
