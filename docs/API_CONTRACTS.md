# RoomSync — API Contracts & Endpoint Specifications

> **Document Status:** Official Shared Contract (Draft / Baseline)  
> **Target Audience:** Member 1 (Frontend), Member 2 (Backend & Database), Member 3 (Matching Engine)  
> **Base URL:** `http://localhost:5000/api` (Production: `/api/v1`)  
> **Content-Type:** `application/json`

---

## 1. Architectural Overview & Conventions

### 1.1 Implementation Status Key
Every endpoint in this document is labeled with its verified status in the repository:
- **Implemented:** Source code exists and handles requests as described.
- **Partially Implemented:** Some route or handler logic exists, but full database/validation integration is incomplete.
- **Mock / Demo:** Simulates responses using hardcoded data or in-memory fixtures.
- **Proposed / Missing:** Endpoint path and schema defined here for upcoming phases; not yet implemented in code.

### 1.2 Authentication & Session Strategy
- Authentication uses stateless **JSON Web Tokens (JWT)** passed in the HTTP Authorization header:
  ```http
  Authorization: Bearer <token>
  ```
- Password hashing is enforced via `bcryptjs` (minimum 10 salt rounds).
- Token expiration: 7 days (`JWT_EXPIRES_IN=7d`).
- Roles:
  - `seeker`: Room seeker searching for accommodations and flatmates.
  - `owner`: Primary flatmate or property owner posting rooms and managing applicants.
  - `admin`: Platform administrative oversight (reviews/complaints escalation).

### 1.3 Standard Response Formats

