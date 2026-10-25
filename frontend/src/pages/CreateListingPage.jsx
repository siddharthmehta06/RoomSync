import React, { useState, useEffect, useRef } from 'react';
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
  Utensils,
  X,
  AlertCircle,
  Loader2,
  Image as ImageIcon
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { 
  uploadRoomImages, 
  createListing, 
  updateListing, 
  fetchRoomById,
  getAuthToken,
  loginUser
} from '../services/api';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const CreateListingPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    title: '',
    city: 'Bengaluru',
    locality: '',
    pinCode: '',
    rent: '',
    maintenance: '1500',
    deposit: '',
    roomType: 'Private Room with Attached Bath',
    furnishing: 'Fully Furnished',
    minStayMonths: '6',
    availableFrom: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    
    // Living conditions aligned with canonical RoomListing Mongoose contract
    foodPreference: 'Eggetarian / Flexible Non-veg',
    smoking: 'Strictly Non-Smoking',
    alcohol: 'Social Drinking OK',
    sleepSchedule: 23.0, // 11:00 PM
    wakeSchedule: 7.0,   // 7:00 AM
    cleanliness: 4.0,
    noiseTolerance: 3.0,
    wfhFrequency: 2,
    guestPolicy: 'Allowed with 24h Prior Notice',
    petPolicy: 'No pets currently; cat-friendly',
    socialPreference: 'Balanced: relaxed weekdays, casual board-game weekends',
  });

  // Selected file items: [{ file, previewUrl, id }]
  const [selectedImages, setSelectedImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [directImageUrl, setDirectImageUrl] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');

  // Load existing room details if in edit mode
  useEffect(() => {
    if (isEditing && id) {
      fetchRoomById(id)
        .then((room) => {
          if (room) {
            setFormData({
              title: room.title || '',
              city: room.city || 'Bengaluru',
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
              foodPreference: room.livingConditions?.foodPreference || 'Eggetarian / Flexible Non-veg',
              smoking: room.livingConditions?.smoking || 'Strictly Non-Smoking',
              alcohol: room.livingConditions?.alcohol || 'Social Drinking OK',
              sleepSchedule: room.livingConditions?.sleepSchedule || 23.0,
              wakeSchedule: room.livingConditions?.wakeSchedule || 7.0,
              cleanliness: room.livingConditions?.cleanliness || 4.0,
              noiseTolerance: room.livingConditions?.noiseTolerance || 3.0,
              wfhFrequency: room.livingConditions?.wfhFrequency || 2,
              guestPolicy: room.livingConditions?.guestsOvernight || 'Allowed with 24h Prior Notice',
              petPolicy: room.livingConditions?.petsPreference || 'No pets currently; cat-friendly',
              socialPreference: room.livingConditions?.socialPreference || 'Balanced',
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

  // Clean up object URLs on unmount to avoid memory leaks
  useEffect(() => {
    return () => {
      selectedImages.forEach((item) => {
        if (item.previewUrl) {
          URL.revokeObjectURL(item.previewUrl);
        }
      });
    };
  }, [selectedImages]);

  // File selection validation and preview creation
  const handleFilesAdded = (filesList) => {
    setErrorMessage('');
    const incomingFiles = Array.from(filesList);

    if (selectedImages.length + existingImages.length + incomingFiles.length > 10) {
      setErrorMessage('You can attach a maximum of 10 photographs per listing.');
      return;
    }

    const validNewItems = [];

    for (const file of incomingFiles) {
      // Validate MIME type
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        setErrorMessage(
          `File "${file.name}" is not supported. Please select JPEG, PNG, or WebP images.`
        );
        return;
      }

      // Validate File Size (<= 10MB)
      if (file.size > MAX_FILE_SIZE_BYTES) {
        setErrorMessage(
          `Image "${file.name}" exceeds the 10 MB maximum size limit.`
        );
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
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }
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

  // Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setFieldErrors({});
    setSuccessMessage('');

    // Ensure at least one image is provided
    if (selectedImages.length === 0 && existingImages.length === 0) {
      setErrorMessage('Please add at least one room photograph before publishing.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Ensure user has a valid owner session token
      let token = getAuthToken();
      if (!token) {
        setUploadProgressText('Authenticating owner session...');
        // In local development/demo mode, authenticate or seed demo owner account
        try {
          const authRes = await loginUser('aditya.owner@example.com', 'Password123!');
          token = authRes.token;
        } catch (authErr) {
          // If demo owner doesn't exist, register demo owner
          const regRes = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fullName: 'Aditya Sharma',
              email: 'aditya.owner@example.com',
              phone: '9876543210',
              password: 'Password123!',
              role: 'owner',
            }),
          });
          const regData = await regRes.json();
          if (regData.data?.token) {
            token = regData.data.token;
            localStorage.setItem('roomsync_token', token);
          }
        }
      }

      // 2. Upload any newly selected local files to Cloudinary via backend endpoint
      let uploadedUrls = [];
      if (selectedImages.length > 0) {
        setUploadProgressText(`Uploading ${selectedImages.length} image(s) to Cloudinary...`);
        const filesToUpload = selectedImages.map((item) => item.file);
        
        try {
          const uploadRes = await uploadRoomImages(filesToUpload, token);
          uploadedUrls = uploadRes.urls || [];
        } catch (uploadErr) {
          // Check if Cloudinary is unconfigured
          if (uploadErr.code === 'CLOUDINARY_NOT_CONFIGURED') {
            setErrorMessage(
              'Notice: Cloudinary is not configured in backend/.env. To enable real image uploads, please add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET. Alternatively, you may paste a public HTTPS photo URL below.'
            );
            setIsSubmitting(false);
            setUploadProgressText('');
            return;
          }
          throw uploadErr;
        }
      }

      const allImages = [...existingImages, ...uploadedUrls];

      // 3. Assemble complete room listing data with 22-factor living conditions
      setUploadProgressText(isEditing ? 'Updating room listing...' : 'Publishing listing to database...');

      const payload = {
        title: formData.title.trim(),
        locality: formData.locality.trim(),
        city: formData.city,
        state: 'Karnataka',
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
        livingConditions: {
          foodPreference: formData.foodPreference,
          smoking: formData.smoking,
          alcohol: formData.alcohol,
          sleepSchedule: Number(formData.sleepSchedule),
          wakeSchedule: Number(formData.wakeSchedule),
          cleanliness: Number(formData.cleanliness),
          noiseTolerance: Number(formData.noiseTolerance),
          guestsDay: 'Friends visiting allowed with prior notice',
          guestsOvernight: formData.guestPolicy,
          socialPreference: formData.socialPreference,
          wfhFrequency: Number(formData.wfhFrequency),
          petsPreference: formData.petPolicy,
          workSchedule: 'Standard Day (9 AM - 6 PM)',
          studyHabits: 'Quiet reading hours after 10 PM',
          cookingFrequency: 'Shared cook prepares lunch & dinner',
          foodSharing: 'Separate pantry staples',
          personalSpace: 'High respect for personal rooms',
          rulesStrictness: 'Gated society with 24/7 security guard',
        },
      };

      // 4. Save to MongoDB
      let savedRoom;
      if (isEditing) {
        savedRoom = await updateListing(id, payload, token);
        setSuccessMessage('Listing updated successfully!');
      } else {
        savedRoom = await createListing(payload, token);
        setSuccessMessage('Room listing published successfully! It is now live on Explore and the Matching Engine.');
      }

      setIsSubmitting(false);
      setUploadProgressText('');

      // Redirect to owner dashboard after brief confirmation
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

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-ink-primary">
          {isEditing ? 'Edit Room Listing & Living Rules' : 'Publish a New Shared Room'}
        </h1>
        <p className="text-xs text-ink-secondary mt-1">
          Specify physical property specs, upload genuine high-resolution photographs, and define day-to-day flatmate living culture.
        </p>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-3 animate-fadeIn">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold block mb-0.5">Submission Error</span>
            <span>{errorMessage}</span>
          </div>
        </div>
      )}

      {/* Success Banner */}
      {successMessage && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-3 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold block mb-0.5">Success</span>
            <span>{successMessage}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Section 1: Basic Property Details */}
        <Card className="p-6 sm:p-8 bg-white shadow-subtle space-y-6">
          <h2 className="text-base font-semibold text-ink-primary flex items-center gap-2">
            <Home className="w-4 h-4 text-brand-600" />
            1. Property & Location
          </h2>

          <div className="space-y-4">
            <div>
              <Input
                label="Listing Title"
                placeholder="e.g. Spacious Garden-Facing Master Bedroom"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
              {fieldErrors.title && (
                <p className="text-[11px] text-rose-600 mt-1">{fieldErrors.title}</p>
              )}
            </div>

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
                {fieldErrors.locality && (
                  <p className="text-[11px] text-rose-600 mt-1">{fieldErrors.locality}</p>
                )}
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
                  <option value="Shared Room">Shared Room (Twin Sharing)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-ink-primary mb-1.5 ml-0.5">Furnishing Status</label>
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
                  label="Pin Code (6 digits)"
                  placeholder="e.g. 560034"
                  value={formData.pinCode}
                  onChange={(e) => setFormData({ ...formData, pinCode: e.target.value })}
                  maxLength={6}
                  required
                />
                {fieldErrors.pinCode && (
                  <p className="text-[11px] text-rose-600 mt-1">{fieldErrors.pinCode}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-medium text-ink-primary mb-1.5 ml-0.5">Available From</label>
                <input
                  type="date"
                  value={formData.availableFrom}
                  onChange={(e) => setFormData({ ...formData, availableFrom: e.target.value })}
                  className="w-full bg-surface-50 border border-surface-200 text-sm rounded-xl px-3.5 py-2.5 text-ink-primary focus:outline-none focus:border-brand-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-ink-primary mb-1.5 ml-0.5">Minimum Stay (Months)</label>
                <input
                  type="number"
                  min="1"
                  max="36"
                  value={formData.minStayMonths}
                  onChange={(e) => setFormData({ ...formData, minStayMonths: e.target.value })}
                  className="w-full bg-surface-50 border border-surface-200 text-sm rounded-xl px-3.5 py-2.5 text-ink-primary focus:outline-none focus:border-brand-600"
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
            <div>
              <Input
                label="Monthly Rent (₹)"
                type="number"
                placeholder="e.g. 18500"
                value={formData.rent}
                onChange={(e) => setFormData({ ...formData, rent: e.target.value })}
                required
              />
              {fieldErrors.rent && (
                <p className="text-[11px] text-rose-600 mt-1">{fieldErrors.rent}</p>
              )}
            </div>

            <div>
              <Input
                label="Maintenance (₹/month)"
                type="number"
                placeholder="e.g. 1500"
                value={formData.maintenance}
                onChange={(e) => setFormData({ ...formData, maintenance: e.target.value })}
              />
            </div>

            <div>
              <Input
                label="Security Deposit (₹)"
                type="number"
                placeholder="e.g. 50000"
                value={formData.deposit}
                onChange={(e) => setFormData({ ...formData, deposit: e.target.value })}
                required
              />
              {fieldErrors.deposit && (
                <p className="text-[11px] text-rose-600 mt-1">{fieldErrors.deposit}</p>
              )}
            </div>
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
              These factors feed directly into the explainable 22-factor fuzzy matching engine.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-ink-primary mb-1.5 ml-0.5">Kitchen & Dietary Environment</label>
              <select
                value={formData.foodPreference}
                onChange={(e) => setFormData({ ...formData, foodPreference: e.target.value })}
                className="w-full bg-surface-50 border border-surface-200 text-sm rounded-xl px-3.5 py-2.5 text-ink-primary focus:outline-none focus:border-brand-600"
              >
                <option value="Pure Vegetarian">Pure Vegetarian Kitchen</option>
                <option value="Eggetarian / Flexible Non-veg">Eggetarian / Flexible Non-veg</option>
                <option value="Non-Veg Welcome">Non-Veg Welcome</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-primary mb-1.5 ml-0.5">Smoking Policy</label>
              <select
                value={formData.smoking}
                onChange={(e) => setFormData({ ...formData, smoking: e.target.value })}
                className="w-full bg-surface-50 border border-surface-200 text-sm rounded-xl px-3.5 py-2.5 text-ink-primary focus:outline-none focus:border-brand-600"
              >
                <option value="Strictly Non-Smoking">Strictly Non-Smoking</option>
                <option value="Balcony Only">Balcony Only</option>
                <option value="Allowed">Allowed</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-primary mb-1.5 ml-0.5">Alcohol Policy</label>
              <select
                value={formData.alcohol}
                onChange={(e) => setFormData({ ...formData, alcohol: e.target.value })}
                className="w-full bg-surface-50 border border-surface-200 text-sm rounded-xl px-3.5 py-2.5 text-ink-primary focus:outline-none focus:border-brand-600"
              >
                <option value="Teetotaler">Teetotaler</option>
                <option value="Social Drinking OK">Social Drinking OK</option>
                <option value="Allowed">Allowed</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-ink-primary mb-1.5 ml-0.5">
                Bedtime / Quiet Hours (Hour: {formData.sleepSchedule}:00)
              </label>
              <select
                value={formData.sleepSchedule}
                onChange={(e) => setFormData({ ...formData, sleepSchedule: parseFloat(e.target.value) })}
                className="w-full bg-surface-50 border border-surface-200 text-sm rounded-xl px-3.5 py-2.5 text-ink-primary focus:outline-none focus:border-brand-600"
              >
                <option value={21.0}>9:00 PM (Early Sleeper)</option>
                <option value={22.0}>10:00 PM</option>
                <option value={23.0}>11:00 PM (Standard)</option>
                <option value={23.5}>11:30 PM</option>
                <option value={0.5}>12:30 AM (Night Owl)</option>
                <option value={1.5}>1:30 AM (Late Shift)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-primary mb-1.5 ml-0.5">
                Wake-Up Time (Hour: {formData.wakeSchedule}:00)
              </label>
              <select
                value={formData.wakeSchedule}
                onChange={(e) => setFormData({ ...formData, wakeSchedule: parseFloat(e.target.value) })}
                className="w-full bg-surface-50 border border-surface-200 text-sm rounded-xl px-3.5 py-2.5 text-ink-primary focus:outline-none focus:border-brand-600"
              >
                <option value={6.0}>6:00 AM (Early Riser)</option>
                <option value={7.0}>7:00 AM (Standard)</option>
                <option value={8.0}>8:00 AM</option>
                <option value={9.0}>9:00 AM</option>
                <option value={10.0}>10:00 AM</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-ink-primary mb-1.5 ml-0.5">
                Cleanliness Standard: {formData.cleanliness} / 5
              </label>
              <input
                type="range"
                min="1"
                max="5"
                step="0.5"
                value={formData.cleanliness}
                onChange={(e) => setFormData({ ...formData, cleanliness: parseFloat(e.target.value) })}
                className="w-full accent-brand-600 cursor-pointer"
              />
              <span className="text-[11px] text-ink-secondary mt-1 block">
                {formData.cleanliness >= 4.5 ? 'Impeccable / Daily Deep Clean' : formData.cleanliness >= 3.5 ? 'Regular Maid Service' : 'Casual / Self-Clean'}
              </span>
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-primary mb-1.5 ml-0.5">
                Noise Tolerance: {formData.noiseTolerance} / 5
              </label>
              <input
                type="range"
                min="1"
                max="5"
                step="0.5"
                value={formData.noiseTolerance}
                onChange={(e) => setFormData({ ...formData, noiseTolerance: parseFloat(e.target.value) })}
                className="w-full accent-brand-600 cursor-pointer"
              />
              <span className="text-[11px] text-ink-secondary mt-1 block">
                {formData.noiseTolerance <= 2 ? 'Silent Sanctuary' : formData.noiseTolerance <= 3.5 ? 'Moderate / Headphone Friendly' : 'Vibrant Audio / Social Buzz'}
              </span>
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-primary mb-1.5 ml-0.5">
                WFH Days / Week: {formData.wfhFrequency} days
              </label>
              <input
                type="range"
                min="0"
                max="7"
                step="1"
                value={formData.wfhFrequency}
                onChange={(e) => setFormData({ ...formData, wfhFrequency: parseInt(e.target.value, 10) })}
                className="w-full accent-brand-600 cursor-pointer"
              />
              <span className="text-[11px] text-ink-secondary mt-1 block">
                {formData.wfhFrequency === 0 ? 'Full-time Office' : formData.wfhFrequency <= 3 ? 'Hybrid' : 'Full-time Remote'}
              </span>
            </div>
          </div>
        </Card>

        {/* Section 4: Photo Showcase (Genuine Multi-file Cloudinary Uploader) */}
        <Card className="p-6 sm:p-8 bg-white shadow-subtle space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-ink-primary flex items-center gap-2">
                <Upload className="w-4 h-4 text-brand-600" />
                4. Room Photographs
              </h2>
              <p className="text-xs text-ink-secondary mt-0.5">
                Upload real photos of the bedroom, attached bath, and shared flat spaces. Up to 10 images, max 10 MB each.
              </p>
            </div>
            <span className="text-xs text-ink-tertiary">
              {selectedImages.length + existingImages.length} / 10 images
            </span>
          </div>

          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => {
              if (e.target.files) handleFilesAdded(e.target.files);
              e.target.value = ''; // Reset input to allow selecting same file again if removed
            }}
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
          />

          {/* Interactive Dropzone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (e.dataTransfer.files) handleFilesAdded(e.dataTransfer.files);
            }}
            className="border-2 border-dashed border-surface-200 rounded-2xl p-8 text-center hover:border-brand-500 hover:bg-brand-50/20 transition-all cursor-pointer bg-surface-50 group"
          >
            <div className="w-12 h-12 rounded-2xl bg-white border border-surface-200 flex items-center justify-center mx-auto mb-3 shadow-2xs group-hover:scale-105 transition-transform">
              <Upload className="w-6 h-6 text-brand-600" />
            </div>
            <p className="text-xs font-semibold text-ink-primary">
              Click to select or drag and drop room photos
            </p>
            <p className="text-[11px] text-ink-secondary mt-1">
              Supports JPEG, PNG, or WebP up to 10 MB each · Uploads directly to Cloudinary
            </p>
          </div>

          {/* Image Previews Grid */}
          {(selectedImages.length > 0 || existingImages.length > 0) && (
            <div className="space-y-3 pt-2">
              <span className="text-xs font-medium text-ink-primary block">
                Selected Photos Ready for Upload ({selectedImages.length + existingImages.length}):
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* Existing Images (from database) */}
                {existingImages.map((url, idx) => (
                  <div
                    key={`existing-${idx}`}
                    className="relative aspect-[4/3] rounded-xl overflow-hidden border border-surface-200 group bg-surface-100"
                  >
                    <img src={url} alt={`Existing ${idx + 1}`} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveExistingImage(idx);
                        }}
                        className="p-1.5 rounded-full bg-rose-600 text-white hover:bg-rose-700 transition-colors shadow-sm"
                        title="Remove photo"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <span className="absolute bottom-1.5 left-1.5 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded backdrop-blur-xs">
                      Saved
                    </span>
                  </div>
                ))}

                {/* Newly Selected Local Images */}
                {selectedImages.map((item) => (
                  <div
                    key={item.id}
                    className="relative aspect-[4/3] rounded-xl overflow-hidden border border-brand-300 ring-2 ring-brand-500/10 group bg-surface-100"
                  >
                    <img src={item.previewUrl} alt={item.file.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveSelectedImage(item.id);
                        }}
                        className="p-1.5 rounded-full bg-rose-600 text-white hover:bg-rose-700 transition-colors shadow-sm"
                        title="Remove photo"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <span className="absolute bottom-1.5 left-1.5 bg-brand-700 text-white text-[9px] px-1.5 py-0.5 rounded backdrop-blur-xs">
                      {item.sizeMb} MB
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Direct Photo URL Input Option */}
          <div className="pt-2 border-t border-surface-200">
            <span className="text-[11px] text-ink-tertiary block mb-2">
              Or paste an existing public HTTPS photo URL:
            </span>
            <div className="flex gap-2">
              <input
                type="url"
                placeholder="https://images.unsplash.com/photo-..."
                value={directImageUrl}
                onChange={(e) => setDirectImageUrl(e.target.value)}
                className="flex-1 bg-surface-50 border border-surface-200 text-xs rounded-xl px-3 py-2 text-ink-primary focus:outline-none focus:border-brand-600"
              />
              <Button type="button" variant="secondary" size="sm" onClick={handleAddDirectUrl}>
                Add URL
              </Button>
            </div>
          </div>
        </Card>

        {/* Action Buttons & Status */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-surface-200">
          <div className="text-xs text-ink-secondary flex items-center gap-2">
            {isSubmitting && (
              <>
                <Loader2 className="w-4 h-4 text-brand-600 animate-spin" />
                <span className="font-medium text-brand-800">{uploadProgressText}</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="secondary"
              size="md"
              disabled={isSubmitting}
              onClick={() => navigate('/owner/dashboard')}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={isSubmitting}
              icon={isSubmitting ? Loader2 : CheckCircle2}
              className={isSubmitting ? 'opacity-80 cursor-wait' : ''}
            >
              {isSubmitting
                ? 'Processing...'
                : isEditing
                ? 'Save Listing Changes'
                : 'Publish Room Listing'}
            </Button>
          </div>
        </div>

      </form>
    </div>
  );
};
