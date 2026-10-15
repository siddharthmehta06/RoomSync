import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Home, 
  Upload, 
  MapPin, 
  CheckCircle2, 
  ArrowLeft, 
  Sparkles, 
  DollarSign,
  Shield,
  Clock,
  Utensils
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';

export const CreateListingPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState({
    title: isEditing ? 'Sunlit Master Bedroom in 3BHK Penthouse' : '',
    city: 'Bengaluru',
    locality: isEditing ? 'Koramangala 4th Block' : '',
    pinCode: isEditing ? '560034' : '',
    rent: isEditing ? '18500' : '',
    maintenance: isEditing ? '1500' : '1500',
    deposit: isEditing ? '50000' : '',
    roomType: 'Private Room with Attached Bath',
    furnishing: 'Fully Furnished',
    minStayMonths: '6',
    availableFrom: '2026-11-01',
    // 22 Factors / Living Conditions
    dietaryRule: 'Any / Flexible',
    smokingRule: 'Strictly Non-Smoking',
    alcoholRule: 'Social Drinking OK',
    sleepExpectation: '23:30',
    cleanlinessStandard: 'Daily Maid (Provided)',
    guestPolicy: 'Allowed with 24h Prior Notice',
    petPolicy: 'Cats Welcome, No Dogs',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simulate listing creation
    alert(isEditing ? 'Listing updated successfully!' : 'Listing published successfully! It is now discoverable across the 22-factor match engine.');
    navigate('/owner/dashboard');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 md:py-12">
      
      {/* Top back button */}
      <button 
        onClick={() => navigate('/owner/dashboard')} 
        className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-secondary hover:text-ink-primary transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Owner Hub</span>
      </button>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-ink-primary">
          {isEditing ? 'Edit Room Listing & Living Rules' : 'Publish a New Shared Room'}
        </h1>
        <p className="text-xs text-ink-secondary mt-1">
          Specify both physical property specifications and actual day-to-day flatmate living habits.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Section 1: Basic Property Details */}
        <Card className="p-6 sm:p-8 bg-white shadow-subtle space-y-6">
          <h2 className="text-base font-semibold text-ink-primary flex items-center gap-2">
            <Home className="w-4 h-4 text-brand-600" />
            1. Property & Location
          </h2>

          <div className="space-y-4">
            <Input
              label="Listing Title"
              placeholder="e.g. Spacious Garden-Facing Master Bedroom"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-ink-primary mb-1.5 ml-0.5">City</label>
                <select
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full bg-surface-50 border border-surface-200 text-sm rounded-xl px-3.5 py-2.5 text-ink-primary focus:outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-500"
                >
                  <option value="Bengaluru">Bengaluru</option>
                  <option value="Pune">Pune</option>
                  <option value="Hyderabad">Hyderabad</option>
                  <option value="Delhi-NCR">Delhi-NCR</option>
                  <option value="Mumbai">Mumbai</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <Input
                  label="Locality / Sector"
                  placeholder="e.g. Koramangala 4th Block, near Sony Signal"
                  value={formData.locality}
                  onChange={(e) => setFormData({ ...formData, locality: e.target.value })}
                  icon={MapPin}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-ink-primary mb-1.5 ml-0.5">Room Type</label>
                <select
                  value={formData.roomType}
                  onChange={(e) => setFormData({ ...formData, roomType: e.target.value })}
                  className="w-full bg-surface-50 border border-surface-200 text-sm rounded-xl px-3.5 py-2.5 text-ink-primary focus:outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-500"
                >
                  <option value="Private Room with Attached Bath">Private Room (Attached Bath)</option>
                  <option value="Private Room (Shared Bath)">Private Room (Shared Bath)</option>
                  <option value="Master Bedroom with Balcony">Master Suite (Attached Balcony)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-ink-primary mb-1.5 ml-0.5">Furnishing</label>
                <select
                  value={formData.furnishing}
                  onChange={(e) => setFormData({ ...formData, furnishing: e.target.value })}
                  className="w-full bg-surface-50 border border-surface-200 text-sm rounded-xl px-3.5 py-2.5 text-ink-primary focus:outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-500"
                >
                  <option value="Fully Furnished">Fully Furnished</option>
                  <option value="Semi-Furnished">Semi-Furnished</option>
                  <option value="Unfurnished">Unfurnished</option>
                </select>
              </div>

              <div>
                <Input
                  label="Pin Code"
                  placeholder="e.g. 560034"
                  value={formData.pinCode}
                  onChange={(e) => setFormData({ ...formData, pinCode: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Section 2: Financial Terms */}
        <Card className="p-6 sm:p-8 bg-white shadow-subtle space-y-6">
          <h2 className="text-base font-semibold text-ink-primary flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-brand-600" />
            2. Rent, Maintenance & Deposit
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Monthly Rent (₹)"
              type="number"
              placeholder="e.g. 18000"
              value={formData.rent}
              onChange={(e) => setFormData({ ...formData, rent: e.target.value })}
              required
            />

            <Input
              label="Maintenance (₹/month)"
              type="number"
              placeholder="e.g. 1500"
              value={formData.maintenance}
              onChange={(e) => setFormData({ ...formData, maintenance: e.target.value })}
            />

            <Input
              label="Security Deposit (₹)"
              type="number"
              placeholder="e.g. 50000"
              value={formData.deposit}
              onChange={(e) => setFormData({ ...formData, deposit: e.target.value })}
              required
            />
          </div>
        </Card>

        {/* Section 3: The 22 Living Conditions & House Rules */}
        <Card className="p-6 sm:p-8 bg-white shadow-subtle space-y-6">
          <div>
            <h2 className="text-base font-semibold text-ink-primary flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-600" />
              3. Living Reality & Flatmate Preferences (22 Factors)
            </h2>
            <p className="text-xs text-ink-secondary mt-0.5">
              These factors will feed directly into the fuzzy matching algorithm to screen incoming roommate candidates.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-ink-primary mb-1.5 ml-0.5">Dietary Culture in Flat</label>
              <select
                value={formData.dietaryRule}
                onChange={(e) => setFormData({ ...formData, dietaryRule: e.target.value })}
                className="w-full bg-surface-50 border border-surface-200 text-sm rounded-xl px-3.5 py-2.5 text-ink-primary focus:outline-none focus:border-brand-600"
              >
                <option value="Any / Flexible">Any Diet / Non-Veg Permitted</option>
                <option value="Pure Vegetarian Kitchen">Pure Vegetarian Kitchen Only</option>
                <option value="Eggetarian Friendly">Eggetarian Kitchen</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-primary mb-1.5 ml-0.5">Smoking Policy</label>
              <select
                value={formData.smokingRule}
                onChange={(e) => setFormData({ ...formData, smokingRule: e.target.value })}
                className="w-full bg-surface-50 border border-surface-200 text-sm rounded-xl px-3.5 py-2.5 text-ink-primary focus:outline-none focus:border-brand-600"
              >
                <option value="Strictly Non-Smoking">Strictly Non-Smoking</option>
                <option value="Balcony Only">Balcony Smoking Permitted</option>
                <option value="Smoking Friendly">Smoking Permitted</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-primary mb-1.5 ml-0.5">Typical Bedtime / Quiet Hours</label>
              <input
                type="text"
                placeholder="e.g. Quiet hours start at 11:30 PM"
                value={formData.sleepExpectation}
                onChange={(e) => setFormData({ ...formData, sleepExpectation: e.target.value })}
                className="w-full bg-surface-50 border border-surface-200 text-sm rounded-xl px-3.5 py-2.5 text-ink-primary focus:outline-none focus:border-brand-600"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-primary mb-1.5 ml-0.5">Overnight Guests Guidelines</label>
              <select
                value={formData.guestPolicy}
                onChange={(e) => setFormData({ ...formData, guestPolicy: e.target.value })}
                className="w-full bg-surface-50 border border-surface-200 text-sm rounded-xl px-3.5 py-2.5 text-ink-primary focus:outline-none focus:border-brand-600"
              >
                <option value="Allowed with 24h Prior Notice">Allowed with 24h Prior Notice</option>
                <option value="Strictly No Overnight Guests">Strictly No Overnight Guests</option>
                <option value="Same-gender friends only">Same-gender friends only</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Section 4: Photo Showcase */}
        <Card className="p-6 sm:p-8 bg-white shadow-subtle space-y-4">
          <h2 className="text-base font-semibold text-ink-primary flex items-center gap-2">
            <Upload className="w-4 h-4 text-brand-600" />
            4. Room Photographs
          </h2>
          <div className="border-2 border-dashed border-surface-200 rounded-2xl p-8 text-center hover:border-brand-500 transition-colors cursor-pointer bg-surface-50">
            <Upload className="w-8 h-8 text-ink-tertiary mx-auto mb-2" />
            <p className="text-xs font-semibold text-ink-primary">Click to select high-resolution room photos</p>
            <p className="text-[11px] text-ink-secondary mt-1">PNG, JPG, or WEBP up to 10MB each (Cloudinary integration ready)</p>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <Button variant="secondary" size="md" onClick={() => navigate('/owner/dashboard')}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="md">
            {isEditing ? 'Save Changes' : 'Publish Room Listing'}
          </Button>
        </div>

      </form>
    </div>
  );
};
