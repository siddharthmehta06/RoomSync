/**
 * RoomSync API Client Layer
 * Handles all HTTP interactions between the React client and the Express backend.
 * Integrates real backend endpoints with resilient fallbacks for development.
 */

import { MOCK_ROOMS } from '../data/mockRooms';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// ==========================================
// Authentication Storage Helpers
// ==========================================

export function getAuthToken() {
  return localStorage.getItem('roomsync_token') || null;
}

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem('roomsync_token', token);
  } else {
    localStorage.removeItem('roomsync_token');
  }
}

export function getAuthUser() {
  try {
    const raw = localStorage.getItem('roomsync_user');
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function setAuthUser(user) {
  if (user) {
    localStorage.setItem('roomsync_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('roomsync_user');
  }
}

export function clearAuth() {
  localStorage.removeItem('roomsync_token');
  localStorage.removeItem('roomsync_user');
}

function getAuthHeaders(customToken) {
  const token = customToken || getAuthToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// ==========================================
// Authentication API
// ==========================================

export async function loginUser(email, password) {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || data.message || 'Login failed');
  }

  if (data.data?.token) {
    setAuthToken(data.data.token);
    setAuthUser(data.data.user);
  }

  return data.data;
}

export async function registerUser(userData) {
  const res = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || data.message || 'Registration failed');
  }

  if (data.data?.token) {
    setAuthToken(data.data.token);
    setAuthUser(data.data.user);
  }

  return data.data;
}

export async function getMe(customToken) {
  const res = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: getAuthHeaders(customToken),
  });

  if (!res.ok) {
    throw new Error('Failed to get current user session');
  }

  const data = await res.json();
  return data.data;
}

/**
 * Log in or auto-register a demo user (Seeker or Owner) for quick testing
 */
export async function loginDemoUser(role = 'seeker') {
  const isOwner = role === 'owner';
  const credentials = isOwner
    ? {
        fullName: 'Aditya Sharma',
        email: 'aditya.owner@example.com',
        phone: '9876543210',
        password: 'Password123!',
        role: 'owner',
      }
    : {
        fullName: 'Priya Patel',
        email: 'seeker.priya@example.com',
        phone: '9876543219',
        password: 'Password123!',
        role: 'seeker',
      };

  try {
    const data = await loginUser(credentials.email, credentials.password);
    return data;
  } catch (err) {
    try {
      const data = await registerUser(credentials);
      return data;
    } catch (regErr) {
      throw err;
    }
  }
}

// ==========================================
// Room Listings API
// ==========================================

/**
 * Fetch all rooms with optional filtering
 */
export async function fetchRooms(params = {}) {
  try {
    const query = new URLSearchParams();
    if (params.city && params.city !== 'All') query.set('city', params.city);
    if (params.locality && params.locality !== 'All') query.set('locality', params.locality);
    if (params.maxRent) query.set('maxRent', params.maxRent);
    if (params.furnishing && params.furnishing !== 'All') {
      query.set('furnishing', params.furnishing);
    }

    const res = await fetch(`${API_BASE_URL}/rooms?${query.toString()}`);
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json.data)) {
        return json.data.map((r) => ({
          ...r,
          id: r.id || r._id,
          compatibilityScore: typeof r.compatibilityScore === 'number' ? r.compatibilityScore : null,
          rankingScore: typeof r.rankingScore === 'number' ? r.rankingScore : null,
          strengths: r.strengths || [],
          mismatches: r.mismatches || [],
        }));
      }
    }
  } catch (error) {
    console.warn('[API Client] Backend fetchRooms error, falling back to mock:', error.message);
  }

  // Graceful fallback to MOCK_ROOMS if database has 0 rooms or during offline dev
  await new Promise((resolve) => setTimeout(resolve, 80));
  let results = [...MOCK_ROOMS];

  if (params.city && params.city !== 'All') {
    results = results.filter(
      (r) => r.city.toLowerCase() === params.city.toLowerCase()
    );
  }

  if (params.maxRent) {
    results = results.filter((r) => r.rent <= Number(params.maxRent));
  }

  return results.map((r) => ({
    ...r,
    compatibilityScore: typeof r.compatibilityScore === 'number' ? r.compatibilityScore : null,
  }));
}

/**
 * Fetch single room by ID
 */
