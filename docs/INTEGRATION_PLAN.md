# RoomSync — Team Integration Plan & Workflow Protocol

> **Document Status:** Official Team Protocol & Roadmap  
> **Team Structure:**
> - **Member 1:** React Frontend & UI Integration Lead  
> - **Member 2:** Backend, Database & Authentication Lead (Author)  
> - **Member 3:** Matching Engine & Compatibility Algorithm Lead  

---

## 1. Division of Engineering Responsibilities

```
┌────────────────────────────────────────────────────────┐
│             Member 1: React Frontend                   │
│ - Apple-inspired UI design system & responsive layout  │
│ - 14 dedicated route components & interactive forms    │
│ - Consumes backend REST endpoints via HTTP client      │
│ - Renders verified compatibility metrics & mismatches  │
│ - Zero direct database or secret access                │
└──────────────────────────┬─────────────────────────────┘
                           │ HTTP / JSON / WebSockets
                           ▼
┌────────────────────────────────────────────────────────┐
│         Member 2: Node.js Express & MongoDB            │
│ - Modular monolith API server (`backend/src`)          │
│ - Mongoose models, indexes, and validation schemas     │
│ - Stateless JWT authentication, hashing & auth guards  │
│ - Input sanitization (`express-validator`) & errors    │
│ - Supplies validated data to matching engine service   │
│ - Cloudinary, Razorpay test mode, PDFKit integration   │
└──────────────────────────┬─────────────────────────────┘
                           │ Internal Function Call
                           ▼
┌────────────────────────────────────────────────────────┐
│          Member 3: 22-Factor Matching Engine           │
│ - Hard constraint elimination engine                   │
│ - Continuous fuzzy logic membership functions          │
│ - User-weighted compatibility aggregation              │
│ - Multi-criteria TOPSIS decision ranking               │
│ - Collaborative filtering fallback & cold-start logic  │
│ - Algorithmic unit tests and boundary condition checks │
└────────────────────────────────────────────────────────┘
```

### Detailed Matrix of Responsibilities:

| Operational Domain | Member 1 (Frontend) | Member 2 (Backend) | Member 3 (Matching Engine) |
|---|---|---|---|
| **User Authentication** | Login & signup forms; token storage in browser storage / memory; auth route guards | JWT signing/verification middleware; bcrypt password hashing; `/api/auth` endpoints | N/A |
| **User Profile & Onboarding** | 22-factor questionnaire UI; step progress indicator; slider controls | `PreferenceProfile` and `User` Mongoose models; validation; `/api/preferences` | Validates domain range for algorithm inputs |
| **Room Catalog & Exploration** | Explore page; filter drawer; map view toggle; room cards | `RoomListing` Mongoose model; `/api/rooms` CRUD & query filtering; Cloudinary upload | N/A |
| **Match Generation** | Matches page; renders `compatibilityScore` & `rankingScore`; displays warning chips | Exposes `GET /api/matches`; queries eligible database candidates; feeds data to engine | Implements `calculateMatches()`; fuzzy logic; TOPSIS; strengths/mismatch generation |
| **Bookmarks & Interactions** | Saved rooms page; bookmark toggle button | `Interaction` model; `/api/saved-rooms` CRUD; user activity logging | Consumes interaction history for Collaborative Filtering |
| **Messaging & Visits** | Real-time chat UI; visit booking scheduler modal | Socket.IO event router; `Conversation` and `Message` models; `/api/enquiries` | N/A |
| **Agreements & Payments** | Contract preview; print layout; Razorpay checkout button | `Agreement` model; PDFKit PDF generation with QR verification; Razorpay webhook verify | N/A |
| **Reviews & Complaints** | Review cards; dispute submission form | `Review` and `Complaint` models; moderation status; `/api/reviews` | N/A |

---

## 2. Integration Dependencies & Interlocking Milestones