#### Success Response Envelope
All successful API responses return a top-level `success: true` envelope with data or metadata:
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional human-readable confirmation message",
  "meta": {
    "total": 42,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```

#### Standard Error Response Format
To resolve discrepancies between legacy handlers and modern REST standards, the agreed error contract is:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request contains invalid or missing fields.",
    "details": [
      {
        "field": "budgetCeiling",
        "message": "budgetCeiling must be a positive integer"
      }
    ]
  }
}
```

#### Standard Error Codes:
| HTTP Status | Error Code | Description |
|---|---|---|
| `400` | `VALIDATION_ERROR` | Request body or parameters failed schema validation |
| `400` | `BAD_REQUEST` | Malformed JSON or invalid query syntax |
| `401` | `UNAUTHORIZED` | Missing, expired, or invalid JWT token |
| `403` | `FORBIDDEN` | Authenticated user lacks ownership or role permissions |
| `404` | `NOT_FOUND` | Requested resource ID does not exist |
| `409` | `CONFLICT` | Resource already exists (e.g. duplicate email, duplicate booking) |
| `500` | `INTERNAL_SERVER_ERROR` | Unhandled server exception (stack trace excluded in production) |

---

## 2. System Endpoints

### 2.1 System Health & Capabilities Check
- **Method:** `GET`
- **Route:** `/api/health`
- **Purpose:** Diagnostic health check and capabilities handshake for client and orchestration.
- **Status:** **Implemented** (verified in `backend/src/app.js` and `backend/tests/health.test.js`)
- **Authentication:** Public
- **Headers:** None
- **Request Body:** None
- **Successful Response (`200 OK`):**
  ```json
  {
    "status": "ok",
    "service": "RoomSync API",
    "version": "1.0.0",
    "timestamp": "2026-10-17T21:00:00.000Z",
    "factorsSupported": 22,
    "algorithms": [
      "HardConstraintFilter",
      "FuzzyLogicEngine",
      "TOPSIS",
      "CollaborativeFiltering"
    ]
  }
  ```
- **Error Responses:** `500 Internal Server Error` if server fails to initialize.

---

## 3. Group A: Authentication & Session APIs

### 3.1 Register User
- **Method:** `POST`
- **Route:** `/api/auth/register`
- **Purpose:** Creates a new user account with role assignment (`seeker` or `owner`).
- **Status:** **Proposed / Missing**
- **Authentication:** Public
- **Validation Rules:**
  - `email`: Required, valid email format, unique in database.
  - `password`: Required, minimum 8 characters, at least 1 uppercase, 1 lowercase, 1 digit.
  - `fullName`: Required, string, 2–80 characters.
  - `phone`: Required, valid 10-digit Indian mobile number (`+91` optional).
  - `role`: Required, enum `['seeker', 'owner']`.
- **Request Body:**
  ```json
  {
    "fullName": "Priya Sharma",
    "email": "priya.sharma@example.com",
    "phone": "9876543210",
    "password": "SecurePassword123!",
    "role": "seeker"
  }
  ```
- **Successful Response (`201 Created`):**
  ```json
  {
    "success": true,
    "message": "Account created successfully.",
    "data": {
      "user": {
        "id": "671158a2d169b1e93892a001",
        "fullName": "Priya Sharma",
        "email": "priya.sharma@example.com",
        "phone": "9876543210",
        "role": "seeker",
        "isVerified": false,
        "avatar": null,
        "createdAt": "2026-10-17T21:00:00.000Z"
      },
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
  ```
- **Error Responses:**
  - `400 Bad Request` (`VALIDATION_ERROR`): Missing required fields or password too short.
  - `409 Conflict` (`EMAIL_ALREADY_EXISTS`): An account with this email already exists.

---

### 3.2 Login User
- **Method:** `POST`
- **Route:** `/api/auth/login`
- **Purpose:** Authenticates credentials and returns a signed JWT.
- **Status:** **Proposed / Missing** (Currently simulated in frontend `LoginPage.jsx` via local state redirect)
- **Authentication:** Public
- **Validation Rules:**
  - `email`: Required, valid email string.
  - `password`: Required, non-empty string.
- **Request Body:**
  ```json
  {
    "email": "priya.sharma@example.com",
    "password": "SecurePassword123!"
  }
  ```
- **Successful Response (`200 OK`):**
  ```json
  {
    "success": true,
    "message": "Login successful.",
    "data": {
      "user": {
        "id": "671158a2d169b1e93892a001",
        "fullName": "Priya Sharma",
        "email": "priya.sharma@example.com",
        "role": "seeker",
        "isVerified": false,
        "avatar": null
      },
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
  ```
- **Error Responses:**
  - `401 Unauthorized` (`INVALID_CREDENTIALS`): Incorrect email or password.
  - `400 Bad Request` (`VALIDATION_ERROR`): Email or password not supplied.

---

### 3.3 Get Current Authenticated User (`Me`)
- **Method:** `GET`
- **Route:** `/api/auth/me`
- **Purpose:** Validates the active session token and returns current user details.
- **Status:** **Proposed / Missing**
- **Authentication:** Required (`Bearer <token>`)
- **Request Body:** None
- **Successful Response (`200 OK`):**
  ```json
  {
    "success": true,
    "data": {
      "id": "671158a2d169b1e93892a001",
      "fullName": "Priya Sharma",
      "email": "priya.sharma@example.com",
      "phone": "9876543210",
      "role": "seeker",
      "isVerified": true,
      "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
      "hasCompletedOnboarding": true
    }
  }
  ```
- **Error Responses:**
  - `401 Unauthorized` (`TOKEN_EXPIRED` or `INVALID_TOKEN`): Token missing, malformed, or expired.
  - `404 Not Found` (`USER_NOT_FOUND`): User ID encoded in token was deleted from database.

---

### 3.4 Logout User
- **Method:** `POST`
- **Route:** `/api/auth/logout`
- **Purpose:** Invalidate client-side session (and blacklist token if token-revocation store is configured).
- **Status:** **Proposed / Missing**
- **Authentication:** Required (`Bearer <token>`)
- **Request Body:** None
- **Successful Response (`200 OK`):**
  ```json
  {
    "success": true,
    "message": "Logged out successfully."
  }
  ```

---

## 4. Group B: User Profile APIs

### 4.1 Get Profile
- **Method:** `GET`
- **Route:** `/api/users/profile`
- **Purpose:** Retrieve extended profile details (bio, work details, city, verification documents).
- **Status:** **Proposed / Missing**
- **Authentication:** Required (`Bearer <token>`)
- **Successful Response (`200 OK`):**
  ```json
  {
    "success": true,
    "data": {
      "id": "671158a2d169b1e93892a001",
      "fullName": "Priya Sharma",
      "email": "priya.sharma@example.com",
      "phone": "9876543210",
      "role": "seeker",
      "occupation": "Frontend Engineer",
      "company": "Flipkart",
      "city": "Bengaluru",
      "bio": "Quiet professional, loves weekend cooking and reading.",
      "isVerified": true,
      "verificationMethod": "Govt_ID",
      "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"
    }
  }
  ```

---

### 4.2 Update Profile
- **Method:** `PUT`
- **Route:** `/api/users/profile`
- **Purpose:** Update user's biographical and contact details.
- **Status:** **Proposed / Missing**
- **Authentication:** Required (`Bearer <token>`)
- **Request Body:**
  ```json
  {
    "fullName": "Priya Sharma",
    "phone": "9876543210",
    "occupation": "Senior Frontend Engineer",
    "company": "Flipkart Internet Pvt Ltd",
    "city": "Bengaluru",
    "bio": "Quiet professional, loves weekend baking and quiet study."
  }
  ```
- **Successful Response (`200 OK`):**
  ```json
  {
    "success": true,
    "message": "Profile updated successfully.",
    "data": { ...updatedUser }
  }
  ```
- **Error Responses:**
  - `400 Bad Request` (`VALIDATION_ERROR`): Invalid telephone format or empty name string.

---

## 5. Group C: Room Listings APIs

### 5.1 Search and Filter Room Listings
- **Method:** `GET`
- **Route:** `/api/rooms`
- **Purpose:** Search available room listings with query filters, pagination, and sorting.
- **Status:** **Mock / Demo** (Currently in `frontend/src/services/api.js` filtering `MOCK_ROOMS` in memory)
- **Authentication:** Optional (Seekers get customized compatibility scores if authenticated)
- **Query Parameters:**
  - `city` (string, e.g. `Bengaluru`)
  - `locality` (string, e.g. `Koramangala`)
  - `minRent` (number, default: `0`)
  - `maxRent` (number, e.g. `25000`)
  - `roomType` (string: `Private Room with Attached Bath`, `Private Room (Shared Bath)`, `Shared Room`)
  - `furnishing` (string: `Fully Furnished`, `Semi-Furnished`, `Unfurnished`)
  - `foodPreference` (string: `Vegetarian`, `Non-Veg`, `Any`)
  - `smoking` (string: `Non-Smoking`, `Balcony Only`, `Allowed`)
  - `page` (integer, default: `1`)
  - `limit` (integer, default: `12`)
  - `sortBy` (string: `rent_asc`, `rent_desc`, `date_desc`, `topsis_rank`)
- **Successful Response (`200 OK`):**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "671158a2d169b1e93892b101",
        "title": "Sunlit Master Bedroom in 3BHK Penthouse",
        "locality": "Koramangala 4th Block",
        "city": "Bengaluru",
        "state": "Karnataka",
        "pinCode": "560034",
        "rent": 18500,
        "maintenance": 1500,
        "deposit": 50000,
        "roomType": "Private Room with Attached Bath",
        "furnishing": "Fully Furnished",
        "availableFrom": "2026-11-01T00:00:00.000Z",
        "minStayMonths": 6,
        "images": [
          "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=1200&q=80"
        ],
        "amenities": ["WiFi", "AC", "Power Backup", "Housekeeping Included"],
        "owner": {
          "id": "671158a2d169b1e93892a099",
          "name": "Aditya Sharma",
          "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
          "isVerified": true
        },
        "status": "active"
      }
    ],
    "meta": {
      "total": 38,
      "page": 1,
      "limit": 12,
      "totalPages": 4
    }
  }
  ```

---

### 5.2 Get Room Listing by ID
- **Method:** `GET`
- **Route:** `/api/rooms/:id`
- **Purpose:** Retrieve comprehensive details of a single listing including living conditions.
- **Status:** **Mock / Demo** (Currently implemented via `fetchRoomById` returning `MOCK_ROOMS` by string ID)
- **Authentication:** Optional
- **Path Parameters:**
  - `id`: MongoDB ObjectId string (or legacy fixture ID during transition)
- **Successful Response (`200 OK`):**
  ```json
  {
    "success": true,
    "data": {
      "id": "671158a2d169b1e93892b101",
      "title": "Sunlit Master Bedroom in 3BHK Penthouse",
      "locality": "Koramangala 4th Block",
      "city": "Bengaluru",
      "rent": 18500,
      "maintenance": 1500,
      "deposit": 50000,
      "roomType": "Private Room with Attached Bath",
      "furnishing": "Fully Furnished",
      "availableFrom": "2026-11-01T00:00:00.000Z",
      "minStayMonths": 6,
      "images": ["https://images.unsplash.com/photo-1598928506311-c55ded91a20c"],
      "amenities": ["High-speed WiFi (300 Mbps)", "Power Backup", "AC in Room"],
      "owner": {
        "id": "671158a2d169b1e93892a099",
        "name": "Aditya Sharma",
        "role": "Lead Flatmate & Tech Professional",
        "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb",
        "isVerified": true,
        "phone": "+91 98765 43210"
      },
      "livingConditions": {
        "locationCommute": "15 min to Sony World Signal & Embassy GolfLinks",
        "foodPreference": "Eggetarian / Flexible Non-veg",
        "smoking": "Strictly Non-Smoking inside and on balcony",
        "alcohol": "Social drinking on weekends welcome",
        "sleepSchedule": 23.5,
        "wakeSchedule": 7.5,
        "cleanliness": 4.8,
        "noiseTolerance": 3.5,
        "guestsDay": "Occasional friends visiting with prior heads-up",
        "guestsOvernight": "Allowed with 24h prior notification",
        "socialPreference": "Balanced: relaxed weekdays, casual board-game weekends",
        "workSchedule": "Tech product manager, standard 10 AM - 7 PM",
        "wfhFrequency": 2,
        "studyHabits": "Quiet reading time after 10 PM",
        "cookingFrequency": "Shared cook prepares lunch & dinner",
        "petsPreference": "No pets currently; cat-friendly",
        "foodSharing": "Split pantry staples (oil, spices, milk, groceries)",
        "moveInDate": "2026-11-01T00:00:00.000Z",
        "stayDuration": 11,
        "personalSpace": "High respect for personal rooms; friendly lounge chats",
        "rulesStrictness": "Gated society, 24/7 security, no arbitrary curfews"
      },
      "status": "active"
    }
  }
  ```
- **Error Responses:**
  - `404 Not Found` (`ROOM_NOT_FOUND`): Specified room ID does not exist.

---

### 5.3 Create Room Listing
- **Method:** `POST`
- **Route:** `/api/rooms`
- **Purpose:** Room owners publish a new property listing with complete living conditions.
- **Status:** **Proposed / Missing** (Currently handled by browser alert in `CreateListingPage.jsx`)
- **Authentication:** Required (`Bearer <token>`, Role must be `owner`)
- **Request Body:**
  ```json
  {
    "title": "Minimalist Garden-Facing Room in HSR Sector 2",
    "locality": "HSR Layout Sector 2",
    "city": "Bengaluru",
    "state": "Karnataka",
    "pinCode": "560102",
    "rent": 16000,
    "maintenance": 1200,
    "deposit": 45000,
    "roomType": "Private Room (Shared Bath)",
    "furnishing": "Semi-Furnished",
    "availableFrom": "2026-10-25T00:00:00.000Z",
    "minStayMonths": 6,
    "images": [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267"
    ],
    "amenities": ["Fiber Internet", "Covered Bike Parking", "RO Water"],
    "livingConditions": {
      "foodPreference": "Pure Vegetarian",
      "smoking": "Strictly Non-Smoking",
      "alcohol": "Teetotaler",
      "sleepSchedule": 23.0,
      "wakeSchedule": 7.0,
      "cleanliness": 4.5,
      "noiseTolerance": 2.0,
      "guestsDay": "Occasional",
      "guestsOvernight": "Same-gender only with 24h notice",
      "socialPreference": "Quiet retreat",
      "workSchedule": "Standard day",
      "wfhFrequency": 4,
      "studyHabits": "Intense quiet study blocks",
      "cookingFrequency": "Daily home cooking",
      "petsPreference": "Strictly no pets",
      "foodSharing": "Separate groceries",
      "moveInDate": "2026-10-25T00:00:00.000Z",
      "stayDuration": 11,
      "personalSpace": "High need for privacy",
      "rulesStrictness": "Society gate closes at 11 PM"
    }
  }
  ```
- **Successful Response (`201 Created`):**
  ```json
  {
    "success": true,
    "message": "Listing published successfully.",
    "data": {
      "id": "671158a2d169b1e93892b102",
      "title": "Minimalist Garden-Facing Room in HSR Sector 2",
      "status": "active",
      "owner": "671158a2d169b1e93892a099",
      "createdAt": "2026-10-17T21:00:00.000Z"
    }
  }
  ```
- **Error Responses:**
  - `400 Bad Request` (`VALIDATION_ERROR`): Missing required specs or missing living conditions.
  - `403 Forbidden` (`ROLE_UNAUTHORIZED`): User role is not `owner`.

---

### 5.4 Update Room Listing
- **Method:** `PUT`
- **Route:** `/api/rooms/:id`
- **Purpose:** Update room listing details, pricing, photos, or house rules.
- **Status:** **Proposed / Missing**
- **Authentication:** Required (`Bearer <token>`, Owner of the listing only)
- **Path Parameters:**
  - `id`: Listing ID
- **Successful Response (`200 OK`):**
  ```json
  {
    "success": true,
    "message": "Listing updated successfully.",
    "data": { ...updatedListing }
  }
  ```
- **Error Responses:**
  - `403 Forbidden` (`NOT_LISTING_OWNER`): Authenticated user does not own this listing.
  - `404 Not Found` (`ROOM_NOT_FOUND`): Listing does not exist.

---

### 5.5 Delete / Deactivate Room Listing
- **Method:** `DELETE`
- **Route:** `/api/rooms/:id`
- **Purpose:** Deactivates or removes a room listing.
- **Status:** **Proposed / Missing**
- **Authentication:** Required (`Bearer <token>`, Owner only)
- **Successful Response (`200 OK`):**
  ```json
  {
    "success": true,
    "message": "Listing deactivated successfully."
  }
  ```

---

## 6. Group D: Preference Profile APIs

### 6.1 Get User Preferences
- **Method:** `GET`
- **Route:** `/api/preferences`
- **Purpose:** Retrieve the seeker's 22-factor lifestyle profile, hard constraints, and weights.
- **Status:** **Proposed / Missing** (Currently stored in browser `localStorage.roomsync_preferences`)
- **Authentication:** Required (`Bearer <token>`)
- **Successful Response (`200 OK`):**
  ```json
  {
    "success": true,
    "data": {
      "userId": "671158a2d169b1e93892a001",
      "hardConstraints": {
        "budgetCeiling": 22000,
        "dietaryRule": "Pure-Veg",
        "smokingPolicy": "Strictly Non-Smoking",
        "alcoholPolicy": "Teetotaler",
        "petPolicy": "Strictly No Pets",
        "maxCommuteTimeMin": 45
      },
      "flexiblePreferences": {
        "sleepSchedule": 23.0,
        "wakeSchedule": 7.0,
        "cleanliness": 4,
        "noiseTolerance": 3,
        "guestPolicy": "Occasional",
        "overnightGuests": "With Notice",
        "socialPreference": "Balanced",
        "workSchedule": "Day Shift",
        "wfhDays": 2,
        "studyHoursNeeded": 2,
        "cookingHabit": "Daily",
        "foodSharing": "Separate Groceries",
        "personalSpaceNeed": "High",
        "rulesStrictness": "Moderate"
      },
      "importanceWeights": {
        "budget": 5,
        "diet": 5,
        "sleepSync": 5,
        "cleanliness": 4,
        "noise": 4,
        "guests": 3,
        "wfh": 3
      },
      "updatedAt": "2026-10-17T21:00:00.000Z"
    }
  }
  ```

---

### 6.2 Create / Update User Preferences
- **Method:** `PUT`
- **Route:** `/api/preferences`
- **Purpose:** Save or update the seeker's questionnaire answers across all 22 factors.
- **Status:** **Proposed / Missing**
- **Authentication:** Required (`Bearer <token>`)
- **Validation Rules:**
  - `hardConstraints.budgetCeiling`: Required integer > 0.
  - `importanceWeights`: Values must be integers between 1 and 5.
  - `sleepSchedule` & `wakeSchedule`: Floating-point hour between 0.0 and 23.5.
- **Request Body:** Complete preference profile JSON object.
- **Successful Response (`200 OK`):**
  ```json
  {
    "success": true,
    "message": "Preferences saved successfully.",
    "data": { ...savedPreferences }
  }
  ```

---

### 6.3 Validate Preferences
- **Method:** `POST`
- **Route:** `/api/preferences/validate`
- **Purpose:** Pre-validates preference values before saving, returning constraint consistency checks.
- **Status:** **Proposed / Missing**
- **Successful Response (`200 OK`):**
  ```json
  {
    "success": true,
    "isValid": true,
    "warnings": []
  }
  ```

---

## 7. Group E: Explainable Matching APIs

### 7.1 Get Explainable Compatibility Matches
- **Method:** `GET`
- **Route:** `/api/matches`
- **Purpose:** Computes and returns eligible room listings evaluated by the 22-factor engine.
- **Status:** **Mock / Demo** (Currently simulated in `frontend/src/services/api.js:fetchMatches` by sorting mock rooms)
- **Authentication:** Required (`Bearer <token>`, Seeker must have a saved `PreferenceProfile`)
- **Query Parameters:**
  - `minScore` (optional, default: `60`): Minimum `compatibilityScore` filter.
  - `city` (optional string): Limit matches to a specific city.
  - `limit` (optional integer, default: `10`): Max results.
- **Successful Response (`200 OK`):**
  ```json
  {
    "success": true,
    "data": [
      {
        "room": {
          "id": "671158a2d169b1e93892b101",
          "title": "Sunlit Master Bedroom in 3BHK Penthouse",
          "locality": "Koramangala 4th Block",
          "city": "Bengaluru",
          "rent": 18500,
          "maintenance": 1500,
          "deposit": 50000,
          "roomType": "Private Room with Attached Bath",
          "images": [
            "https://images.unsplash.com/photo-1598928506311-c55ded91a20c"
          ],
          "owner": {
            "name": "Aditya Sharma",
            "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb",
            "isVerified": true
          }
        },
        "compatibilityScore": 94,
        "rankingScore": 9.1,
        "strengths": [
          "Synchronized sleep schedule (11:30 PM - 7:30 AM)",
          "Strict non-smoking preference match",
          "Both work in hybrid tech roles (2 days WFH)",
          "Dedicated high-speed desk space"
        ],
        "mismatches": [
          "Occasional weekend acoustic guitar sessions"
        ],
        "factorBreakdown": {
          "sleepSchedule": 0.98,
          "wakeSchedule": 0.96,
          "cleanliness": 0.92,
          "noiseTolerance": 0.88,
          "wfhFrequency": 1.0,
          "cookingFrequency": 0.90
        },
        "algorithmMetadata": {
          "version": "1.0.0-fuzzy-topsis",
          "hardConstraintPassed": true
        }
      }
    ],
    "meta": {
      "totalEvaluated": 45,
      "eligibleMatches": 8,
      "disqualifiedByHardConstraints": 37
    }
  }
  ```
- **Error Responses:**
  - `400 Bad Request` (`PROFILE_INCOMPLETE`): Seeker has not completed the 22-factor onboarding survey.

---

## 8. Group F: Saved Rooms (Bookmarks) APIs

### 8.1 Get Saved Rooms
- **Method:** `GET`
- **Route:** `/api/saved-rooms`
- **Purpose:** Retrieve all rooms bookmarked by the current user.
- **Status:** **Mock / Demo** (Currently returns hardcoded slice in `frontend/src/services/api.js`)
- **Authentication:** Required (`Bearer <token>`)
- **Successful Response (`200 OK`):**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "671158a2d169b1e93892b101",
        "title": "Sunlit Master Bedroom in 3BHK Penthouse",
        "locality": "Koramangala 4th Block",
        "city": "Bengaluru",
        "rent": 18500,
        "savedAt": "2026-10-17T20:15:00.000Z"
      }
    ]
  }
  ```

