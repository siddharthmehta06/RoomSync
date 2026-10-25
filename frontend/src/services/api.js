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
    if (params.maxRent) query.set('maxRent', params.maxRent);
    if (params.furnishing && params.furnishing !== 'All') {
      query.set('furnishing', params.furnishing);
    }

    const res = await fetch(`${API_BASE_URL}/rooms?${query.toString()}`);
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json.data) && json.data.length > 0) {
        return json.data.map((r) => ({
          ...r,
          id: r.id || r._id,
          compatibilityScore: r.compatibilityScore || 89,
          rankingScore: r.rankingScore || 8.5,
          strengths: r.strengths || [
            'Non-smoking preference match',
            'Quiet hours aligned',
          ],
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

  return results;
}

/**
 * Fetch single room by ID
 */
export async function fetchRoomById(id) {
  try {
    const res = await fetch(`${API_BASE_URL}/rooms/${id}`);
    if (res.ok) {
      const json = await res.json();
      if (json.data) {
        const r = json.data;
        return {
          ...r,
          id: r.id || r._id,
          compatibilityScore: r.compatibilityScore || 91,
          rankingScore: r.rankingScore || 8.8,
          strengths: r.strengths || [
            'Similar WFH schedule',
            'Quiet hours aligned after 11 PM',
            'Non-smoking match',
          ],
          mismatches: r.mismatches || [],
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
