import React, { useState } from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ShieldCheck,
  User,
  Home
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { createBookingRequestApi } from '../../services/api';
import { useNavigate } from 'react-router-dom';

export const SendBookingRequestModal = ({ isOpen, onClose, room, onRequestSubmitted }) => {
  const navigate = useNavigate();
  if (!isOpen || !room) return null;

  // Default move-in date
  const today = new Date().toISOString().split('T')[0];
  const defaultMoveIn = room.availableFrom && !isNaN(new Date(room.availableFrom).getTime())
    ? new Date(room.availableFrom).toISOString().split('T')[0]
    : today;

  const [moveInDate, setMoveInDate] = useState(defaultMoveIn);
  const [stayDuration, setStayDuration] = useState(room.minStayMonths || 6);
  const [occupantsCount, setOccupantsCount] = useState(1);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!moveInDate) {
      setErrorMessage('Please select a proposed move-in date.');
      return;
    }

    setLoading(true);
    try {
      const roomId = room._id || room.id;
      await createBookingRequestApi({
        roomId,
        moveInDate,
        stayDuration: Number(stayDuration),
        occupantsCount: Number(occupantsCount),
        message: message.trim(),
      });

      setSuccess(true);
      if (onRequestSubmitted) {
        onRequestSubmitted();
      }
    } catch (err) {
      if (err.code === 'ROOM_ALREADY_RESERVED') {
        setErrorMessage('This room is currently reserved or occupied. Please explore other listings.');
      } else if (err.code === 'CANNOT_BOOK_OWN_LISTING') {
        setErrorMessage('You cannot send a booking request for your own listing.');
      } else {
        setErrorMessage(err.message || 'Failed to submit booking request. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        className="relative bg-white w-full max-w-lg rounded-3xl shadow-apple border border-black/[0.08] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-modal-title"
      >
        {/* Header */}
        <div className="p-6 pb-4 border-b border-surface-200 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-brand-700 text-xs font-semibold uppercase tracking-wider mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Direct Tenancy Proposal</span>
            </div>
            <h2 id="booking-modal-title" className="text-xl font-bold text-ink-primary">
              Send Booking Request
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-surface-100 text-ink-tertiary hover:text-ink-primary transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {success ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-ink-primary">Booking Request Sent!</h3>
                <p className="text-xs text-ink-secondary leading-relaxed max-w-sm mx-auto">
                  Your booking request for <strong>{room.title}</strong> has been delivered to the property owner. 
                  Once approved, your mutual tenancy agreement will be generated for digital signatures.
                </p>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  variant="primary"
                  size="md"
                  icon={FileText}
                  onClick={() => {
                    onClose();
                    navigate('/bookings');
                  }}
                >
                  View My Requests & Agreements
                </Button>
                <Button
                  variant="outline"
                  size="md"
                  onClick={onClose}
                >
                  Close
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Room Snapshot */}
              <div className="p-3.5 rounded-2xl bg-surface-50 border border-surface-200 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-200 text-brand-700 flex items-center justify-center shrink-0">
                  <Home className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-semibold text-ink-primary truncate">{room.title}</h4>
                  <p className="text-[11px] text-ink-secondary">{room.locality}, {room.city}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-bold text-brand-700">₹{(room.rent || 0).toLocaleString('en-IN')}</span>
                  <span className="text-[10px] text-ink-tertiary block">/month</span>
                </div>
              </div>

              {/* Error Notice */}
              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <p>{errorMessage}</p>
                </div>
              )}

              {/* Proposed Move-in Date */}
              <div>
                <label className="block text-xs font-semibold text-ink-primary mb-1.5">
                  Proposed Move-in Date *
                </label>
                <div className="relative">
                  <input
                    type="date"
                    min={today}
                    value={moveInDate}
                    onChange={(e) => setMoveInDate(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-surface-300 text-xs text-ink-primary focus:outline-hidden focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600"
                  />
                </div>
                <p className="text-[11px] text-ink-tertiary mt-1">
                  Available from: {room.availableFrom ? new Date(room.availableFrom).toLocaleDateString() : 'Immediate'}
                </p>
              </div>

              {/* Stay Duration & Occupants */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-ink-primary mb-1.5">
                    Lease Duration (Months)
                  </label>
                  <select
                    value={stayDuration}
                    onChange={(e) => setStayDuration(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl border border-surface-300 text-xs text-ink-primary bg-white focus:outline-hidden focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600"
                  >
                    {[3, 6, 9, 11, 12, 24].map((m) => (
                      <option key={m} value={m}>
                        {m} Months {m === (room.minStayMonths || 6) ? '(Min)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink-primary mb-1.5">
                    Number of Occupants
                  </label>
                  <select
                    value={occupantsCount}
                    onChange={(e) => setOccupantsCount(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl border border-surface-300 text-xs text-ink-primary bg-white focus:outline-hidden focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600"
                  >
                    <option value={1}>1 Person</option>
                    <option value={2}>2 People</option>
                  </select>
                </div>
              </div>

              {/* Message to Owner */}
              <div>
                <label className="block text-xs font-semibold text-ink-primary mb-1.5">
                  Introduction / Note for Owner (Optional)
                </label>
                <textarea
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Introduce yourself, your profession/college, and share any specific move-in preferences..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-surface-300 text-xs text-ink-primary focus:outline-hidden focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 placeholder:text-ink-tertiary resize-none"
                />
              </div>

              {/* Zero-Deposit Mutual Agreement Safeguard */}
              <div className="p-3.5 rounded-2xl bg-brand-50/60 border border-brand-200/60 text-xs text-brand-900 space-y-1">
                <span className="font-semibold block flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-brand-700" />
                  RoomSync Safe Living Protocol
                </span>
                <p className="text-[11px] text-brand-800 leading-relaxed">
                  No upfront token payment or deposit fee required. If the owner accepts your proposal, both parties will review and sign a mutual digital agreement outlining rent, deposit, and 22-factor lifestyle rules.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Submitting Request...
                    </span>
                  ) : (
                    'Submit Booking Request'
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