export async function fetchRoomById(id, customToken) {
  try {
    const res = await fetch(`${API_BASE_URL}/rooms/${id}`, {
      headers: getAuthHeaders(customToken),
    });
    if (res.ok) {
      const json = await res.json();
      if (json.data) {
        const r = json.data;
        return {
          ...r,
          id: r.id || r._id,
          compatibilityScore: typeof r.compatibilityScore === 'number' ? r.compatibilityScore : null,
          rankingScore: typeof r.rankingScore === 'number' ? r.rankingScore : null,
          strengths: r.strengths || [],
          mismatches: r.mismatches || [],
          reviewSummary: r.reviewSummary || { ratingAverage: null, ratingCount: 0, reviews: [], myReview: null },
          owner: r.owner
            ? {
                id: r.owner._id || r.owner.id,
                _id: r.owner._id || r.owner.id,
                name: r.owner.fullName || r.owner.name || 'Property Owner',
                fullName: r.owner.fullName || r.owner.name || 'Property Owner',
                role: r.owner.role === 'owner' ? 'Property Owner / Landlord' : (r.owner.role || 'Property Host'),
                phone: r.owner.phone || '',
                email: r.owner.email || '',
                bio: r.owner.bio || '',
                city: r.owner.city || '',
                avatar: r.owner.avatar || null,
                isVerified: Boolean(r.owner.isVerified),
                verified: Boolean(r.owner.isVerified),
              }
            : null,
        };
      }
    }
  } catch (error) {
    console.warn('[API Client] fetchRoomById fallback:', error.message);
  }

  const room = MOCK_ROOMS.find((r) => r.id === id);
  if (!room) {
    throw new Error(`Room with ID "${id}" was not found.`);
  }
  return room;
}

export async function submitRoomReview(roomId, review, customToken) {
  const res = await fetch(`${API_BASE_URL}/rooms/${roomId}/reviews`, {
    method: 'POST',
    headers: getAuthHeaders(customToken),
    body: JSON.stringify(review),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error?.message || data.message || 'Could not submit your review.');
  }
  return data.data;
}

/**
 * Upload high-resolution room photographs to Cloudinary via server-side endpoint
 */
export async function uploadRoomImages(files, customToken) {
  const token = customToken || getAuthToken();
  const formData = new FormData();

  for (const file of files) {
    formData.append('images', file);
  }

  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}/rooms/upload-images`, {
    method: 'POST',
    headers,
    body: formData,
  });

  const data = await res.json();

  if (!res.ok) {
    const errorMsg =
      data.error?.message || data.message || 'Image upload failed.';
    const error = new Error(errorMsg);
    error.code = data.error?.code || 'UPLOAD_FAILED';
    error.details = data.error?.details || [];
    throw error;
  }

  return data.data; // { urls: [...], count: N }
}

/**
 * Publish a new room listing in MongoDB
 */
export async function createListing(listingData, customToken) {
  const res = await fetch(`${API_BASE_URL}/rooms`, {
    method: 'POST',
    headers: getAuthHeaders(customToken),
    body: JSON.stringify(listingData),
  });

  const data = await res.json();

  if (!res.ok) {
    const errorMsg =
      data.error?.message || data.message || 'Failed to publish listing.';
    const error = new Error(errorMsg);
    error.code = data.error?.code || 'VALIDATION_ERROR';
    error.details = data.error?.details || [];
    throw error;
  }

  return data.data;
}

/**
 * Update an existing room listing in MongoDB
 */
export async function updateListing(id, listingData, customToken) {
  const res = await fetch(`${API_BASE_URL}/rooms/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(customToken),
    body: JSON.stringify(listingData),
  });

  const data = await res.json();

  if (!res.ok) {
    const errorMsg =
      data.error?.message || data.message || 'Failed to update listing.';
    const error = new Error(errorMsg);
    error.code = data.error?.code || 'VALIDATION_ERROR';
    error.details = data.error?.details || [];
    throw error;
  }

  return data.data;
}

/**
 * Fetch listings published by the currently authenticated owner
 */
export async function fetchMyListings(customToken) {
  try {
    const res = await fetch(`${API_BASE_URL}/rooms/owner/my-listings`, {
      headers: getAuthHeaders(customToken),
    });

    if (res.ok) {
      const data = await res.json();
      return (data.data || []).map((r) => ({
        ...r,
        id: r.id || r._id,
      }));
    }
  } catch (error) {
    console.warn('[API Client] fetchMyListings fallback:', error.message);
  }

  return [];
}