```
Phase 1: Foundations & Design System [COMPLETED]
   │
   ▼
Phase 2: Backend Architecture & Auth [MEMBER 2 LEAD]
   │  └── Member 1 can begin wiring AuthContext to `/api/auth`
   ▼
Phase 3: Lifestyle Profile & Preferences Persistence [MEMBER 2 + MEMBER 1]
   │  └── Replaces localStorage with MongoDB `PreferenceProfile`
   ▼
Phase 4: Matching Engine & TOPSIS Pipeline [MEMBER 3 + MEMBER 2]
   │  └── Member 3 writes `MatchingEngine.js`; Member 2 connects to `GET /api/matches`
   ▼
Phase 5: Listing Management & Explore Catalog [MEMBER 2 + MEMBER 1]
   │  └── Replaces in-memory `MOCK_ROOMS` with real MongoDB `RoomListing`
   ▼
Phase 6: Real-Time Chat, Agreements & Test Payments [ALL MEMBERS]
      └── Socket.IO live messaging, PDFKit rental contracts, Razorpay test deposits
```

### Phase Details:

#### Phase 1: Foundations & Design System (Status: Completed)
- Frontend: 14 dedicated pages initialized; Apple-inspired design tokens configured in Tailwind.
- Backend: Express server initialized with health check endpoint (`/api/health`) and basic error handlers.

#### Phase 2: Backend Architecture, Auth & Data Persistence (Current Next Step)
- Member 2 creates Mongoose models (`User`, `PreferenceProfile`, `RoomListing`).
- Member 2 implements JWT auth middleware and endpoints (`/api/auth/register`, `/api/auth/login`, `/api/auth/me`).
- Member 1 wires frontend `AuthContext` to replace mock role switching with real authentication.

#### Phase 3: Lifestyle Profile & Onboarding Engine
- Member 1 connects `OnboardingPage.jsx` submit handler to `PUT /api/preferences`.
- Member 2 persists 22-factor preferences in MongoDB.

#### Phase 4: Explainable Compatibility & TOPSIS Matching Pipeline
- Member 3 implements `backend/src/services/MatchingEngine.js` according to `docs/MATCHING_ENGINE_SPEC.md`.
- Member 2 wires `GET /api/matches` to load candidate listings from MongoDB, pass them to `MatchingEngine`, and return structured results.
- Member 1 connects `MatchesPage.jsx` to live `/api/matches`.

#### Phase 5: Listing Management & Explore Catalog
- Member 2 implements `/api/rooms` CRUD endpoints with search filters and pagination.
- Member 1 connects `CreateListingPage.jsx` and `ExplorePage.jsx` to live room endpoints.

#### Phase 6: Real-Time Communication, Digital Agreements & Payments
- Member 2 implements Socket.IO chat handlers and message persistence.
- Member 2 generates rental agreement PDFs with verification QR codes.
- Member 2 wires Razorpay test mode payment verification.
- Member 1 connects `EnquiriesPage.jsx` and `BookingsPage.jsx`.

---

## 3. Mock-to-Live Transition Protocol

To maintain frontend stability without breaking UI development:
1. `frontend/src/services/api.js` remains the single point of contact for data.
2. Endpoints will be switched from mock fixtures to live fetch calls one by one as backend routes pass integration testing.
3. Mock fixtures in `frontend/src/data/mockRooms.js` will remain preserved as fallback fixtures until all 6 phases are complete.

---

## 4. API Change Review & Versioning Protocol

1. **Contract First:** Any proposed change to endpoint paths, request bodies, or response envelopes must be proposed in `docs/API_CONTRACTS.md` and approved by all three members before code modification.
2. **Backward Compatibility:** No field may be deleted or renamed without a transitional grace period. If a frontend component relies on `id`, the backend must serialize MongoDB `_id` to `id` in JSON transforms.
3. **Branching & Pull Request Discipline:**
   - Member 1 branches from `main` or development integration branch: `feature/frontend-...`
   - Member 2 branches: `feature/backend-...`
   - Member 3 branches: `feature/matching-...`
   - No direct pushes to `main`. Every pull request requires green test checks.
