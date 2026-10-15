import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, MapPin, Trash2, MessageSquare, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { CompatibilityBadge } from '../components/ui/CompatibilityBadge';
import { fetchSavedRooms } from '../services/api';

export const SavedRoomsPage = () => {
  const [savedRooms, setSavedRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSavedRooms().then((data) => {
      setSavedRooms(data);
      setLoading(false);
    });
  }, []);

  const handleRemove = (id) => {
    setSavedRooms((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-ink-primary">Saved Rooms</h1>
          <p className="text-xs text-ink-secondary mt-1">
            Compare shortlisted listings and track room availability before booking visits.
          </p>
        </div>
        <span className="text-xs text-ink-secondary">{savedRooms.length} rooms bookmarked</span>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <div className="inline-block animate-spin w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full" />
        </div>
      ) : savedRooms.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-black/[0.05] p-8 max-w-lg mx-auto">
          <Bookmark className="w-10 h-10 text-ink-tertiary mx-auto mb-3" />
          <h3 className="text-base font-semibold text-ink-primary">No saved rooms yet</h3>
          <p className="text-xs text-ink-secondary mt-1">
            Bookmark listings while exploring or reviewing your compatibility matches.
          </p>
          <Link to="/explore">
            <Button variant="primary" size="sm" className="mt-4">
              Explore Rooms
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {savedRooms.map((room) => (
            <Card key={room.id} className="overflow-hidden flex flex-col justify-between">
              <div>
                <div className="relative aspect-[4/3] overflow-hidden bg-surface-200">
                  <img
                    src={room.images[0]}
                    alt={room.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3">
                    <CompatibilityBadge score={room.compatibilityScore} />
                  </div>
                  <button
                    onClick={() => handleRemove(room.id)}
                    className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 text-white hover:bg-rose-600 transition-colors"
                    title="Remove from saved"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="p-5">
                  <div className="flex items-center gap-1 text-xs text-ink-tertiary mb-1">
                    <MapPin className="w-3.5 h-3.5 text-brand-600" />
                    <span>{room.locality}, {room.city}</span>
                  </div>
                  <h3 className="font-semibold text-base text-ink-primary line-clamp-1">{room.title}</h3>
                  <p className="text-xs text-ink-secondary mt-0.5">{room.roomType}</p>

                  <div className="mt-3 text-sm font-semibold text-ink-primary">
                    ₹{room.rent.toLocaleString('en-IN')}<span className="text-xs font-normal text-ink-tertiary"> / month</span>
                  </div>
                </div>
              </div>

              <div className="p-5 pt-0 flex items-center gap-2">
                <Link to={`/rooms/${room.id}`} className="flex-1">
                  <Button variant="secondary" size="sm" className="w-full justify-center">
                    View
                  </Button>
                </Link>
                <Link to="/messages" className="flex-1">
                  <Button variant="primary" size="sm" className="w-full justify-center" icon={MessageSquare}>
                    Chat
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}

    </div>
  );
};