// ==========================================
// Explainable Matching API
// ==========================================

export async function fetchCompatibilityPreview(roomId, customToken) {
  const token = customToken || getAuthToken();
  const res = await fetch(`${API_BASE_URL}/rooms/${roomId}/compatibility-preview`, {
    method: 'POST',
    headers: getAuthHeaders(token),
  });

  const data = await res.json();
  if (!res.ok) {
    const error = new Error(data.error?.message || data.message || 'Failed to fetch compatibility preview');
    error.code = data.error?.code || 'PREVIEW_ERROR';
    error.completedCount = data.error?.completedCount;
    error.totalFactors = data.error?.totalFactors;
    error.progressText = data.error?.progressText;
    error.missingFactors = data.error?.missingFactors;
    throw error;
  }

  return data.data;
}

// ==========================================
// Real-Time Chat & Messaging API
// ==========================================


/**
 * Fetch all conversations for the authenticated user
 */
export async function fetchConversations(customToken) {
  const res = await fetch(`${API_BASE_URL}/conversations`, {
    headers: getAuthHeaders(customToken),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error?.message || 'Failed to fetch conversations.');
  }

  const data = await res.json();
  return data.data || [];
}

/**
 * Create or retrieve an existing conversation thread with another user or for a room
 */
export async function createOrGetConversation(recipientIdOrOptions, maybeRoomId, customToken) {
  let body = {};
  let token = customToken;

  if (typeof recipientIdOrOptions === 'object' && recipientIdOrOptions !== null) {
    body = {
      recipientId: recipientIdOrOptions.recipientId,
      roomId: recipientIdOrOptions.roomId,
    };
    token = maybeRoomId || customToken;
  } else {
    body = {
      recipientId: recipientIdOrOptions,
      roomId: maybeRoomId,
    };
  }

  const res = await fetch(`${API_BASE_URL}/conversations`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) {
    const errorMsg = data.error?.message || data.message || 'Failed to open conversation.';
    const error = new Error(errorMsg);
    error.code = data.error?.code || 'VALIDATION_ERROR';
    error.details = data.error?.details || [];
    throw error;
  }

  return data.data;
}

/**
 * Fetch paginated message history for a conversation
 */
export async function fetchMessages(conversationId, customToken) {
  const res = await fetch(`${API_BASE_URL}/conversations/${conversationId}/messages`, {
    headers: getAuthHeaders(customToken),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error?.message || 'Failed to load messages.');
  }

  const data = await res.json();
  return data.data || [];
}

/**
 * Send a message via REST fallback
 */
