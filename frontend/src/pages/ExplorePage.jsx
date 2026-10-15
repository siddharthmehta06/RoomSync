import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { MapPin, SlidersHorizontal, Search, CheckCircle2, RotateCcw } from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { CompatibilityBadge } from '../components/ui/CompatibilityBadge';
import { fetchRooms } from '../services/api';

export const ExplorePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCity = searchParams.get('city') || 'All';
  const initialMaxRent = searchParams.get('maxRent') || '';

  const [city, setCity] = useState(initialCity);
  const [maxRent, setMaxRent] = useState(initialMaxRent);
  const [furnishing, setFurnishing] = useState('All');
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    fetchRooms({ city, maxRent }).then((data) => {
      if (isMounted) {
        let filtered = data;
        if (furnishing !== 'All') {
          filtered = filtered.filter((r) => r.furnishing.toLowerCase().includes(furnishing.toLowerCase()));
        }
        setRooms(filtered);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [city, maxRent, furnishing]);

  const handleResetFilters = () => {
    setCity('All');
    setMaxRent('');
    setFurnishing('All');
    setSearchParams({});
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-ink-primary">Explore Shared Living</h1>
        <p className="text-sm text-ink-secondary mt-1">
          Browse verified residential listings with explicit house rules, flatmate lifestyle profiles, and rental terms.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-black/[0.06] shadow-subtle mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* City Filter */}
          <div>
            <label className="block text-xs font-medium text-ink-secondary mb-1.5">Metro City</label>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full bg-surface-50 border border-surface-200 text-sm rounded-xl px-3 py-2 text-ink-primary focus:outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-500"
            >
              <option value="All">All Metros</option>
              <option value="Bengaluru">Bengaluru</option>
              <option value="Pune">Pune</option>
              <option value="Hyderabad">Hyderabad</option>
              <option value="Delhi-NCR">Delhi-NCR</option>
              <option value="Mumbai">Mumbai</option>
            </select>
          </div>

          {/* Max Rent */}
          <div>
            <label className="block text-xs font-medium text-ink-secondary mb-1.5">Max Rent (₹/month)</label>
            <input
              type="number"
              placeholder="e.g. 20000"
              value={maxRent}
              onChange={(e) => setMaxRent(e.target.value)}
              className="w-full bg-surface-50 border border-surface-200 text-sm rounded-xl px-3 py-2 text-ink-primary focus:outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-500"
            />
          </div>

          {/* Furnishing */}
          <div>
            <label className="block text-xs font-medium text-ink-secondary mb-1.5">Furnishing</label>
            <select
              value={furnishing}
              onChange={(e) => setFurnishing(e.target.value)}
              className="w-full bg-surface-50 border border-surface-200 text-sm rounded-xl px-3 py-2 text-ink-primary focus:outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-500"
            >
              <option value="All">Any Furnishing</option>
              <option value="Fully">Fully Furnished</option>
              <option value="Semi">Semi-Furnished</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex items-end gap-2">
            <Button
              variant="secondary"
              size="md"
              className="w-full"
              icon={RotateCcw}
              onClick={handleResetFilters}
            >
              Reset Filters
            </Button>
          </div>

        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between mb-6">
        <span className="text-xs font-medium text-ink-secondary">
          Showing <span className="text-ink-primary font-semibold">{rooms.length}</span> verified spaces
        </span>
      </div>

      {/* Room Grid */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="inline-block animate-spin w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full" />
          <p className="text-xs text-ink-secondary mt-3">Loading verified rooms...</p>
        </div>
      ) : rooms.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-black/[0.05] p-8">
          <h3 className="text-base font-semibold text-ink-primary">No listings match your criteria</h3>
          <p className="text-xs text-ink-secondary mt-1">Try relaxing your budget ceiling or city filter.</p>
          <Button variant="secondary" size="sm" className="mt-4" onClick={handleResetFilters}>
            Clear All Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {rooms.map((room) => (
            <Card key={room.id} hoverable className="overflow-hidden flex flex-col group">
              {/* Photo Showcase */}
              <div className="relative aspect-[4/3] overflow-hidden bg-surface-200">
                <img
                  src={room.images[0]}
                  alt={room.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3">
                  <CompatibilityBadge score={room.compatibilityScore} />
                </div>
                <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-white text-xs font-medium px-2.5 py-1 rounded-full">
                  {room.furnishing}
                </div>
              </div>

              {/* Room Content */}
              <CardContent className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1 text-xs text-ink-tertiary mb-1">
                    <MapPin className="w-3.5 h-3.5 text-brand-600" />
                    <span>{room.locality}, {room.city}</span>
                  </div>
                  <h3 className="font-semibold text-base text-ink-primary group-hover:text-brand-700 transition-colors line-clamp-1">
                    {room.title}
                  </h3>
                  <p className="text-xs text-ink-secondary mt-0.5">{room.roomType}</p>

                  <div className="mt-3.5 pt-3 border-t border-surface-200/60 space-y-1">
                    {room.strengths.slice(0, 2).map((s, idx) => (
                      <div key={idx} className="flex items-start gap-1.5 text-xs text-emerald-800">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="line-clamp-1">{s}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-surface-200 flex items-center justify-between">
                  <div>
                    <span className="text-lg font-semibold text-ink-primary">₹{room.rent.toLocaleString('en-IN')}</span>
                    <span className="text-xs text-ink-tertiary"> / mo</span>
                  </div>
                  <Link to={`/rooms/${room.id}`}>
                    <Button variant="secondary" size="sm">
                      Details
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

    </div>
  );
};
