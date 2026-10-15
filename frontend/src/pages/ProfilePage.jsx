import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  User, 
  ShieldCheck, 
  SlidersHorizontal, 
  Mail, 
  Phone, 
  Building, 
  Key, 
  Bell, 
  Moon, 
  CheckCircle2,
  Clock,
  Volume2
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';

export const ProfilePage = () => {
  const [user, setUser] = useState({
    name: 'Shiva S.',
    email: 'shiva@example.com',
    phone: '+91 98765 43210',
    role: 'Room Seeker',
    company: 'Tech Professional / Student',
    city: 'Bengaluru',
    verified: true,
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-ink-primary">Profile & Preferences</h1>
          <p className="text-xs text-ink-secondary mt-1">Manage your identity, verification documents, and lifestyle parameters.</p>
        </div>
        <Link to="/onboarding">
          <Button variant="primary" size="sm" icon={SlidersHorizontal}>
            Update 22 Factors
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Column: Identity & Status */}
        <div className="space-y-6">
          <Card className="p-6 bg-white text-center">
            <div className="w-20 h-20 rounded-full bg-brand-100 text-brand-800 text-2xl font-bold flex items-center justify-center mx-auto mb-4 border-2 border-brand-200">
              SS
            </div>
            <h2 className="text-lg font-semibold text-ink-primary">{user.name}</h2>
            <p className="text-xs text-ink-secondary">{user.company}</p>

            <div className="mt-3 flex justify-center">
              <Badge variant="teal" size="sm" icon={ShieldCheck}>
                Government ID Verified
              </Badge>
            </div>

            <div className="mt-6 pt-4 border-t border-surface-200 space-y-2 text-xs text-left">
              <div className="flex items-center gap-2 text-ink-secondary">
                <Mail className="w-4 h-4 text-ink-tertiary" />
                <span>{user.email}</span>
              </div>
              <div className="flex items-center gap-2 text-ink-secondary">
                <Phone className="w-4 h-4 text-ink-tertiary" />
                <span>{user.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-ink-secondary">
                <Building className="w-4 h-4 text-ink-tertiary" />
                <span>{user.city}, India</span>
              </div>
            </div>
          </Card>

          {/* Verification Badge Info */}
          <Card className="p-5 bg-surface-100 border border-black/[0.05] text-xs text-ink-secondary space-y-2">
            <span className="font-semibold text-ink-primary block">RoomSync Trust Score: 98/100</span>
            <p className="leading-relaxed">
              Your identity and company email are verified. Verified seekers get 3x faster owner responses.
            </p>
          </Card>
        </div>

        {/* Right Column: Lifestyle Snapshot & Account Details */}
        <div className="md:col-span-2 space-y-8">
          
          {/* Current 22-Factor Living Profile Summary */}
          <Card className="p-6 sm:p-8 bg-white shadow-subtle">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-ink-primary">Active Lifestyle Snapshot</h3>
                <p className="text-xs text-ink-secondary">Used by the matching engine to rank eligible rooms.</p>
              </div>
              <Link to="/onboarding">
                <span className="text-xs text-brand-700 font-semibold hover:underline">Edit All</span>
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-surface-50 border border-surface-200">
                <span className="text-ink-tertiary block text-[11px]">Bedtime</span>
                <span className="font-semibold text-ink-primary">11:30 PM (Average)</span>
              </div>
              <div className="p-3 rounded-xl bg-surface-50 border border-surface-200">
                <span className="text-ink-tertiary block text-[11px]">Wake-up</span>
                <span className="font-semibold text-ink-primary">7:30 AM</span>
              </div>
              <div className="p-3 rounded-xl bg-surface-50 border border-surface-200">
                <span className="text-ink-tertiary block text-[11px]">Diet Rule</span>
                <span className="font-semibold text-ink-primary">Flexible / Eggetarian</span>
              </div>
              <div className="p-3 rounded-xl bg-surface-50 border border-surface-200">
                <span className="text-ink-tertiary block text-[11px]">Smoking</span>
                <span className="font-semibold text-ink-primary">Non-Smoker (Strict)</span>
              </div>
              <div className="p-3 rounded-xl bg-surface-50 border border-surface-200">
                <span className="text-ink-tertiary block text-[11px]">Cleanliness</span>
                <span className="font-semibold text-ink-primary">4 / 5 (Daily Maid)</span>
              </div>
              <div className="p-3 rounded-xl bg-surface-50 border border-surface-200">
                <span className="text-ink-tertiary block text-[11px]">WFH Frequency</span>
                <span className="font-semibold text-ink-primary">2 Days / Week</span>
              </div>
            </div>
          </Card>

          {/* Account Settings */}
          <Card className="p-6 sm:p-8 bg-white shadow-subtle space-y-4">
            <h3 className="text-base font-semibold text-ink-primary">Contact Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Full Name" value={user.name} onChange={(e) => setUser({ ...user, name: e.target.value })} />
              <Input label="Email Address" value={user.email} onChange={(e) => setUser({ ...user, email: e.target.value })} />
              <Input label="Phone Number" value={user.phone} onChange={(e) => setUser({ ...user, phone: e.target.value })} />
              <Input label="Designation / University" value={user.company} onChange={(e) => setUser({ ...user, company: e.target.value })} />
            </div>

            <div className="pt-2 flex justify-end">
              <Button variant="primary" size="sm">
                Save Profile Updates
              </Button>
            </div>
          </Card>

        </div>

      </div>

    </div>
  );
};