export async function sendConversationMessage(conversationId, text, customToken) {
  const res = await fetch(`${API_BASE_URL}/conversations/${conversationId}/messages`, {
    method: 'POST',
    headers: getAuthHeaders(customToken),
    body: JSON.stringify({ text }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(
      data.error?.message || data.message || 'Failed to send message.'
    );
  }

  return data.data;
}

// ==========================================
// Compatibility Matches & Saved Rooms API
// ==========================================

export async function fetchMatches(customToken) {
  const token = customToken || getAuthToken();
  if (!token) {
    const error = new Error('Authentication required to calculate matches');
    error.code = 'AUTH_REQUIRED';
    throw error;
  }

  const res = await fetch(`${API_BASE_URL}/matches`, {
    headers: getAuthHeaders(token),
  });

  const data = await res.json();
  if (!res.ok) {
    const error = new Error(data.message || 'Failed to calculate matches');
    error.code = data.error?.code || 'FETCH_ERROR';
    throw error;
  }

  const list = Array.isArray(data.data) ? data.data : [];
  return list.map((m) => {
    const roomObj = m.room || {};
    return {
      id: roomObj.id || m.id || m._id || m.roomId,
      _id: roomObj.id || m.id || m._id || m.roomId,
      title: roomObj.title || m.title || 'Residential Room',
      locality: roomObj.locality || m.locality || 'Bangalore',
      city: roomObj.city || m.city || 'Bangalore',
      rent: roomObj.rent || m.rent || 0,
      maintenance: roomObj.maintenance || m.maintenance || 0,
      deposit: roomObj.deposit || m.deposit || 0,
      roomType: roomObj.roomType || m.roomType || 'Private Room',
      furnishing: roomObj.furnishing || m.furnishing || 'Furnished',
      images: (roomObj.images && roomObj.images.length > 0)
        ? roomObj.images
        : (m.images && m.images.length > 0 ? m.images : ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80']),
      owner: roomObj.owner || m.owner,
      compatibilityScore: m.compatibilityScore || 0,
      rankingScore: m.rankingScore || 0,
      strengths: m.strengths || [],
      mismatches: m.mismatches || [],
      factorBreakdown: m.factorBreakdown || {},
      eligible: m.algorithmMetadata ? m.algorithmMetadata.hardConstraintPassed : (m.eligible !== false),
    };
  });
}

export async function fetchSavedRooms(customToken) {
  try {
    const token = customToken || getAuthToken();
    if (token) {
      const res = await fetch(`${API_BASE_URL}/saved-rooms`, {
        headers: getAuthHeaders(token),
      });
      if (res.ok) {
        const data = await res.json();
        return (data.data || []).map((r) => ({
          ...r,
          id: r.id || r._id,
          owner: r.owner ? {
            ...r.owner,
            id: r.owner._id || r.owner.id,
            name: r.owner.fullName || r.owner.name,
          } : null,
        }));
      }
    }
  } catch (err) {
    console.warn('[API Client] fetchSavedRooms fallback:', err.message);
  }

  return [];
}

export async function saveRoom(roomId, customToken) {
  const token = customToken || getAuthToken();
  const res = await fetch(`${API_BASE_URL}/saved-rooms/${roomId}`, {
    method: 'POST',
    headers: getAuthHeaders(token),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || data.message || 'Failed to save room.');
  }
  return data;
}

export async function removeSavedRoom(roomId, customToken) {
  const token = customToken || getAuthToken();
  const res = await fetch(`${API_BASE_URL}/saved-rooms/${roomId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(token),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || data.message || 'Failed to remove saved room.');
  }
  return data;
}

// ==========================================
// User Profile & Preferences API
// ==========================================

export async function fetchUserProfile(customToken) {
  const token = customToken || getAuthToken();
  const res = await fetch(`${API_BASE_URL}/users/profile`, {
    headers: getAuthHeaders(token),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error?.message || 'Failed to load user profile.');
  }

  const data = await res.json();
  return data.data;
}

export async function updateUserProfile(profileData, customToken) {
  const token = customToken || getAuthToken();
  const res = await fetch(`${API_BASE_URL}/users/profile`, {
    method: 'PUT',
    headers: getAuthHeaders(token),
    body: JSON.stringify(profileData),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || data.message || 'Failed to update profile.');
  }

  return data.data;
}

export async function fetchPreferences(customToken) {
  const token = customToken || getAuthToken();
  const res = await fetch(`${API_BASE_URL}/preferences`, {
    headers: getAuthHeaders(token),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error?.message || 'Failed to load preferences.');
  }

  const data = await res.json();
  return data.data;
}

/**
 * Fetch the 22-factor questionnaire and completion status for the current seeker
 */
export async function fetchSeekerQuestionnaire(customToken) {
  const token = customToken || getAuthToken();
  const res = await fetch(`${API_BASE_URL}/preferences`, {
    headers: getAuthHeaders(token),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error?.message || data.message || 'Failed to load seeker questionnaire.');
  }

  return {
    profile: data.data,
    factors: data.data?.factors || {},
    completion: data.completion || {
      completedCount: 0,
      totalFactors: 22,
      isComplete: false,
      progressPercentage: 0,
      missingFactors: [],
    },
  };
}

/**
 * Save partial draft or complete 22-factor questionnaire for the current seeker
 */
export async function saveSeekerQuestionnaire(factors, customToken) {
  const token = customToken || getAuthToken();
  const res = await fetch(`${API_BASE_URL}/preferences`, {
    method: 'PUT',
    headers: getAuthHeaders(token),
    body: JSON.stringify({ factors }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errorMsg = data.error?.message || data.message || 'Failed to save questionnaire responses.';
    const err = new Error(errorMsg);
    err.details = data.error?.details || [];
    err.code = data.error?.code;
    throw err;
  }

  return {
    profile: data.data,
    factors: data.data?.factors || factors,
    completion: data.completion || {},
  };
}

/**
 * Pre-validate 22-factor questionnaire answers on the backend without saving
 */
export async function validateSeekerQuestionnaire(factors, customToken) {
  const token = customToken || getAuthToken();
  const res = await fetch(`${API_BASE_URL}/preferences/validate`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify({ factors }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error?.message || data.message || 'Validation request failed.');
  }

  return data;
}

/**
 * Fetch a specific room listing questionnaire
 */
export async function fetchRoomQuestionnaire(roomId, customToken) {
  const token = customToken || getAuthToken();
  const res = await fetch(`${API_BASE_URL}/rooms/${roomId}/questionnaire`, {
    headers: getAuthHeaders(token),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error?.message || data.message || 'Failed to load listing questionnaire.');
  }

  return data.data;
}

/**
 * Update a specific room listing questionnaire
 */
export async function updateRoomQuestionnaire(roomId, questionnaire, customToken) {
  const token = customToken || getAuthToken();
  const res = await fetch(`${API_BASE_URL}/rooms/${roomId}/questionnaire`, {
    method: 'PUT',
    headers: getAuthHeaders(token),
    body: JSON.stringify({ questionnaire }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errorMsg = data.error?.message || data.message || 'Failed to update listing questionnaire.';
    const err = new Error(errorMsg);
    err.details = data.error?.details || [];
    throw err;
  }

  return data.data;
}

export async function savePreferencesApi(preferencesData, customToken) {
  const token = customToken || getAuthToken();
  const res = await fetch(`${API_BASE_URL}/preferences`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(preferencesData),
  });

  const data = await res.json();
  if (!res.ok) {
    const errorMsg = data.error?.message || data.message || 'Failed to save preferences.';
    const err = new Error(errorMsg);
    err.details = data.error?.details || [];
    throw err;
  }

  return data.data;
}

// ==========================================
// Booking & Reservation APIs
// ==========================================

export async function reserveRoomListing(bookingPayload, customToken) {
  const token = customToken || getAuthToken();
  const res = await fetch(`${API_BASE_URL}/bookings/reserve`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(bookingPayload),
  });

  const data = await res.json();
  if (!res.ok) {
    const errorMsg = data.error?.message || data.message || 'Failed to reserve room.';
    const err = new Error(errorMsg);
    err.code = data.error?.code || 'RESERVATION_FAILED';
    err.details = data.error?.details || [];
    throw err;
  }

  return data.data;
}

export async function fetchMyBookings(customToken) {
  const token = customToken || getAuthToken();
  const res = await fetch(`${API_BASE_URL}/bookings/my-bookings`, {
    headers: getAuthHeaders(token),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || data.message || 'Failed to fetch bookings.');
  }

  return data.data || [];
}

export async function fetchOwnerBookings(customToken) {
  const token = customToken || getAuthToken();
  const res = await fetch(`${API_BASE_URL}/bookings/owner-bookings`, {
    headers: getAuthHeaders(token),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || data.message || 'Failed to fetch owner bookings.');
  }

  return data.data || [];
}

export async function fetchBookingById(bookingId, customToken) {
  const token = customToken || getAuthToken();
  const res = await fetch(`${API_BASE_URL}/bookings/${bookingId}`, {
    headers: getAuthHeaders(token),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || data.message || 'Failed to fetch booking details.');
  }

  return data.data;
}

export async function cancelBookingApi(bookingId, customToken) {
  const token = customToken || getAuthToken();
  const res = await fetch(`${API_BASE_URL}/bookings/${bookingId}/cancel`, {
    method: 'PATCH',
    headers: getAuthHeaders(token),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || data.message || 'Failed to cancel booking.');
  }

  return data.data;
}

export async function confirmBookingApi(bookingId, customToken) {
  const token = customToken || getAuthToken();
  const res = await fetch(`${API_BASE_URL}/bookings/${bookingId}/confirm`, {
    method: 'PATCH',
    headers: getAuthHeaders(token),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || data.message || 'Failed to confirm booking.');
  }

  return data.data;
}



// ==========================================
// Property Visit Requests API
// ==========================================

export async function createVisitRequestApi(visitData, customToken) {
  const token = customToken || getAuthToken();
  if (!token) {
    throw new Error('Please sign in to schedule an in-person property visit.');
  }

  const res = await fetch(`${API_BASE_URL}/visits`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(visitData),
  });

  const data = await res.json();
  if (!res.ok) {
    const errorMsg = data.error?.message || data.message || 'Failed to submit visit request.';
    const error = new Error(errorMsg);
    error.code = data.error?.code || 'VISIT_REQUEST_ERROR';
    throw error;
  }

  return data.data;
}

export async function fetchMyVisitsApi(role, customToken) {
  const token = customToken || getAuthToken();
  if (!token) return [];

  const query = role ? `?role=${role}` : '';
  const res = await fetch(`${API_BASE_URL}/visits/my${query}`, {
    headers: getAuthHeaders(token),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error?.message || data.message || 'Failed to fetch visit requests.');
  }

  const data = await res.json();
  return data.data || [];
}

export async function updateVisitStatusApi(visitId, status, ownerResponseNote, customToken) {
  const token = customToken || getAuthToken();
  const res = await fetch(`${API_BASE_URL}/visits/${visitId}/status`, {
    method: 'PATCH',
    headers: getAuthHeaders(token),
    body: JSON.stringify({ status, ownerResponseNote }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || data.message || 'Failed to update visit status.');
  }

  return data.data;
}



// ==========================================
// Password Reset API (OTP Based)
// ==========================================

export async function forgotPasswordApi(email) {
  const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || data.message || 'Failed to request password reset.');
  }

  return data;
}

export async function verifyResetOtpApi(email, otp) {
  const res = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp }),
  });

  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.error?.message || data.message || 'Invalid or expired OTP.');
    err.code = data.error?.code;
    err.attemptsRemaining = data.error?.attemptsRemaining;
    throw err;
  }

  return data.data; // { tempToken }
}

export async function resetPasswordWithOtpApi(tempToken, password) {
  const res = await fetch(`${API_BASE_URL}/auth/reset-password-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tempToken, password }),
export async function resetPasswordApi(token, newPassword) {
  const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, newPassword }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || data.message || 'Password reset failed.');
  }

  return data;
}