---

### 8.2 Save a Room
- **Method:** `POST`
- **Route:** `/api/saved-rooms/:roomId`
- **Purpose:** Add a listing to the user's bookmarks and log an interaction for Collaborative Filtering.
- **Status:** **Proposed / Missing**
- **Authentication:** Required (`Bearer <token>`)
- **Path Parameters:**
  - `roomId`: Listing ID string
- **Successful Response (`201 Created`):**
  ```json
  {
    "success": true,
    "message": "Room saved to bookmarks."
  }
  ```

---

### 8.3 Remove a Saved Room
- **Method:** `DELETE`
- **Route:** `/api/saved-rooms/:roomId`
- **Purpose:** Remove a bookmark.
- **Status:** **Proposed / Missing**
- **Authentication:** Required (`Bearer <token>`)
- **Successful Response (`200 OK`):**
  ```json
  {
    "success": true,
    "message": "Room removed from bookmarks."
  }
  ```

---

## 9. Group G: Future Workflows & Integration Contracts

The following endpoints represent workflows designed for upcoming phases. They are formally documented here so frontend (Member 1) and backend (Member 2) build against stable schemas.

### 9.1 Enquiries & Scheduled Visits
- `POST /api/enquiries`: Seeker submits an enquiry or visit schedule request to an owner.
- `GET /api/enquiries`: Retrieve user's incoming/outgoing enquiries.
- `PATCH /api/enquiries/:id/status`: Update status (`Awaiting Response`, `Visit Scheduled`, `Accepted`, `Declined`).
- **Status:** **Proposed / Missing** (Currently mock in `EnquiriesPage.jsx` and `OwnerDashboardPage.jsx`).

