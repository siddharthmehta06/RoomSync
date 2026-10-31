import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Mail, ArrowRight, UserCheck, Shield, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { loginUser, loginDemoUser } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const LoginPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, refreshUser } = useAuth();
  const [role, setRole] = useState('seeker');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await login(email, password);
      const userRole = data.user?.role || role;
      const redirect = searchParams.get('redirect');

      if (userRole === 'owner') {
        navigate('/owner/dashboard');
      } else {
        // Room seekers land on Explore by default
        if (redirect && !redirect.startsWith('/matches') && !redirect.startsWith('/dashboard')) {
          navigate(redirect);
        } else {
          navigate('/explore');
        }
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (selectedRole) => {
    setRole(selectedRole);
    setError(null);
    setLoading(true);

    try {
      const data = await loginDemoUser(selectedRole);
      await refreshUser();
      if (selectedRole === 'owner') {
        navigate('/owner/dashboard');
      } else {
        // Demo seekers land on Explore by default
        navigate('/explore');
      }
    } catch (err) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-black/[0.06] shadow-apple space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-1.5">
          <div className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center mx-auto mb-3 shadow-sm">
            <Lock className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-semibold text-ink-primary tracking-tight">Sign in to RoomSync</h1>
          <p className="text-xs text-ink-secondary">Access your compatibility matches and verified flatmate conversations.</p>
        </div>

        {/* Role Selector Tabs */}
        <div className="bg-surface-100 p-1 rounded-xl flex">
          <button
            type="button"
            onClick={() => setRole('seeker')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${
              role === 'seeker' ? 'bg-white text-ink-primary shadow-2xs font-semibold' : 'text-ink-secondary hover:text-ink-primary'
            }`}
          >
            Room Seeker
          </button>
          <button
            type="button"
            onClick={() => setRole('owner')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${
              role === 'owner' ? 'bg-white text-ink-primary shadow-2xs font-semibold' : 'text-ink-secondary hover:text-ink-primary'
            }`}
          >
            Room Owner / Host
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            placeholder="you@domain.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={Mail}
            required
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={Lock}
            required
          />

          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center gap-2 cursor-pointer text-ink-secondary">
              <input type="checkbox" className="rounded text-brand-600 focus:ring-brand-500" defaultChecked />
              <span>Remember me</span>
            </label>
            <Link to="/forgot-password" className="text-brand-700 hover:underline font-medium">Forgot password?</Link>
          </div>

          <Button type="submit" variant="primary" className="w-full justify-center" size="md" disabled={loading}>
            {loading ? 'Signing in...' : `Sign In as ${role === 'seeker' ? 'Seeker' : 'Owner'}`}
          </Button>
        </form>

        {/* Quick Demo Logins for Beginners */}
        <div className="pt-4 border-t border-surface-200">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-tertiary text-center mb-3">
            Quick Demo Access (One-Click)
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={() => handleDemoLogin('seeker')}
              className="text-xs"
            >
              Demo Seeker
            </Button>
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={() => handleDemoLogin('owner')}
              className="text-xs"
            >
              Demo Owner
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-ink-secondary">
          Don't have an account yet?{' '}
          <Link to="/signup" className="text-brand-700 font-semibold hover:underline">
            Create account
          </Link>
        </div>

      </div>
    </div>
  );
};
