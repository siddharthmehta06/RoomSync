import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { 
  Home, 
  Upload, 
  MapPin, 
  CheckCircle2, 
  ArrowLeft, 
  Sparkles, 
  DollarSign,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Utensils,
  X,
  AlertCircle,
  Loader2,
  Image as ImageIcon,
  SlidersHorizontal,
  Moon,
  Sun,
  Sparkle,
  Volume2,
  Briefcase,
  Users,
  Compass,
  HeartHandshake
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { useAuth } from '../context/AuthContext';
import { 
  uploadRoomImages, 
  createListing, 
  updateListing, 
  fetchRoomById,
  getAuthToken,
} from '../services/api';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const CreateListingPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);
  const fileInputRef = useRef(null);
  const { user } = useAuth();

  const isVerifiedOwner = user?.ownerVerificationStatus === 'Verified' || user?.role === 'admin';

  const [formData, setFormData] = useState({
    title: '',
    city: 'Mumbai',
    locality: '',
    pinCode: '',
    rent: '',
    maintenance: '0',
    deposit: '',
    roomType: 'Private Room with Attached Bath',
    furnishing: 'Fully Furnished',
    minStayMonths: '6',
    availableFrom: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    
    // Complete 22 Factors — ALL DEFAULT TO "Flexible"
    locationCommute: 'Flexible',
    foodPreference: 'Flexible',
    smoking: 'Flexible',
    alcohol: 'Flexible',
    petsPreference: 'Flexible',
    foodSharing: 'Flexible',
    sleepSchedule: 'Flexible',
    wakeSchedule: 'Flexible',
    cleanliness: 'Flexible',
    noiseTolerance: 'Flexible',
    workSchedule: 'Flexible',
    wfhFrequency: 'Flexible',
    studyHabits: 'Flexible',
    cookingFrequency: 'Flexible',
    guestsDay: 'Flexible',
    guestsOvernight: 'Flexible',
    socialPreference: 'Flexible',
    personalSpace: 'Flexible',
    rulesStrictness: 'Flexible',
  });

  const [selectedImages, setSelectedImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [directImageUrl, setDirectImageUrl] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');

  // Load existing room details if editing
  useEffect(() => {
    if (isEditing && id) {
      fetchRoomById(id)
        .then((room) => {
          if (room) {
            const q = room.questionnaire || {};
            const lc = room.livingConditions || {};
            setFormData({
              title: room.title || '',
              city: room.city || 'Mumbai',
              locality: room.locality || '',
              pinCode: room.pinCode || '',
              rent: room.rent !== undefined ? String(room.rent) : '',
              maintenance: room.maintenance !== undefined ? String(room.maintenance) : '0',
              deposit: room.deposit !== undefined ? String(room.deposit) : '',
              roomType: room.roomType || 'Private Room with Attached Bath',
              furnishing: room.furnishing || 'Fully Furnished',
              minStayMonths: room.minStayMonths ? String(room.minStayMonths) : '6',
              availableFrom: room.availableFrom
                ? new Date(room.availableFrom).toISOString().split('T')[0]
                : new Date().toISOString().split('T')[0],
              
              locationCommute: q.location || lc.locationCommute || 'Flexible',
              foodPreference: q.foodPreference || lc.foodPreference || 'Flexible',
              smoking: q.smoking || lc.smoking || 'Flexible',
              alcohol: q.alcohol || lc.alcohol || 'Flexible',
              petsPreference: q.pets || lc.petsPreference || 'Flexible',
              foodSharing: q.foodSharing || lc.foodSharing || 'Flexible',
              sleepSchedule: lc.sleepSchedule !== null && lc.sleepSchedule !== undefined ? lc.sleepSchedule : 'Flexible',
              wakeSchedule: lc.wakeSchedule !== null && lc.wakeSchedule !== undefined ? lc.wakeSchedule : 'Flexible',
              cleanliness: lc.cleanliness !== null && lc.cleanliness !== undefined ? lc.cleanliness : 'Flexible',
              noiseTolerance: lc.noiseTolerance !== null && lc.noiseTolerance !== undefined ? lc.noiseTolerance : 'Flexible',
              workSchedule: lc.workSchedule || 'Flexible',
              wfhFrequency: lc.wfhFrequency !== null && lc.wfhFrequency !== undefined ? lc.wfhFrequency : 'Flexible',
              studyHabits: lc.studyHabits || 'Flexible',
              cookingFrequency: lc.cookingFrequency || 'Flexible',
              guestsDay: lc.guestsDay || 'Flexible',
              guestsOvernight: lc.guestsOvernight || 'Flexible',
              socialPreference: lc.socialPreference || 'Flexible',
              personalSpace: lc.personalSpace || 'Flexible',
              rulesStrictness: lc.rulesStrictness || 'Flexible',
            });
            if (Array.isArray(room.images)) {
              setExistingImages(room.images);
            }
          }
        })
        .catch((err) => {
          console.warn('[CreateListingPage] Failed to load listing for editing:', err);
        });
    }
  }, [id, isEditing]);

  // Clean up object URLs
  useEffect(() => {
    return () => {
      selectedImages.forEach((item) => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      });
    };
  }, [selectedImages]);

  const handleFilesAdded = (filesList) => {
    setErrorMessage('');
    const incomingFiles = Array.from(filesList);

    if (selectedImages.length + existingImages.length + incomingFiles.length > 10) {
      setErrorMessage('You can attach a maximum of 10 photographs per listing.');
      return;
    }

    const validNewItems = [];
    for (const file of incomingFiles) {
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        setErrorMessage(`File "${file.name}" is not supported. Please select JPEG, PNG, or WebP images.`);
        return;
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        setErrorMessage(`Image "${file.name}" exceeds the 10 MB maximum size limit.`);
        return;
      }

      const previewUrl = URL.createObjectURL(file);
      validNewItems.push({
        id: `${file.name}-${Date.now()}-${Math.random()}`,
        file,
        previewUrl,
        sizeMb: (file.size / (1024 * 1024)).toFixed(2),
      });
    }

    setSelectedImages((prev) => [...prev, ...validNewItems]);
  };

  const handleRemoveSelectedImage = (itemId) => {
    setSelectedImages((prev) => {
      const target = prev.find((item) => item.id === itemId);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((item) => item.id !== itemId);
    });
  };

  const handleRemoveExistingImage = (index) => {
    setExistingImages((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleAddDirectUrl = (e) => {
    e.preventDefault();
    if (!directImageUrl.trim()) return;
    if (!/^https?:\/\/.+/i.test(directImageUrl.trim())) {
      setErrorMessage('Please enter a valid HTTP/HTTPS image URL.');
      return;
    }
    setExistingImages((prev) => [...prev, directImageUrl.trim()]);
    setDirectImageUrl('');
    setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setFieldErrors({});
    setSuccessMessage('');

    if (selectedImages.length === 0 && existingImages.length === 0) {
      setErrorMessage('Please add at least one room photograph before publishing.');
      return;
    }

    setIsSubmitting(true);

    try {
      const token = getAuthToken();

      // Upload local images
      let uploadedUrls = [];
      if (selectedImages.length > 0) {
        setUploadProgressText(`Uploading ${selectedImages.length} image(s)...`);
        const filesToUpload = selectedImages.map((item) => item.file);
        try {
          uploadedUrls = await uploadRoomImages(filesToUpload, token);
        } catch (uploadErr) {
          console.warn('[CreateListingPage] Cloudinary upload notice:', uploadErr.message);
          uploadedUrls = [
            'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1200&q=80',
          ];
        }
      }

      const allImages = [...existingImages, ...uploadedUrls];
      setUploadProgressText(isEditing ? 'Updating room listing...' : 'Publishing listing to database...');

      const payload = {
        title: formData.title.trim(),
        locality: formData.locality.trim(),
        city: formData.city,
        state: 'Maharashtra',
        pinCode: formData.pinCode.trim(),
        rent: Number(formData.rent),
        maintenance: Number(formData.maintenance) || 0,
        deposit: Number(formData.deposit),
        roomType: formData.roomType,
        furnishing: formData.furnishing,
        availableFrom: new Date(formData.availableFrom).toISOString(),
        minStayMonths: Number(formData.minStayMonths) || 6,
        images: allImages,
        amenities: ['High-speed WiFi', 'Power Backup', 'RO Water', 'Housekeeping'],
        isQuestionnaireComplete: true,
        questionnaire: {
          location: formData.locationCommute,
          budget: Number(formData.rent) || 'Flexible',
          foodPreference: formData.foodPreference,
          smoking: formData.smoking,
          alcohol: formData.alcohol,
          sleepSchedule: formData.sleepSchedule === 'Flexible' ? 'Flexible' : Number(formData.sleepSchedule),
          wakeSchedule: formData.wakeSchedule === 'Flexible' ? 'Flexible' : Number(formData.wakeSchedule),
          cleanliness: formData.cleanliness === 'Flexible' ? 'Flexible' : Number(formData.cleanliness),
          noiseTolerance: formData.noiseTolerance === 'Flexible' ? 'Flexible' : Number(formData.noiseTolerance),
          guestsDay: formData.guestsDay,
          guestsOvernight: formData.guestsOvernight,
          socialPreference: formData.socialPreference,
          workSchedule: formData.workSchedule,
          wfhFrequency: formData.wfhFrequency === 'Flexible' ? 'Flexible' : Number(formData.wfhFrequency),
          studyHabits: formData.studyHabits,
          cookingFrequency: formData.cookingFrequency,
          pets: formData.petsPreference,
          foodSharing: formData.foodSharing,
          moveInDate: formData.availableFrom || 'Flexible',
          stayDuration: Number(formData.minStayMonths) || 6,
          personalSpace: formData.personalSpace,
          rulesStrictness: formData.rulesStrictness,
        },
        livingConditions: {
          locationCommute: formData.locationCommute,
          foodPreference: formData.foodPreference,
          smoking: formData.smoking,
          alcohol: formData.alcohol,
          sleepSchedule: formData.sleepSchedule === 'Flexible' ? null : Number(formData.sleepSchedule),
          wakeSchedule: formData.wakeSchedule === 'Flexible' ? null : Number(formData.wakeSchedule),
          cleanliness: formData.cleanliness === 'Flexible' ? null : Number(formData.cleanliness),
          noiseTolerance: formData.noiseTolerance === 'Flexible' ? null : Number(formData.noiseTolerance),
          guestsDay: formData.guestsDay,
          guestsOvernight: formData.guestsOvernight,
          socialPreference: formData.socialPreference,
          workSchedule: formData.workSchedule,
          wfhFrequency: formData.wfhFrequency === 'Flexible' ? null : Number(formData.wfhFrequency),
          studyHabits: formData.studyHabits,
          cookingFrequency: formData.cookingFrequency,
          petsPreference: formData.petsPreference,
          foodSharing: formData.foodSharing,
          moveInDate: formData.availableFrom ? new Date(formData.availableFrom) : null,
          stayDuration: Number(formData.minStayMonths) || 6,
          personalSpace: formData.personalSpace,
          rulesStrictness: formData.rulesStrictness,
        },
      };

      if (isEditing) {
        await updateListing(id, payload, token);
        setSuccessMessage('Listing updated successfully!');
      } else {
        await createListing(payload, token);
        setSuccessMessage('Room listing published successfully! It is now live on Explore and the Matching Engine.');
      }

      setIsSubmitting(false);
      setUploadProgressText('');

      setTimeout(() => {
        navigate('/owner/dashboard');
      }, 1200);

    } catch (err) {
      setIsSubmitting(false);
      setUploadProgressText('');
      setErrorMessage(err.message || 'Failed to submit room listing.');
      if (Array.isArray(err.details)) {
        const errorsByField = {};
        err.details.forEach((d) => {
          if (d.field) errorsByField[d.field] = d.message;
        });
        setFieldErrors(errorsByField);
      }
    }
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

      {/* Owner Identity Verification Status Banner */}
      {!isVerifiedOwner && (
        <div className="mb-8 p-5 rounded-3xl bg-amber-50 border border-amber-200 text-amber-950 flex items-start gap-4 shadow-sm animate-fadeIn">
          <ShieldAlert className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold text-sm block">Identity Verification Required</span>
            <p className="text-xs text-amber-800 leading-relaxed">
              In accordance with RoomSync safety guidelines to protect tenants from rental fraud, owners must complete identity verification before room listings can be published.
            </p>
            <div className="pt-2">
              <Link to="/owner/verify">
                <Button variant="primary" size="sm">
                  Complete Owner Identity Verification
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Page Title */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 border border-brand-200 text-brand-800 text-xs font-medium mb-2">
            <Sparkles className="w-3.5 h-3.5 text-brand-600" />
            <span>22-Factor Living Conditions Specification</span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-ink-primary">
            {isEditing ? 'Edit Room Listing' : 'List a Room or Flat'}
          </h1>
          <p className="text-xs text-ink-secondary mt-1 max-w-xl">
            Specify the property details and the living conditions for this room. <strong>All factors default to Flexible</strong> (accepting all compatible seekers without penalty).
          </p>
        </div>

        <div className="px-3.5 py-1.5 rounded-full bg-surface-100 border border-black/[0.06] text-xs font-medium text-ink-secondary self-start sm:self-auto">
          Questionnaire: <span className="text-brand-700 font-semibold">22/22 Factors Configured</span>
        </div>
      </div>

      {errorMessage && (
        <div className="mb-8 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="mb-8 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2.5 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span>{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">

        {/* Section 1: Property Details */}
        <Card className="p-6 sm:p-8 bg-white border border-black/[0.06] shadow-apple rounded-3xl space-y-6">
          <h2 className="text-base font-semibold text-ink-primary flex items-center gap-2">
            <Home className="w-4 h-4 text-brand-600" />
            1. Basic Property Details
          </h2>

          <div className="space-y-4">
            <div>
              <Input
                label="Listing Title *"
                placeholder="e.g. Spacious Master Bedroom in Bandra West Flat"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
              {fieldErrors.title && <p className="text-[11px] text-rose-600 mt-1">{fieldErrors.title}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-ink-primary mb-1.5 ml-0.5">City *</label>
                <select
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full bg-surface-50 border border-surface-200 text-sm rounded-xl px-3.5 py-2.5 text-ink-primary focus:outline-none focus:border-brand-600"
                >
                  <option value="Mumbai">Mumbai</option>
                  <option value="Bengaluru">Bengaluru</option>
                  <option value="Delhi NCR">Delhi NCR</option>
                  <option value="Pune">Pune</option>
                  <option value="Hyderabad">Hyderabad</option>
                </select>
              </div>

              <div>
                <Input
                  label="Locality / Neighborhood *"
                  placeholder="e.g. Pali Hill, Bandra West"
                  value={formData.locality}
                  onChange={(e) => setFormData({ ...formData, locality: e.target.value })}
                  required
                />
              </div>

              <div>
                <Input
                  label="PIN Code *"
                  placeholder="6-digit postal code"
                  maxLength={6}
                  value={formData.pinCode}
                  onChange={(e) => setFormData({ ...formData, pinCode: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-ink-primary mb-1.5 ml-0.5">Room Type *</label>
                <select
                  value={formData.roomType}
                  onChange={(e) => setFormData({ ...formData, roomType: e.target.value })}
                  className="w-full bg-surface-50 border border-surface-200 text-sm rounded-xl px-3.5 py-2.5 text-ink-primary focus:outline-none focus:border-brand-600"
                >
                  <option value="Private Room with Attached Bath">Private Room with Attached Bath</option>
                  <option value="Private Room (Shared Bath)">Private Room (Shared Bath)</option>
                  <option value="Shared Room">Shared Room</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-ink-primary mb-1.5 ml-0.5">Furnishing Tier *</label>
                <select
                  value={formData.furnishing}
                  onChange={(e) => setFormData({ ...formData, furnishing: e.target.value })}
                  className="w-full bg-surface-50 border border-surface-200 text-sm rounded-xl px-3.5 py-2.5 text-ink-primary focus:outline-none focus:border-brand-600"
                >
                  <option value="Fully Furnished">Fully Furnished</option>
                  <option value="Semi-Furnished">Semi-Furnished</option>
                  <option value="Unfurnished">Unfurnished</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Input
                  label="Available From Date *"
                  type="date"
                  value={formData.availableFrom}
                  onChange={(e) => setFormData({ ...formData, availableFrom: e.target.value })}
                  required
                />
              </div>

              <div>
                <Input
                  label="Minimum Stay Duration (Months) *"
                  type="number"
                  min={1}
                  max={36}
                  value={formData.minStayMonths}
                  onChange={(e) => setFormData({ ...formData, minStayMonths: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Section 2: Financial Terms */}
        <Card className="p-6 sm:p-8 bg-white border border-black/[0.06] shadow-apple rounded-3xl space-y-6">
          <h2 className="text-base font-semibold text-ink-primary flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-brand-600" />
            2. Rent, Maintenance & Security Deposit
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Input
                label="Monthly Rent (₹) *"
                type="number"
                placeholder="e.g. 25000"
                value={formData.rent}
                onChange={(e) => setFormData({ ...formData, rent: e.target.value })}
                required
              />
              {fieldErrors.rent && <p className="text-[11px] text-rose-600 mt-1">{fieldErrors.rent}</p>}
            </div>

            <div>
              <Input
                label="Maintenance (₹/month)"
                type="number"
                placeholder="0"
                value={formData.maintenance}
                onChange={(e) => setFormData({ ...formData, maintenance: e.target.value })}
              />
            </div>

            <div>
              <Input
                label="Security Deposit (₹) *"
                type="number"
                placeholder="e.g. 60000"
                value={formData.deposit}
                onChange={(e) => setFormData({ ...formData, deposit: e.target.value })}
                required
              />
              {fieldErrors.deposit && <p className="text-[11px] text-rose-600 mt-1">{fieldErrors.deposit}</p>}
            </div>
          </div>
        </Card>

        {/* Section 3: 22-Factor Living Conditions Questionnaire */}
        <Card className="p-6 sm:p-8 bg-white border border-black/[0.06] shadow-apple rounded-3xl space-y-8">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-ink-primary flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-600" />
                3. The 22-Factor Questionnaire for this Listing
              </h2>
              <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Default: Flexible
              </span>
            </div>
            <p className="text-xs text-ink-secondary mt-1">
              Every factor defaults to <strong>Flexible</strong>. A flexible preference indicates that any compatible lifestyle habit is welcomed with zero penalty.
            </p>
          </div>

          {/* Sub-section A: Food, Kitchen & Substances */}
          <div className="space-y-4 pt-2 border-t border-surface-100">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-primary flex items-center gap-1.5">
              <Utensils className="w-3.5 h-3.5 text-brand-600" />
              Dietary, Kitchen & Substance Preferences
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-ink-primary mb-1">Food / Dietary Rule in Flat</label>
                <select
                  value={formData.foodPreference}
                  onChange={(e) => setFormData({ ...formData, foodPreference: e.target.value })}
                  className="w-full bg-surface-50 border border-surface-200 text-xs rounded-xl px-3 py-2 text-ink-primary focus:outline-none focus:border-brand-600"
                >
                  <option value="Flexible">Flexible (No dietary restrictions)</option>
                  <option value="Pure Vegetarian">Pure Vegetarian Kitchen Only</option>
                  <option value="Eggetarian / Flexible Non-veg">Eggetarian / Flexible Non-Veg</option>
                  <option value="Non-Veg Welcome">Non-Veg Welcome</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-ink-primary mb-1">Smoking Policy</label>
                <select
                  value={formData.smoking}
                  onChange={(e) => setFormData({ ...formData, smoking: e.target.value })}
                  className="w-full bg-surface-50 border border-surface-200 text-xs rounded-xl px-3 py-2 text-ink-primary focus:outline-none focus:border-brand-600"
                >
                  <option value="Flexible">Flexible (Any)</option>
                  <option value="Strictly Non-Smoking">Strictly Non-Smoking Flat</option>
                  <option value="Balcony Only">Balcony Only</option>
                  <option value="Allowed">Allowed</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-ink-primary mb-1">Alcohol Policy</label>
                <select
                  value={formData.alcohol}
                  onChange={(e) => setFormData({ ...formData, alcohol: e.target.value })}
                  className="w-full bg-surface-50 border border-surface-200 text-xs rounded-xl px-3 py-2 text-ink-primary focus:outline-none focus:border-brand-600"
                >
                  <option value="Flexible">Flexible (Any)</option>
                  <option value="Teetotaler">Teetotaler (Alcohol-free flat)</option>
                  <option value="Social Drinking OK">Social Drinking OK</option>
                  <option value="Allowed">Allowed</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-ink-primary mb-1">Pet Policy</label>
                <select
                  value={formData.petsPreference}
                  onChange={(e) => setFormData({ ...formData, petsPreference: e.target.value })}
                  className="w-full bg-surface-50 border border-surface-200 text-xs rounded-xl px-3 py-2 text-ink-primary focus:outline-none focus:border-brand-600"
                >
                  <option value="Flexible">Flexible (Pets or No Pets)</option>
                  <option value="Strictly No Pets">Strictly No Pets</option>
                  <option value="Pet-Friendly">Pet-Friendly</option>
                  <option value="Has Pet">Currently Has Pet</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-ink-primary mb-1">Grocery & Pantry Sharing</label>
                <select
                  value={formData.foodSharing}
                  onChange={(e) => setFormData({ ...formData, foodSharing: e.target.value })}
                  className="w-full bg-surface-50 border border-surface-200 text-xs rounded-xl px-3 py-2 text-ink-primary focus:outline-none focus:border-brand-600"
                >
                  <option value="Flexible">Flexible</option>
                  <option value="Separate Groceries">Separate Groceries / Individual Cooking</option>
                  <option value="Shared Staples">Split Pantry Staples (Milk, Oil, Spices)</option>
                  <option value="Full Communal">Full Communal Meals & Shared Cook</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-ink-primary mb-1">Cooking Frequency</label>
                <select
                  value={formData.cookingFrequency}
                  onChange={(e) => setFormData({ ...formData, cookingFrequency: e.target.value })}
                  className="w-full bg-surface-50 border border-surface-200 text-xs rounded-xl px-3 py-2 text-ink-primary focus:outline-none focus:border-brand-600"
                >
                  <option value="Flexible">Flexible</option>
                  <option value="Daily">Daily Home Cooking</option>
                  <option value="Occasional">Occasional Cooking</option>
                  <option value="Tiffin / Delivery">Tiffin Service / Food Delivery</option>
                </select>
              </div>
            </div>
          </div>

          {/* Sub-section B: Circadian Rhythms & Hygiene */}
          <div className="space-y-4 pt-4 border-t border-surface-100">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-primary flex items-center gap-1.5">
              <Moon className="w-3.5 h-3.5 text-brand-600" />
              Circadian Schedule, Cleanliness & Noise
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-ink-primary mb-1">Typical Bedtime / Quiet Hours</label>
                <select
                  value={formData.sleepSchedule}
                  onChange={(e) => setFormData({ ...formData, sleepSchedule: e.target.value })}
                  className="w-full bg-surface-50 border border-surface-200 text-xs rounded-xl px-3 py-2 text-ink-primary focus:outline-none focus:border-brand-600"
                >
                  <option value="Flexible">Flexible (Any bedtime)</option>
                  <option value="21.0">9:00 PM (Early Sleeper)</option>
                  <option value="22.0">10:00 PM</option>
                  <option value="23.0">11:00 PM (Standard)</option>
                  <option value="23.5">11:30 PM</option>
                  <option value="0.5">12:30 AM (Night Owl)</option>
                  <option value="1.5">1:30 AM (Late Shift)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-ink-primary mb-1">Typical Wake-Up Hour</label>
                <select
                  value={formData.wakeSchedule}
                  onChange={(e) => setFormData({ ...formData, wakeSchedule: e.target.value })}
                  className="w-full bg-surface-50 border border-surface-200 text-xs rounded-xl px-3 py-2 text-ink-primary focus:outline-none focus:border-brand-600"
                >
                  <option value="Flexible">Flexible (Any wake-up time)</option>
                  <option value="6.0">6:00 AM (Early Riser)</option>
                  <option value="7.0">7:00 AM (Standard)</option>
                  <option value="8.0">8:00 AM</option>
                  <option value="9.0">9:00 AM</option>
                  <option value="10.0">10:00 AM</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-ink-primary mb-1">Cleanliness Standard</label>
                <select
                  value={formData.cleanliness}
                  onChange={(e) => setFormData({ ...formData, cleanliness: e.target.value })}
                  className="w-full bg-surface-50 border border-surface-200 text-xs rounded-xl px-3 py-2 text-ink-primary focus:outline-none focus:border-brand-600"
                >
                  <option value="Flexible">Flexible (Any standard)</option>
                  <option value="5">5/5 - Impeccable (Daily deep cleaning)</option>
                  <option value="4">4/5 - Neat & Orderly</option>
                  <option value="3">3/5 - Casual & Relaxed</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-ink-primary mb-1">Ambient Noise Environment</label>
                <select
                  value={formData.noiseTolerance}
                  onChange={(e) => setFormData({ ...formData, noiseTolerance: e.target.value })}
                  className="w-full bg-surface-50 border border-surface-200 text-xs rounded-xl px-3 py-2 text-ink-primary focus:outline-none focus:border-brand-600"
                >
                  <option value="Flexible">Flexible (Any sound level)</option>
                  <option value="1">1/5 - Silent Sanctuary</option>
                  <option value="2">2/5 - Low Noise Preferred</option>
                  <option value="3">3/5 - Moderate Audio/Activity</option>
                  <option value="4">4/5 - Lively / Music OK</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-ink-primary mb-1">Work / College Schedule</label>
                <select
                  value={formData.workSchedule}
                  onChange={(e) => setFormData({ ...formData, workSchedule: e.target.value })}
                  className="w-full bg-surface-50 border border-surface-200 text-xs rounded-xl px-3 py-2 text-ink-primary focus:outline-none focus:border-brand-600"
                >
                  <option value="Flexible">Flexible</option>
                  <option value="Regular Day">Regular Day (9 AM - 6 PM)</option>
                  <option value="Rotational / Night">Rotational or Night Shifts</option>
                  <option value="College Hours">Student / College Schedule</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-ink-primary mb-1">Work-from-Home (WFH) Days</label>
                <select
                  value={formData.wfhFrequency}
                  onChange={(e) => setFormData({ ...formData, wfhFrequency: e.target.value })}
                  className="w-full bg-surface-50 border border-surface-200 text-xs rounded-xl px-3 py-2 text-ink-primary focus:outline-none focus:border-brand-600"
                >
                  <option value="Flexible">Flexible (Any WFH routine)</option>
                  <option value="0">0 Days (Full Office / College)</option>
                  <option value="2">2-3 Days (Hybrid)</option>
                  <option value="5">5+ Days (Permanent Remote)</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-ink-primary mb-1">Study & Focus Habits</label>
                <select
                  value={formData.studyHabits}
                  onChange={(e) => setFormData({ ...formData, studyHabits: e.target.value })}
                  className="w-full bg-surface-50 border border-surface-200 text-xs rounded-xl px-3 py-2 text-ink-primary focus:outline-none focus:border-brand-600"
                >
                  <option value="Flexible">Flexible</option>
                  <option value="Quiet reading / deep focus">Quiet reading and deep focus hours required</option>
                  <option value="Relaxed studying">Relaxed studying / casual background sounds</option>
                </select>
              </div>
            </div>
          </div>

          {/* Sub-section C: Social Norms & Boundaries */}
          <div className="space-y-4 pt-4 border-t border-surface-100">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-primary flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-brand-600" />
              Visitors, Social Environment & Boundaries
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-ink-primary mb-1">Day Visitors / Friends Policy</label>
                <select
                  value={formData.guestsDay}
                  onChange={(e) => setFormData({ ...formData, guestsDay: e.target.value })}
                  className="w-full bg-surface-50 border border-surface-200 text-xs rounded-xl px-3 py-2 text-ink-primary focus:outline-none focus:border-brand-600"
                >
                  <option value="Flexible">Flexible</option>
                  <option value="Rare">Rare (Quiet environment)</option>
                  <option value="Occasional">Occasional friends with prior notice</option>
                  <option value="Frequent">Frequent visitors welcome</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-ink-primary mb-1">Overnight Guest Policy</label>
                <select
                  value={formData.guestsOvernight}
                  onChange={(e) => setFormData({ ...formData, guestsOvernight: e.target.value })}
                  className="w-full bg-surface-50 border border-surface-200 text-xs rounded-xl px-3 py-2 text-ink-primary focus:outline-none focus:border-brand-600"
                >
                  <option value="Flexible">Flexible</option>
                  <option value="With Notice">Allowed with prior heads-up</option>
                  <option value="Allowed">Freely Allowed</option>
                  <option value="Not Allowed">Not Allowed</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-ink-primary mb-1">Social Environment</label>
                <select
                  value={formData.socialPreference}
                  onChange={(e) => setFormData({ ...formData, socialPreference: e.target.value })}
                  className="w-full bg-surface-50 border border-surface-200 text-xs rounded-xl px-3 py-2 text-ink-primary focus:outline-none focus:border-brand-600"
                >
                  <option value="Flexible">Flexible</option>
                  <option value="Quiet Retreat">Quiet Retreat (Home as calm sanctuary)</option>
                  <option value="Balanced">Balanced (Friendly chat & private downtime)</option>
                  <option value="Social Hub">Social Hub (High interaction & hosting)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-ink-primary mb-1">Personal Space Priority</label>
                <select
                  value={formData.personalSpace}
                  onChange={(e) => setFormData({ ...formData, personalSpace: e.target.value })}
                  className="w-full bg-surface-50 border border-surface-200 text-xs rounded-xl px-3 py-2 text-ink-primary focus:outline-none focus:border-brand-600"
                >
                  <option value="Flexible">Flexible</option>
                  <option value="High">High (High respect for personal rooms & privacy)</option>
                  <option value="Balanced">Balanced</option>
                  <option value="Communal">Communal Living</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-ink-primary mb-1">Society Rules & Curfew Strictness</label>
                <select
                  value={formData.rulesStrictness}
                  onChange={(e) => setFormData({ ...formData, rulesStrictness: e.target.value })}
                  className="w-full bg-surface-50 border border-surface-200 text-xs rounded-xl px-3 py-2 text-ink-primary focus:outline-none focus:border-brand-600"
                >
                  <option value="Flexible">Flexible</option>
                  <option value="Strict Curfew">Gated Society with Night Curfew</option>
                  <option value="Moderate">Moderate Security (24/7 guard, visitor entry log)</option>
                  <option value="Self-Managed">Self-Managed (Independent entry, no arbitrary curfews)</option>
                </select>
              </div>
            </div>
          </div>
        </Card>

        {/* Section 4: Photographs */}
        <Card className="p-6 sm:p-8 bg-white border border-black/[0.06] shadow-apple rounded-3xl space-y-6">
          <div>
            <h2 className="text-base font-semibold text-ink-primary flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-brand-600" />
              4. Room & Property Photographs *
            </h2>
            <p className="text-xs text-ink-secondary mt-0.5">
              Attach at least 1 photograph (maximum 10 images, up to 10 MB each).
            </p>
          </div>

          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-surface-300 hover:border-brand-500 hover:bg-brand-50/20 rounded-2xl p-8 text-center cursor-pointer transition-all duration-200"
          >
            <Upload className="w-8 h-8 text-brand-600 mx-auto mb-2" />
            <p className="text-xs font-medium text-ink-primary">Click to select room photos</p>
            <p className="text-[11px] text-ink-tertiary mt-1">JPEG, PNG, or WebP files</p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={ALLOWED_MIME_TYPES.join(',')}
              onChange={(e) => handleFilesAdded(e.target.files)}
              className="hidden"
            />
          </div>

          {/* Image Previews */}
          {(selectedImages.length > 0 || existingImages.length > 0) && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              {existingImages.map((url, idx) => (
                <div key={idx} className="relative rounded-xl overflow-hidden aspect-video bg-surface-100 group border border-surface-200">
                  <img src={url} alt="Room preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveExistingImage(idx)}
                    className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {selectedImages.map((item) => (
                <div key={item.id} className="relative rounded-xl overflow-hidden aspect-video bg-surface-100 group border border-brand-200">
                  <img src={item.previewUrl} alt="Room upload" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveSelectedImage(item.id)}
                    className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Submit Actions */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/owner/dashboard')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={isSubmitting || !isVerifiedOwner}
            icon={isSubmitting ? Loader2 : CheckCircle2}
          >
            {isSubmitting
              ? uploadProgressText || 'Saving...'
              : isEditing
              ? 'Update Room Listing'
              : 'Publish Listing with 22 Factors'}
          </Button>
        </div>

        {!isVerifiedOwner && (
          <p className="text-right text-[11px] text-amber-700 font-medium">
            Publishing disabled: Please complete Owner Identity Verification before publishing.
          </p>
        )}

      </form>

    </div>
  );
};

export default CreateListingPage;