### 9.2 Real-Time Conversations & Messages
- `GET /api/conversations`: List active chat threads for authenticated user.
- `GET /api/conversations/:id/messages`: Paginated message history for a thread.
- `POST /api/conversations/:id/messages`: Send a message via REST fallback.
- **Socket.IO Events Contract:**
  - Client emits: `join_room` (`{ conversationId }`), `send_message` (`{ conversationId, text, recipientId }`)
  - Server emits: `receive_message` (`{ id, conversationId, senderId, text, createdAt }`), `user_typing`
- **Status:** **Partially Implemented** (Socket.IO server instance attached in `server.js`, but business message handlers missing).

### 9.3 Digital Agreements & PDF Generation
- `POST /api/agreements/draft`: Generate agreement draft from room terms and seeker identity.
- `GET /api/agreements/:id`: Fetch agreement details and signing state.
- `POST /api/agreements/:id/sign`: Digital acceptance signature (records timestamp and user ID).
- `GET /api/agreements/:id/pdf`: Stream compiled PDF document generated by `PDFKit` with embedded verification QR code.
- **Status:** **Proposed / Missing** (Currently static preview in `BookingsPage.jsx`).

### 9.4 Payment & Token Deposits (Razorpay Test Mode)
- `POST /api/payments/create-order`: Generate Razorpay test order ID for application fee or token deposit.
- `POST /api/payments/verify`: Verify HMAC SHA256 payment signature using `RAZORPAY_KEY_SECRET`.
- **Status:** **Proposed / Missing** (SDK dependency installed in `backend/package.json`).

