import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Lock, Home, Sparkles, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../context/AuthContext';

export const SignupPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [role, setRole] = useState('seeker');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSignup = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await register({ fullName, email, phone, password, role });
      if (role === 'seeker') {
        navigate('/onboarding');
      } else {
        navigate('/owner/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Please check details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg bg-white rounded-3xl p-8 sm:p-10 border border-black/[0.06] shadow-apple space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-1.5">
          <div className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center mx-auto mb-3 shadow-sm">
            <Sparkles className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-semibold text-ink-primary tracking-tight">Create your RoomSync account</h1>
          <p className="text-xs text-ink-secondary">Join verified flatmates and room owners across India.</p>
        </div>

        {/* Role Choice Cards */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setRole('seeker')}
            className={`p-4 rounded-2xl border text-left transition-all ${
              role === 'seeker'
                ? 'border-brand-600 bg-brand-50/50 ring-2 ring-brand-500/20'
                : 'border-surface-200 hover:border-surface-300 bg-surface-50'
            }`}
          >
            <div className="w-8 h-8 rounded-lg bg-brand-100 text-brand-800 flex items-center justify-center mb-2">
              <User className="w-4 h-4" />
            </div>
            <div className="font-semibold text-sm text-ink-primary">Room Seeker</div>
            <p className="text-[11px] text-ink-secondary mt-0.5">Find a room & compatible flatmates</p>
          </button>

          <button
            type="button"
            onClick={() => setRole('owner')}
            className={`p-4 rounded-2xl border text-left transition-all ${
              role === 'owner'
                ? 'border-brand-600 bg-brand-50/50 ring-2 ring-brand-500/20'
                : 'border-surface-200 hover:border-surface-300 bg-surface-50'
            }`}
          >
            <div className="w-8 h-8 rounded-lg bg-brand-100 text-brand-800 flex items-center justify-center mb-2">
              <Home className="w-4 h-4" />
            </div>
            <div className="font-semibold text-sm text-ink-primary">Room Owner / Host</div>
            <p className="text-[11px] text-ink-secondary mt-0.5">List rooms & screen applicants</p>
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSignup} className="space-y-4">
          <Input
            label="Full Name"
            placeholder="e.g. Priya Sharma"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            icon={User}
            required
          />

          <Input
            label="Work / College Email"
            type="email"
            placeholder="priya@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={Mail}
            required
          />

          <Input
            label="Mobile Number (10 digits)"
            type="tel"
            placeholder="9876543210"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            icon={Phone}
            required
          />

          <Input
            label="Create Secure Password"
            type="password"
            placeholder="At least 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={Lock}
            required
          />

          <div className="text-xs text-ink-secondary leading-relaxed">
            By registering, you agree to RoomSync’s Non-Discrimination Policy, Community Standards, and Tenancy Verification Protocol.
          </div>

          <Button type="submit" variant="primary" className="w-full justify-center" size="md" disabled={loading}>
            {loading 
              ? 'Creating account...' 
              : (role === 'seeker' ? 'Continue to Lifestyle Onboarding' : 'Complete Registration & List Room')}
          </Button>
        </form>

        {/* Footer */}
        <div className="text-center text-xs text-ink-secondary pt-2">
          Already registered?{' '}
          <Link to="/login" className="text-brand-700 font-semibold hover:underline">
            Sign in
          </Link>
        </div>

      </div>
    </div>
  );
};
