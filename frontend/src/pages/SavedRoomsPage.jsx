import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, MapPin, Trash2, MessageSquare, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { CompatibilityBadge } from '../components/ui/CompatibilityBadge';
import { fetchSavedRooms, removeSavedRoom } from '../services/api';

export const SavedRoomsPage = () => {
  const [savedRooms, setSavedRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState(null);

  useEffect(() => {
    fetchSavedRooms()
      .then((data) => {
        setSavedRooms(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.warn('Failed to load saved rooms:', err);
        setSavedRooms([]);
        setLoading(false);
      });
  }, []);

  const handleRemove = async (id) => {
    setRemovingId(id);
    try {
      await removeSavedRoom(id);
      setSavedRooms((prev) => prev.filter((r) => (r._id || r.id) !== id));
    } catch (err) {
      console.error('Failed to remove saved room:', err);
      // Still optimistically remove from UI
      setSavedRooms((prev) => prev.filter((r) => (r._id || r.id) !== id));
    } finally {
      setRemovingId(null);
    }
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
          {savedRooms.map((room) => {
            const roomId = room._id || room.id;
            const fallbackImage = 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80';
            const roomImg = (room.images && room.images.length > 0) ? room.images[0] : fallbackImage;

            return (
              <Card key={roomId} className="overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="relative aspect-[4/3] overflow-hidden bg-surface-200">
                    <img
                      src={roomImg}
                      alt={room.title}
                      className="w-full h-full object-cover"
                    />
                    {room.compatibilityScore && (
                      <div className="absolute top-3 left-3">
                        <CompatibilityBadge score={room.compatibilityScore} />
                      </div>
                    )}
                    <button
                      onClick={() => handleRemove(roomId)}
                      disabled={removingId === roomId}
                      className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white hover:bg-rose-600 transition-colors disabled:opacity-50"
                      title="Remove from saved"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="p-5">
                    <div className="flex items-center gap-1 text-xs text-ink-tertiary mb-1">
                      <MapPin className="w-3.5 h-3.5 text-brand-600" />
                      <span>{room.locality || 'Bangalore'}, {room.city || 'Bangalore'}</span>
                    </div>
                    <h3 className="font-semibold text-base text-ink-primary line-clamp-1">{room.title}</h3>
                    <p className="text-xs text-ink-secondary mt-0.5 capitalize">{room.roomType || 'Private Room'}</p>

                    <div className="mt-3 text-sm font-semibold text-ink-primary">
                      ₹{room.rent ? room.rent.toLocaleString('en-IN') : '0'}
                      <span className="text-xs font-normal text-ink-tertiary"> / month</span>
                    </div>
                  </div>
                </div>

                <div className="p-5 pt-0 flex items-center gap-2">
                  <Link to={`/rooms/${roomId}`} className="flex-1">
                    <Button variant="secondary" size="sm" className="w-full justify-center">
                      View
                    </Button>
                  </Link>
                  <Link to={`/messages?roomId=${roomId}`} className="flex-1">
                    <Button variant="primary" size="sm" className="w-full justify-center" icon={MessageSquare}>
                      Message Owner
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}

    </div>
  );
};