### 9.5 Reviews & Community Complaints
- `POST /api/reviews`: Submit verified flatmate/room review (rating 1–5, tags, feedback).
- `GET /api/reviews/room/:roomId`: Fetch public reviews for a room.
- `POST /api/complaints`: Submit dispute or house-rule complaint with category and evidence.
- `GET /api/complaints/me`: Track user's complaint resolution history.
- **Status:** **Proposed / Missing** (Currently mock in `ReviewsComplaintsPage.jsx`).

---

## 10. Summary Matrix of Endpoints

| Group | Method | Endpoint Path | Implementation Status | Auth Required |
|---|---|---|---|---|
| System | `GET` | `/api/health` | **Implemented** | No |
| Auth | `POST` | `/api/auth/register` | **Proposed / Missing** | No |
| Auth | `POST` | `/api/auth/login` | **Proposed / Missing** | No |
| Auth | `GET` | `/api/auth/me` | **Proposed / Missing** | Yes |
| Auth | `POST` | `/api/auth/logout` | **Proposed / Missing** | Yes |
| User | `GET` | `/api/users/profile` | **Proposed / Missing** | Yes |
| User | `PUT` | `/api/users/profile` | **Proposed / Missing** | Yes |
| Rooms | `GET` | `/api/rooms` | **Mock / Demo** | No |
| Rooms | `GET` | `/api/rooms/:id` | **Mock / Demo** | No |
| Rooms | `POST` | `/api/rooms` | **Proposed / Missing** | Yes (Owner) |
| Rooms | `PUT` | `/api/rooms/:id` | **Proposed / Missing** | Yes (Owner) |
| Rooms | `DELETE` | `/api/rooms/:id` | **Proposed / Missing** | Yes (Owner) |
| Preferences | `GET` | `/api/preferences` | **Proposed / Missing** | Yes |
| Preferences | `PUT` | `/api/preferences` | **Proposed / Missing** | Yes |
| Preferences | `POST` | `/api/preferences/validate` | **Proposed / Missing** | Yes |
| Matching | `GET` | `/api/matches` | **Mock / Demo** | Yes |
| Saved Rooms | `GET` | `/api/saved-rooms` | **Mock / Demo** | Yes |
| Saved Rooms | `POST` | `/api/saved-rooms/:roomId` | **Proposed / Missing** | Yes |
| Saved Rooms | `DELETE` | `/api/saved-rooms/:roomId` | **Proposed / Missing** | Yes |
| Enquiries | `POST` | `/api/enquiries` | **Proposed / Missing** | Yes |
| Enquiries | `GET` | `/api/enquiries` | **Proposed / Missing** | Yes |
| Chat | `GET` | `/api/conversations` | **Proposed / Missing** | Yes |
| Agreements | `POST` | `/api/agreements/draft` | **Proposed / Missing** | Yes |
| Agreements | `GET` | `/api/agreements/:id/pdf` | **Proposed / Missing** | Yes |
| Payments | `POST` | `/api/payments/create-order`| **Proposed / Missing** | Yes |
| Reviews | `POST` | `/api/reviews` | **Proposed / Missing** | Yes |
| Complaints | `POST` | `/api/complaints` | **Proposed / Missing** | Yes |
