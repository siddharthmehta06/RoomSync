import React, { useState } from 'react';
import { 
  Star, 
  AlertCircle, 
  ShieldAlert, 
  CheckCircle2, 
  MessageSquare, 
  FileWarning, 
  Clock, 
  UserCheck 
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';

export const ReviewsComplaintsPage = () => {
  const [activeTab, setActiveTab] = useState('reviews');
  const [complaintCategory, setComplaintCategory] = useState('Noise & Quiet Hours');
  const [complaintDesc, setComplaintDesc] = useState('');

  const reviews = [
    {
      id: 1,
      reviewer: 'Kavita Menon',
      room: 'Sunlit Master Bedroom in 3BHK Penthouse',
      role: 'Former Flatmate (8 months)',
      rating: 5,
      date: 'September 2026',
      content: 'Aditya is an exceptionally respectful flatmate. Quiet hours were strictly maintained, kitchen was kept clean, and bills were always settled immediately via Splitwise. Highly recommended!',
      tags: ['Quiet at night', 'Super clean', 'Prompt utility settlement']
    },
    {
      id: 2,
      reviewer: 'Varun Joshi',
      room: 'Minimalist Garden-Facing Room in HSR',
      role: 'Former Flatmate (1 year)',
      rating: 4.8,
      date: 'August 2026',
      content: 'Great stay in HSR Layout. Pooja kept the flat immaculate. Excellent place for anyone working hybrid tech jobs requiring focus.',
      tags: ['Peaceful WFH', 'Strict hygiene']
    }
  ];

  const complaints = [
    {
      id: 'CMP-801',
      category: 'Unsettled Electricity Bill',
      filedAgainst: 'Flatmate #3',
      date: '12 Oct 2026',
      status: 'Resolved via Escrow',
      statusColor: 'emerald',
      resolution: 'Difference reimbursed through token deposit settlement.'
    },
    {
      id: 'CMP-802',
      category: 'Unauthorized Overnight Guests',
      filedAgainst: 'Previous Tenant',
      date: '02 Oct 2026',
      status: 'Warning Issued',
      statusColor: 'amber',
      resolution: 'Host mediated a renewed quiet-hours agreement.'
    }
  ];

  const handleSubmitComplaint = (e) => {
    e.preventDefault();
    alert('Grievance logged! RoomSync moderation team will review the dispute within 24 hours.');
    setComplaintDesc('');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-ink-primary">
          Reviews & Conflict Resolution
        </h1>
        <p className="text-xs text-ink-secondary mt-1">
          Verified tenant ratings and structured grievance resolution for shared flatmates.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-surface-200 mb-8 space-x-6">
        <button
          onClick={() => setActiveTab('reviews')}
          className={`pb-3 text-sm font-semibold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'reviews'
              ? 'border-brand-600 text-brand-700'
              : 'border-transparent text-ink-secondary hover:text-ink-primary'
          }`}
        >
          <Star className="w-4 h-4" />
          <span>Verified Flatmate Reviews</span>
        </button>

        <button
          onClick={() => setActiveTab('complaints')}
          className={`pb-3 text-sm font-semibold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'complaints'
              ? 'border-brand-600 text-brand-700'
              : 'border-transparent text-ink-secondary hover:text-ink-primary'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Dispute & Grievance Log</span>
        </button>
      </div>

      {/* REVIEWS TAB */}
      {activeTab === 'reviews' && (
        <div className="space-y-6">
          {reviews.map((r) => (
            <Card key={r.id} className="p-6 bg-white shadow-subtle space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-base text-ink-primary">{r.reviewer}</h3>
                  <p className="text-xs text-ink-secondary">{r.role} · {r.room}</p>
                </div>
                <div className="flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200/60 text-amber-800 text-xs font-bold">
                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  <span>{r.rating} / 5</span>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed pt-1">
                "{r.content}"
              </p>

              <div className="flex flex-wrap gap-2 pt-2">
                {r.tags.map((t, idx) => (
                  <Badge key={idx} variant="teal" size="sm">{t}</Badge>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* COMPLAINTS TAB */}
      {activeTab === 'complaints' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* File a complaint form (1 col) */}
          <div className="md:col-span-1">
            <Card className="p-6 bg-white shadow-subtle space-y-4">
              <h3 className="font-semibold text-base text-ink-primary flex items-center gap-2">
                <FileWarning className="w-4 h-4 text-brand-600" />
                Lodge Grievance
              </h3>
              <p className="text-xs text-ink-secondary">
                Report contract or lifestyle violations. Mediated confidentially.
              </p>

              <form onSubmit={handleSubmitComplaint} className="space-y-4 pt-1">
                <div>
                  <label className="block text-xs font-medium text-ink-primary mb-1">Violation Category</label>
                  <select
                    value={complaintCategory}
                    onChange={(e) => setComplaintCategory(e.target.value)}
                    className="w-full bg-surface-50 border border-surface-200 text-xs rounded-xl p-2.5 text-ink-primary focus:outline-none focus:border-brand-600"
                  >
                    <option value="Noise & Quiet Hours">Noise & Quiet Hours Breach</option>
                    <option value="Unsettled Utilities">Unpaid Utilities / Rent</option>
                    <option value="Kitchen Hygiene">Kitchen Hygiene Neglect</option>
                    <option value="Unauthorized Guests">Unauthorized Overnight Guests</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-ink-primary mb-1">Details & Context</label>
                  <textarea
                    rows="4"
                    required
                    placeholder="Describe the incident objectively..."
                    value={complaintDesc}
                    onChange={(e) => setComplaintDesc(e.target.value)}
                    className="w-full bg-surface-50 border border-surface-200 text-xs rounded-xl p-2.5 text-ink-primary focus:outline-none focus:border-brand-600"
                  />
                </div>

                <Button type="submit" variant="danger" size="sm" className="w-full justify-center">
                  Submit for Mediation
                </Button>
              </form>
            </Card>
          </div>

          {/* Dispute Log (2 cols) */}
          <div className="md:col-span-2 space-y-4">
            <h3 className="font-semibold text-base text-ink-primary">Resolution Archive</h3>

            {complaints.map((c) => (
              <Card key={c.id} className="p-5 bg-white shadow-subtle space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-ink-primary">{c.id}</span>
                    <span className="text-xs text-ink-secondary">· {c.category}</span>
                  </div>
                  <Badge variant={c.statusColor === 'emerald' ? 'emerald' : 'amber'} size="sm">
                    {c.status}
                  </Badge>
                </div>

                <div className="text-xs text-ink-secondary">
                  <span className="font-medium text-ink-primary">Resolution Summary:</span> {c.resolution}
                </div>

                <div className="text-[11px] text-ink-tertiary pt-1 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>Logged on {c.date}</span>
                </div>
              </Card>
            ))}
          </div>

        </div>
      )}

    </div>
  );
};
