import React from 'react';
import { Link } from 'react-router-dom';
import { 
  PlusCircle, 
  Home, 
  MessageSquare, 
  Calendar, 
  Eye, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  ChevronRight,
  ShieldCheck,
  Edit3
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { CompatibilityBadge } from '../components/ui/CompatibilityBadge';
import { MOCK_ROOMS } from '../data/mockRooms';

export const OwnerDashboardPage = () => {
  const stats = [
    { label: 'Active Listings', value: '2', icon: Home, trend: '+1 this month' },
    { label: 'Seeker Enquiries', value: '18', icon: MessageSquare, trend: '4 pending reply' },
    { label: 'Scheduled Visits', value: '5', icon: Calendar, trend: '2 this weekend' },
    { label: 'Avg Compatibility', value: '89%', icon: TrendingUp, trend: 'High match quality' },
  ];

  const recentEnquiries = [
    {
      id: 'enq-1',
      seekerName: 'Priya Sharma',
      seekerRole: 'Frontend Engineer at Flipkart',
      roomTitle: 'Sunlit Master Bedroom in 3BHK Penthouse',
      compatibilityScore: 94,
      date: 'Today, 2:30 PM',
      status: 'Awaiting Response',
    },
    {
      id: 'enq-2',
      seekerName: 'Anand Verma',
      seekerRole: 'Analyst at Goldman Sachs',
      roomTitle: 'Minimalist Garden-Facing Room in HSR Sector 2',
      compatibilityScore: 82,
      date: 'Yesterday',
      status: 'Visit Scheduled',
    },
    {
      id: 'enq-3',
      seekerName: 'Neha Rao',
      seekerRole: 'Product Designer at Swiggy',
      roomTitle: 'Sunlit Master Bedroom in 3BHK Penthouse',
      compatibilityScore: 91,
      date: '2 days ago',
      status: 'Chat Ongoing',
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-brand-50 border border-brand-200/60 text-brand-800 text-xs font-medium mb-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-brand-600" />
            <span>Verified Owner Portal</span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-ink-primary">
            Host & Flatmate Dashboard
          </h1>
          <p className="text-xs text-ink-secondary mt-1">
            Manage your room listings, screen applicant compatibility, and coordinate flat visits.
          </p>
        </div>

        <Link to="/owner/listings/new">
          <Button variant="primary" size="md" icon={PlusCircle}>
            Create New Listing
          </Button>
        </Link>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s, idx) => {
          const Icon = s.icon;
          return (
            <Card key={idx} className="p-5 bg-white">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-ink-secondary">{s.label}</span>
                <div className="w-8 h-8 rounded-lg bg-surface-100 flex items-center justify-center text-brand-700">
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-ink-primary">{s.value}</div>
              <p className="text-[11px] text-ink-tertiary mt-1">{s.trend}</p>
            </Card>
          );
        })}
      </div>

      {/* Managed Listings Section */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-ink-primary">Your Listed Rooms</h2>
          <span className="text-xs text-ink-secondary">2 active listings</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {MOCK_ROOMS.slice(0, 2).map((room) => (
            <Card key={room.id} className="overflow-hidden bg-white p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Badge variant="emerald" size="sm">Active Listing</Badge>
                  <span className="text-xs text-ink-tertiary">14 applicants screened</span>
                </div>
                <div className="flex gap-4">
                  <img
                    src={room.images[0]}
                    alt={room.title}
                    className="w-24 h-24 rounded-xl object-cover shrink-0"
                  />
                  <div>
                    <h3 className="font-semibold text-sm text-ink-primary line-clamp-1">{room.title}</h3>
                    <p className="text-xs text-ink-secondary mt-0.5">{room.locality}, {room.city}</p>
                    <div className="text-sm font-semibold text-brand-700 mt-2">
                      ₹{room.rent.toLocaleString('en-IN')}<span className="text-xs font-normal text-ink-tertiary">/mo</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-surface-200 flex items-center justify-between">
                <Link to={`/rooms/${room.id}`}>
                  <Button variant="ghost" size="sm" icon={Eye}>
                    Preview
                  </Button>
                </Link>
                <Link to={`/owner/listings/${room.id}/edit`}>
                  <Button variant="secondary" size="sm" icon={Edit3}>
                    Edit Rules & Specs
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Applicant Enquiries */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-ink-primary">Recent Applicant Inquiries</h2>
          <Link to="/messages" className="text-xs text-brand-700 font-semibold hover:underline">
            View All Conversations
          </Link>
        </div>

        <Card className="bg-white overflow-hidden">
          <div className="divide-y divide-surface-200">
            {recentEnquiries.map((enq) => (
              <div key={enq.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-surface-50/60 transition-colors">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-800 flex items-center justify-center font-bold text-sm">
                    {enq.seekerName.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-ink-primary">{enq.seekerName}</span>
                      <CompatibilityBadge score={enq.compatibilityScore} size="sm" />
                    </div>
                    <p className="text-xs text-ink-secondary mt-0.5">{enq.seekerRole}</p>
                    <p className="text-[11px] text-ink-tertiary mt-0.5">Applied for: {enq.roomTitle}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-surface-200">
                  <Badge variant={enq.status === 'Awaiting Response' ? 'amber' : 'neutral'} size="sm">
                    {enq.status}
                  </Badge>
                  <Link to="/messages">
                    <Button variant="secondary" size="sm" icon={MessageSquare}>
                      Chat
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

    </div>
  );
};
