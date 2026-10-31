import React, { useState, useEffect } from 'react';
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
  Edit3,
  Loader2
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { CompatibilityBadge } from '../components/ui/CompatibilityBadge';
import { MOCK_ROOMS } from '../data/mockRooms';
import { fetchMyListings, fetchMyVisitsApi, updateVisitStatusApi } from '../services/api';

export const OwnerDashboardPage = () => {
  const [listings, setListings] = useState([]);
  const [loadingListings, setLoadingListings] = useState(true);
  const [visits, setVisits] = useState([]);
  const [loadingVisits, setLoadingVisits] = useState(true);
  const [updatingVisitId, setUpdatingVisitId] = useState(null);
  const [visitActionNotice, setVisitActionNotice] = useState(null);

  const loadVisits = () => {
    setLoadingVisits(true);
    fetchMyVisitsApi('owner')
      .then((data) => {
        setVisits(data || []);
        setLoadingVisits(false);
      })
      .catch((err) => {
        console.warn('Could not load owner visits:', err.message);
        setLoadingVisits(false);
      });
  };

  useEffect(() => {
    let isMounted = true;
    fetchMyListings()
      .then((data) => {
        if (isMounted) {
          if (Array.isArray(data) && data.length > 0) {
            setListings(data);
          } else {
            setListings(MOCK_ROOMS.slice(0, 2));
          }
          setLoadingListings(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setListings(MOCK_ROOMS.slice(0, 2));
          setLoadingListings(false);
        }
      });

    loadVisits();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleUpdateVisitStatus = async (visitId, newStatus) => {
    setUpdatingVisitId(visitId);
    setVisitActionNotice(null);
    try {
      await updateVisitStatusApi(visitId, newStatus);
      setVisitActionNotice(
        newStatus === 'Accepted'
          ? 'Visit request accepted! Exact property address and Google Maps link are now unlocked for this seeker.'
          : 'Visit request marked as rejected.'
      );
      loadVisits();
    } catch (err) {
      alert(`Could not update visit request: ${err.message}`);
    } finally {
      setUpdatingVisitId(null);
    }
  };

  const pendingVisitsCount = visits.filter((v) => v.status === 'Pending').length;
  const acceptedVisitsCount = visits.filter((v) => v.status === 'Accepted').length;

  const stats = [
    { label: 'Active Listings', value: String(listings.length || 0), icon: Home, trend: 'Andheri, Mumbai' },
    { label: 'Pending Visits', value: String(pendingVisitsCount), icon: Clock, trend: `${pendingVisitsCount} await decision` },
    { label: 'Confirmed Visits', value: String(acceptedVisitsCount), icon: Calendar, trend: 'Unlocked map locations' },
    { label: 'Location Privacy', value: 'Protected', icon: ShieldCheck, trend: 'Hidden until approved' },
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
          <span className="text-xs text-ink-secondary">{listings.length} active listing{listings.length === 1 ? '' : 's'}</span>
        </div>

        {loadingListings ? (
          <div className="py-12 text-center bg-white rounded-2xl border border-surface-200">
            <Loader2 className="w-6 h-6 text-brand-600 animate-spin mx-auto mb-2" />
            <p className="text-xs text-ink-secondary">Loading your properties...</p>
          </div>
        ) : listings.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-surface-300">
            <Home className="w-10 h-10 text-ink-tertiary mx-auto mb-3" />
            <h3 className="font-semibold text-sm text-ink-primary">No properties listed yet</h3>
            <p className="text-xs text-ink-secondary mt-1">Publish your first room to start screening compatible flatmates.</p>
            <Link to="/owner/listings/new" className="inline-block mt-4">
              <Button variant="primary" size="sm" icon={PlusCircle}>
                Publish a Room
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {listings.map((room) => (
              <Card key={room.id} className="overflow-hidden bg-white p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant="emerald" size="sm">Active Listing</Badge>
                    <span className="text-xs text-ink-tertiary">Verified Host Space</span>
                  </div>
                  <div className="flex gap-4">
                    <img
                      src={
                        room.images && room.images.length > 0
                          ? room.images[0]
                          : 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=600&q=80'
                      }
                      alt={room.title}
                      className="w-24 h-24 rounded-xl object-cover shrink-0 bg-surface-100"
                    />
                    <div>
                      <h3 className="font-semibold text-sm text-ink-primary line-clamp-1">{room.title}</h3>
                      <p className="text-xs text-ink-secondary mt-0.5">{room.locality}, {room.city}</p>
                      <div className="text-sm font-semibold text-brand-700 mt-2">
                        ₹{(room.rent || 0).toLocaleString('en-IN')}<span className="text-xs font-normal text-ink-tertiary">/mo</span>
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
        )}
      </div>

      {/* Visit Action Notice Banner */}
      {visitActionNotice && (
        <div className="mb-8 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between shadow-subtle animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{visitActionNotice}</span>
          </div>
          <button 
            onClick={() => setVisitActionNotice(null)}
            className="text-xs text-emerald-700 hover:text-emerald-900 underline ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Incoming Visit Requests Section */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-ink-primary flex items-center gap-2">
              <Calendar className="w-5 h-5 text-brand-600" />
              Incoming Visit & Walkthrough Requests
            </h2>
            <p className="text-xs text-ink-secondary mt-0.5">
              Review and approve in-person visits. Accepting unlocks your exact address & Google Maps link for the seeker.
            </p>
          </div>
          <span className="text-xs font-medium text-ink-secondary">
            {visits.length} request{visits.length === 1 ? '' : 's'} total
          </span>
        </div>

        {loadingVisits ? (
          <div className="py-8 text-center bg-white rounded-2xl border border-surface-200">
            <Loader2 className="w-5 h-5 text-brand-600 animate-spin mx-auto mb-2" />
            <p className="text-xs text-ink-secondary">Loading visit requests...</p>
          </div>
        ) : visits.length === 0 ? (
          <div className="p-6 text-center bg-white rounded-2xl border border-dashed border-surface-300">
            <Calendar className="w-8 h-8 text-ink-tertiary mx-auto mb-2" />
            <h3 className="font-semibold text-xs text-ink-primary">No visit requests received yet</h3>
            <p className="text-[11px] text-ink-secondary mt-0.5">
              When seekers request a walkthrough of your Andheri listings, their appointment proposals will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {visits.map((v) => {
              const isUpdating = updatingVisitId === (v.id || v._id);
              const seekerName = v.seeker?.fullName || 'Interested Seeker';
              const seekerPhone = v.seeker?.phone || 'Contact on chat';
              const roomTitle = v.room?.title || 'Listed Property';
              const statusVariant = v.status === 'Accepted' ? 'emerald' : v.status === 'Pending' ? 'amber' : 'neutral';

              return (
                <Card key={v.id || v._id} className="p-4 sm:p-5 bg-white border border-surface-200">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-ink-primary">{seekerName}</span>
                        <Badge variant={statusVariant} size="sm">
                          {v.status}
                        </Badge>
                        <span className="text-xs text-ink-tertiary">· Phone: {seekerPhone}</span>
                      </div>

                      <p className="text-xs text-ink-secondary">
                        <span className="font-medium text-ink-primary">Property:</span> {roomTitle}
                      </p>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-ink-secondary pt-1">
                        <span className="flex items-center gap-1 text-ink-primary font-medium">
                          <Calendar className="w-3.5 h-3.5 text-brand-600" />
                          {v.visitDate}
                        </span>
                        <span className="flex items-center gap-1 text-ink-primary font-medium">
                          <Clock className="w-3.5 h-3.5 text-brand-600" />
                          {v.visitTime}
                        </span>
                      </div>

                      {v.message && (
                        <div className="mt-2 p-2.5 rounded-xl bg-surface-50 border border-surface-200/60 text-xs text-ink-secondary italic">
                          "{v.message}"
                        </div>
                      )}

                      {v.status === 'Accepted' && (
                        <p className="text-[11px] text-emerald-800 font-medium pt-1">
                          ✓ Exact address and Google Maps location have been unlocked for {seekerName}.
                        </p>
                      )}
                    </div>

                    {/* Action Buttons for Landlord */}
                    {v.status === 'Pending' && (
                      <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-surface-200">
                        <Button
                          variant="primary"
                          size="sm"
                          className="bg-emerald-700 hover:bg-emerald-800 text-white"
                          disabled={isUpdating}
                          onClick={() => handleUpdateVisitStatus(v.id || v._id, 'Accepted')}
                        >
                          {isUpdating ? 'Updating...' : 'Accept Visit & Unlock Map'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-rose-600 border-rose-200 hover:bg-rose-50"
                          disabled={isUpdating}
                          onClick={() => handleUpdateVisitStatus(v.id || v._id, 'Rejected')}
                        >
                          Decline
                        </Button>
                      </div>
                    )}

                    {v.status === 'Accepted' && (
                      <div className="shrink-0">
                        <Link to={`/rooms/${v.room?._id || v.room?.id || v.room}`}>
                          <Button variant="secondary" size="sm" icon={Eye}>
                            View Listing
                          </Button>
                        </Link>
                      </div>
                    )}

                  </div>
                </Card>
              );
            })}
          </div>
        )}
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
