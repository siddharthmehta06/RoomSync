import React, { useState } from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  MessageSquare, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  MapPin, 
  ShieldCheck 
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { createVisitRequestApi } from '../../services/api';

export const RequestVisitModal = ({ isOpen, onClose, room, owner, onVisitCreated }) => {
  if (!isOpen || !room) return null;

  // Default to tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = new Date().toISOString().split('T')[0];
  const defaultDate = tomorrow.toISOString().split('T')[0];

  const [visitDate, setVisitDate] = useState(defaultDate);
  const [visitTime, setVisitTime] = useState('11:00 AM - 12:00 PM');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const timeSlots = [
    '09:00 AM - 10:00 AM',
    '10:00 AM - 11:00 AM',
    '11:00 AM - 12:00 PM',
    '02:00 PM - 03:00 PM',
    '04:00 PM - 05:00 PM',
    '05:30 PM - 06:30 PM',
    '07:00 PM - 08:00 PM',
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!visitDate) {
      setErrorMessage('Please pick a preferred visit date.');
      return;
    }

    const selectedDateTime = new Date(visitDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDateTime.getTime() < today.getTime()) {
      setErrorMessage('Visit date cannot be in the past.');
      return;
    }

    if (!visitTime) {
      setErrorMessage('Please select a preferred time slot.');
      return;
    }

    try {
      setLoading(true);
      const res = await createVisitRequestApi({
        roomId: room._id || room.id,
        visitDate,
        visitTime,
        message: message.trim(),
      });

      setSuccess(true);
      if (onVisitCreated) {
        onVisitCreated(res);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to submit visit request.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSuccess(false);
    setErrorMessage(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
      <div 
        className="w-full max-w-lg bg-white rounded-3xl shadow-apple border border-black/[0.08] overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-surface-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-700">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-ink-primary">Schedule Property Visit</h3>
              <p className="text-[11px] text-ink-secondary">In-person residential inspection</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-ink-tertiary hover:text-ink-primary hover:bg-surface-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Selected Room Summary */}
          <div className="p-4 rounded-2xl bg-surface-50 border border-surface-200 flex items-center gap-3.5">
            {room.images && room.images.length > 0 ? (
              <img
                src={room.images[0]}
                alt={room.title}
                className="w-16 h-16 rounded-xl object-cover shrink-0 border border-surface-200"
              />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-surface-200 shrink-0" />
            )}
            <div className="min-w-0 flex-1">
              <h4 className="font-semibold text-xs text-ink-primary line-clamp-1">{room.title}</h4>
              <div className="flex items-center gap-1.5 text-[11px] text-ink-secondary mt-0.5">
                <MapPin className="w-3 h-3 text-brand-600 shrink-0" />
                <span className="truncate">{room.locality}, {room.city}</span>
              </div>
              <div className="text-xs font-bold text-brand-700 mt-1">
                ₹{Number(room.rent).toLocaleString('en-IN')}<span className="text-[10px] font-normal text-ink-tertiary"> / month</span>
              </div>
            </div>
          </div>

          {/* Owner Profile Preview */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-brand-50/50 border border-brand-100 text-xs">
            <div className="flex items-center gap-2.5">
              {owner?.avatar ? (
                <img
                  src={owner.avatar}
                  alt={owner.fullName || owner.name}
                  className="w-8 h-8 rounded-full object-cover border border-brand-200"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-800 font-semibold flex items-center justify-center text-xs">
                  {(owner?.fullName || owner?.name || 'O')[0]}
                </div>
              )}
              <div>
                <span className="font-semibold text-ink-primary block">{owner?.fullName || owner?.name || 'Property Owner'}</span>
                <span className="text-[10px] text-ink-secondary">Owner / Landlord</span>
              </div>
            </div>
            {owner?.isVerified && (
              <Badge variant="teal" size="sm" className="gap-1">
                <ShieldCheck className="w-3 h-3" />
                Verified
              </Badge>
            )}
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {success ? (
            <div className="text-center py-6 space-y-4 animate-fadeIn">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-semibold text-ink-primary">Visit Request Submitted!</h4>
                <p className="text-xs text-ink-secondary mt-1 leading-relaxed max-w-sm mx-auto">
                  The property owner has been notified. You can track this request on your dashboard. Once accepted, the precise Google Maps link will be unlocked.
                </p>
              </div>
              <div className="pt-2">
                <Button variant="primary" size="sm" onClick={handleClose}>
                  Done
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Date Input */}
              <div>
                <label className="block text-xs font-medium text-ink-primary mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-brand-600" />
                  Preferred Visit Date
                </label>
                <input
                  type="date"
                  required
                  min={minDate}
                  value={visitDate}
                  onChange={(e) => setVisitDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-surface-300 text-xs text-ink-primary bg-surface-50 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              {/* Time Slot Selector */}
              <div>
                <label className="block text-xs font-medium text-ink-primary mb-1.5 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-brand-600" />
                  Preferred Time Slot
                </label>
                <select
                  required
                  value={visitTime}
                  onChange={(e) => setVisitTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-surface-300 text-xs text-ink-primary bg-surface-50 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                >
                  {timeSlots.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
              </div>

              {/* Optional Message */}
              <div>
                <label className="block text-xs font-medium text-ink-primary mb-1.5 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-ink-tertiary" />
                  Message to Owner (Optional)
                </label>
                <textarea
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="e.g. Hi, I work as a designer in Andheri. Looking to move in next month and would like to inspect the room."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-surface-300 text-xs text-ink-primary bg-surface-50 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  maxLength={500}
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 flex items-center justify-end gap-2.5">
                <Button type="button" variant="ghost" size="sm" onClick={handleClose} disabled={loading}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  icon={loading ? Loader2 : Calendar}
                  disabled={loading}
                >
                  {loading ? 'Submitting...' : 'Send Visit Request'}
                </Button>
              </div>

            </form>
          )}

        </div>

      </div>
    </div>
  );
};