export async function verifyEmailApi(token) {
  const res = await fetch(`${API_BASE_URL}/auth/verify-email?token=${encodeURIComponent(token)}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  const data = await res.json();
  if (!res.ok) {
    const error = new Error(data.error?.message || data.message || 'Email verification failed.');
    error.code = data.error?.code;
    throw error;
  }

  return data;
}

export async function resendVerificationApi(email) {
  const res = await fetch(`${API_BASE_URL}/auth/resend-verification`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || data.message || 'Failed to resend verification link.');
  }

  return data;
}

// ==========================================
// Owner Verification & RBAC API
// ==========================================

export async function fetchMyVerificationStatusApi(customToken) {
  const token = customToken || getAuthToken();
  if (!token) return null;

  const res = await fetch(`${API_BASE_URL}/verification/me`, {
    headers: getAuthHeaders(token),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || data.message || 'Failed to fetch verification status.');
  }

  return data.data;
}

export async function submitOwnerVerificationApi(verificationData, customToken) {
  const token = customToken || getAuthToken();
  const res = await fetch(`${API_BASE_URL}/verification/submit`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(verificationData),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || data.message || 'Failed to submit identity verification.');
  }

  return data.data;
}

export async function becomeOwnerApi(customToken) {
  const token = customToken || getAuthToken();
  const res = await fetch(`${API_BASE_URL}/verification/become-owner`, {
    method: 'POST',
    headers: getAuthHeaders(token),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || data.message || 'Failed to initiate owner transition.');
  }

  return data.data;
}

// ==========================================
// Booking Request & Mutual Digital Agreement API
// ==========================================

export async function createBookingRequestApi(requestData, customToken) {
  const token = customToken || getAuthToken();
  const res = await fetch(`${API_BASE_URL}/bookings/request`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(requestData),
  });

  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.error?.message || data.message || 'Failed to send booking request.');
    err.code = data.error?.code;
    throw err;
  }

  return data.data;
}

export async function respondBookingRequestApi(bookingId, action, rejectionReason, customToken) {
  const token = customToken || getAuthToken();
  const res = await fetch(`${API_BASE_URL}/bookings/${bookingId}/respond`, {
    method: 'PATCH',
    headers: getAuthHeaders(token),
    body: JSON.stringify({ action, rejectionReason }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || data.message || 'Failed to respond to booking request.');
  }

  return data.data;
}

export async function fetchAgreementByIdApi(agreementId, customToken) {
  const token = customToken || getAuthToken();
  const res = await fetch(`${API_BASE_URL}/agreements/${agreementId}`, {
    headers: getAuthHeaders(token),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || data.message || 'Failed to fetch agreement details.');
  }

  return data.data;
}



// ==========================================
// Password Reset API (OTP Based)
// ==========================================

export async function forgotPasswordApi(email) {
  const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || data.message || 'Failed to request password reset.');
  }

  return data;
}

export async function verifyResetOtpApi(email, otp) {
  const res = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp }),
  });

  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.error?.message || data.message || 'Invalid or expired OTP.');
    err.code = data.error?.code;
    err.attemptsRemaining = data.error?.attemptsRemaining;
    throw err;
  }

  return data.data; // { tempToken }
}

export async function resetPasswordWithOtpApi(tempToken, password) {
  const res = await fetch(`${API_BASE_URL}/auth/reset-password-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tempToken, password }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || data.message || 'Password reset failed.');
  }

  if (data.data?.token) {
    setAuthToken(data.data.token);
    setAuthUser(data.data.user);
  }

  return data.data;
}

