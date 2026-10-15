/**
 * RoomSync API Client Layer
 * Handles all HTTP interactions between the React client and the Express backend.
 * Provides isolated mock fallbacks during early development phases.
 */

import { MOCK_ROOMS } from '../data/mockRooms';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

/**
 * Fetch all rooms with optional filtering
 */
export async function fetchRooms(params = {}) {
  // If backend is active and configured, make real fetch call:
  // const res = await fetch(`${API_BASE_URL}/rooms?` + new URLSearchParams(params));
  // return res.json();

  // Controlled mock latency fallback
  await new Promise((resolve) => setTimeout(resolve, 150));
  let results = [...MOCK_ROOMS];

  if (params.city && params.city !== 'All') {
    results = results.filter((r) => r.city.toLowerCase() === params.city.toLowerCase());
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
  await new Promise((resolve) => setTimeout(resolve, 100));
  const room = MOCK_ROOMS.find((r) => r.id === id);
  if (!room) {
    throw new Error(`Room with ID "${id}" was not found.`);
  }
  return room;
}

/**
 * Fetch personalized compatibility matches for the current user
 */
export async function fetchMatches() {
  await new Promise((resolve) => setTimeout(resolve, 200));
  // Returns rooms sorted by compatibilityScore
  return [...MOCK_ROOMS].sort((a, b) => b.compatibilityScore - a.compatibilityScore);
}

/**
 * Fetch saved rooms
 */
export async function fetchSavedRooms() {
  await new Promise((resolve) => setTimeout(resolve, 100));
  // Default to showing first 2 mock rooms as saved bookmarks
  return [MOCK_ROOMS[0], MOCK_ROOMS[1]];
}