// ==========================================
// Owner Verification & RBAC API
// ==========================================

export async function fetchMyVerificationStatusApi(customToken) {
  const token = customToken || getAuthToken();
  if (!token) return null;

  const res = await fetch(`${API_BASE_URL}/verification/me`, {
    headers: getAuthHeaders(token),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || data.message || 'Failed to fetch verification status.');
  }

  return data.data;
}

export async function submitOwnerVerificationApi(verificationData, customToken) {
  const token = customToken || getAuthToken();
  const res = await fetch(`${API_BASE_URL}/verification/submit`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(verificationData),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || data.message || 'Failed to submit identity verification.');
  }

  return data.data;
}

export async function becomeOwnerApi(customToken) {
  const token = customToken || getAuthToken();
  const res = await fetch(`${API_BASE_URL}/verification/become-owner`, {
    method: 'POST',
    headers: getAuthHeaders(token),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || data.message || 'Failed to initiate owner transition.');
  }

  return data.data;
}

// ==========================================
// Booking Request & Mutual Digital Agreement API
// ==========================================

export async function createBookingRequestApi(requestData, customToken) {
  const token = customToken || getAuthToken();
  const res = await fetch(`${API_BASE_URL}/bookings/request`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(requestData),
  });

  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.error?.message || data.message || 'Failed to send booking request.');
    err.code = data.error?.code;
    throw err;
  }

  return data.data;
}

export async function respondBookingRequestApi(bookingId, action, rejectionReason, customToken) {
  const token = customToken || getAuthToken();
  const res = await fetch(`${API_BASE_URL}/bookings/${bookingId}/respond`, {
    method: 'PATCH',
    headers: getAuthHeaders(token),
    body: JSON.stringify({ action, rejectionReason }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || data.message || 'Failed to respond to booking request.');
  }

  return data.data;
}

export async function fetchAgreementByIdApi(agreementId, customToken) {
  const token = customToken || getAuthToken();
  const res = await fetch(`${API_BASE_URL}/agreements/${agreementId}`, {
    headers: getAuthHeaders(token),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || data.message || 'Failed to fetch agreement details.');
  }

  return data.data;
}

export async function fetchAgreementByBookingApi(bookingId, customToken) {
  const token = customToken || getAuthToken();
  const res = await fetch(`${API_BASE_URL}/agreements/booking/${bookingId}`, {
    headers: getAuthHeaders(token),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || data.message || 'Failed to fetch agreement.');
  }

  return data.data;
}

export async function signAgreementApi(agreementId, customToken) {
  const token = customToken || getAuthToken();
  const res = await fetch(`${API_BASE_URL}/agreements/${agreementId}/sign`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify({ accepted: true }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || data.message || 'Failed to sign agreement.');
  }

  return data.data;
}

export async function downloadAgreementPdfApi(agreementId, agreementNumber, customToken) {
  const token = customToken || getAuthToken();
  const res = await fetch(`${API_BASE_URL}/agreements/${agreementId}/pdf`, {
    headers: getAuthHeaders(token),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || errorData.message || 'Failed to download agreement PDF');
  }

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `RoomSync_Agreement_${agreementNumber || agreementId}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

export async function resetPasswordApi(token, password) {
  const res = await fetch(`${API_BASE_URL}/auth/reset-password/${token}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || data.message || 'Password reset failed.');
  }

  if (data.data?.token) {
    setAuthToken(data.data.token);
    setAuthUser(data.data.user);
  }

  return data.data;
}
