# RoomSync — Master Project Context & Specification

## 1. Executive Summary & Product Vision

**RoomSync** is an intelligent, explainable roommate-finding and shared-rental platform specifically engineered for students and young working professionals in India.

Finding a shared flat in Indian metropolitan hubs (such as Bengaluru, Pune, Delhi-NCR, Mumbai, and Hyderabad) has historically been an opaque, high-friction process driven by brokerages, disorganized social media groups, and generic classifieds. These conventional channels focus solely on basic physical attributes (rent, deposit, 1BHK/2BHK/3BHK) while ignoring the primary root cause of roommate conflict: **lifestyle mismatch, clashing daily routines, incompatible social boundaries, and divergent house rules**.

RoomSync addresses this with an **explainable 22-factor compatibility engine** that evaluates both physical property requirements and intimate living habits. RoomSync separates mandatory hard constraints (non-negotiable deal-breakers) from weighted flexible preferences, pairing fuzzy logic, multi-criteria decision making (TOPSIS), and interaction-driven collaborative filtering to deliver transparent, ranked matches.

---

## 2. Core User Roles & Use Cases

RoomSync supports two primary user personas:

### 2.1 Room Seeker
- **Onboarding & Lifestyle Profiling**: Completes an intuitive lifestyle questionnaire mapping all 22 compatibility factors, distinguishing between non-negotiables (hard constraints) and flexible preferences with customizable importance weights (1–5 scale).
- **Intelligent Discovery**: Browses room listings filtered by city, locality, budget, and accommodation type.
- **Explainable Matchmaking**: Views calculated compatibility breakdowns (`compatibilityScore` vs. `rankingScore`), seeing transparent reasons for high compatibility and highlighted mismatch warnings (e.g., "Night Owl vs. Early Riser" or "Non-veg cooking in a Pure-Veg household").
- **Saved Listings & History**: Bookmarks rooms and tracks enquiry history.
- **Direct Engagement**: Initiates direct real-time chat with room owners/current flatmates to schedule physical or virtual visits.
- **Booking & Tenancy**: Manages rental applications, agreements (PDF generation with verification QR codes), and test deposits.

### 2.2 Room Owner / Primary Flatmate
- **Listing Management**: Publishes verified room details, rent, maintenance, security deposit, room dimensions, furnishing level, amenities, and high-resolution residential photographs.
- **Living Conditions Specification**: Defines the flat's actual culture, landlord restrictions, dietary rules, visitor guidelines, and preferred roommate attributes across the 22 factors.
- **Applicant Dashboard**: Reviews incoming seeker enquiries, inspects compatibility scores, shortlists potential roommates, and manages visit slots.
- **Agreement Facilitation**: Generates digital rental agreements and tracks move-in onboarding.

---

## 3. The 22 Compatibility Factors

Every roommate pairing is evaluated across 22 multidimensional factors. Each factor is classified as either a **Hard Constraint** (deal-breaker: binary pass/fail), a **Flexible Preference** (scored via fuzzy membership functions with custom importance weights), or a **Hybrid** (user decides whether it is mandatory or flexible).

| # | Factor Name | Factor Type | Evaluation Method & Domain |
|---|---|---|---|
| **1** | **Location & Commute** | Hard / Flexible | Commute distance, travel time to workplace/college, transit hub proximity. |
| **2** | **Budget** | Hard / Flexible | Monthly rent + maintenance + security deposit range vs. Seeker's budget threshold. |
| **3** | **Food Preference** | Hard / Flexible | Dietary culture: Pure Vegetarian, Vegan, Jain, Eggetarian, Non-Veg, separate cooking utensils. |
| **4** | **Smoking Policy** | Hard / Flexible | Non-smoking home, balcony-only smoking, open smoking. |
| **5** | **Alcohol Consumption** | Hard / Flexible | Teetotaler flat, occasional/social drinking, unrestricted. |
| **6** | **Sleep Schedule** | Flexible | Sleep time (e.g., 10 PM vs. 2 AM); evaluates routine overlap and quiet hour synchronization. |
| **7** | **Wake-up Schedule** | Flexible | Wake time (e.g., 6 AM vs. 10 AM); prevents morning bathroom/kitchen contention. |
| **8** | **Cleanliness Standards** | Flexible | Cleaning frequency, daily dishes habit, maid/cook hiring, deep-cleaning rotation. |
| **9** | **Noise Tolerance** | Flexible | Preference for quiet environment, headphone usage, tolerance for phone calls/speakers in common areas. |
| **10** | **Day Guests & Friends** | Flexible | Frequency of hosting friends, study groups, prior notice expected. |
| **11** | **Overnight Guests** | Hard / Flexible | Allowed, same-gender only, partners allowed, advance intimation required. |
| **12** | **Social / Party Preference** | Flexible | Quiet private sanctuary vs. vibrant social hub with weekend gatherings. |
| **13** | **Work / College Schedule** | Flexible | Regular day shift, rotational shifts, night shifts, university hours. |
| **14** | **Work-from-Home Frequency** | Flexible | Fully remote (constant flat occupancy), hybrid, or fully in-office/campus. |
| **15** | **Study-at-Home Frequency** | Flexible | Competitive exam preparation (GATE/UPSC/CAT), intense quiet study blocks. |
| **16** | **Cooking Frequency** | Flexible | Daily cooking (needs kitchen space/appliances), occasional, or relying on tiffin/ordering out. |
| **17** | **Pets Policy** | Hard / Flexible | Has pets (dogs, cats), pet-friendly, allergies, or strictly no pets. |
| **18** | **Grocery & Food Sharing** | Flexible | Fully separate groceries vs. pooled pantry staples & split expenses. |
| **19** | **Move-in Date** | Hard / Flexible | Seeker availability vs. room availability window. |
| **20** | **Duration of Stay** | Hard / Flexible | Minimum lease tenure (e.g., 3 months, 6 months, 11-month standard lease). |
| **21** | **Personal-Space Boundaries** | Flexible | Introverted privacy need vs. communal hanging out and shared downtime. |
| **22** | **House-Rules Strictness** | Flexible | Strict society/landlord curfews (gate close times) vs. liberal self-managed guidelines. |

---

## 4. Matching & Ranking Algorithm Architecture

RoomSync strictly avoids fabricated "match percentages" or black-box predictions. The matching pipeline follows a documented, explainable six-step sequence:

```
[All Active Room Listings]
            │
            ▼
┌────────────────────────────────────────┐
│ 1. Hard Constraint Filter              │  --> Immediate elimination of deal-breakers
└────────────────────────────────────────┘      (Budget ceiling, strict diet, gender, smoking)
            │
            ▼ [Eligible Candidate Pool]
┌────────────────────────────────────────┐
│ 2. Fuzzy Logic Compatibility Engine    │  --> Trapezoidal & triangular membership functions
└────────────────────────────────────────┘      for continuous parameters (sleep, noise, etc.)
            │
            ▼
┌────────────────────────────────────────┐
│ 3. Personalized Weighted Compatibility │  --> Normalizes weighted sum to compatibilityScore (0–100%)
└────────────────────────────────────────┘      Formula: Σ (w_i * S_i) / Σ w_i
            │
            ▼
┌────────────────────────────────────────┐
│ 4. Collaborative Filtering Fallback    │  --> Implicit/explicit interaction adjustment (views, saves,
└────────────────────────────────────────┘      inquiries). Gracefully falls back when data is sparse.
            │
            ▼
┌────────────────────────────────────────┐
│ 5. Multi-Criteria Ranking (TOPSIS)     │  --> Computes separate rankingScore based on relative
└────────────────────────────────────────┘      closeness to the ideal solution (rent, distance, rating).
            │
            ▼
┌────────────────────────────────────────┐
│ 6. Explainable Output Presentation     │  --> Clear breakdown: compatibilityScore, rankingScore,
└────────────────────────────────────────┘      highlights, and explicit mismatch warnings.
```

### Key Algorithmic Principles:
1. **Separation of Concerns**: `compatibilityScore` (interpersonal lifestyle synergy) is never conflated with `rankingScore` (holistic multi-criteria property ranking).
2. **Never Fabricate Probabilities**: Compatibility is a quantified lifestyle alignment index, not an absolute guarantee of interpersonal harmony.
3. **Transparent Explanations**: Every result displays exact contributing factors (e.g., "95% match on sleep hours and cleanliness; minor friction on guest policy").

---

## 5. Technology Stack

### Frontend
- **Framework**: React 18+ (SPA created with Vite)
- **Styling**: Tailwind CSS with custom Apple-inspired design tokens
- **Routing**: React Router v6
- **State & Server Cache**: TanStack Query (React Query v5)
- **Icons**: Lucide React
- **Design Language**: Apple-inspired minimalist residential aesthetics (warm off-whites, slate typography, restrained teal/emerald accent, generous padding, subtle glassmorphism).

### Backend
- **Runtime**: Node.js (v20+)
- **Server Framework**: Express.js
- **Database**: MongoDB Atlas via Mongoose ODM
- **Authentication**: Stateless JWT + bcrypt password hashing
- **Real-Time Communication**: Socket.IO for chat and instant notifications
- **Architecture**: Modular Monolith (Clean service-controller-repository pattern)

### Supporting Services & Integrations
- **Media Storage**: Cloudinary (optimized CDN delivery for room photos)
- **Mapping & Geocoding**: Google Maps Platform (Places Autocomplete, Distance Matrix)
- **Payment Verification**: Razorpay (Test Mode for application fees and token deposits)
- **Document Processing**: PDFKit (Tenancy agreements) & `qrcode` (document verification stamps)
- **Email Service**: Nodemailer / SendGrid for transactional notifications

---

## 6. Route & Page Directory

RoomSync requires 14 dedicated, responsive pages:

| # | Route | Page Title | Primary Functionality |
|---|---|---|---|
| 1 | `/` | **Home** | Hero search, curated lifestyle collections, 22-factor value proposition, trust elements. |
| 2 | `/explore` | **Explore Rooms** | Grid/Map room search, faceted filters (location, rent, amenities, dietary rules). |
| 3 | `/rooms/:id` | **Room Details** | Gallery, specifications, owner bio, living conditions, interactive compatibility preview. |
| 4 | `/login` | **Login** | Secure authentication for seekers and owners with role detection. |
| 5 | `/signup` | **Signup** | Role selection (Seeker vs. Owner), credential registration. |
| 6 | `/onboarding` | **Preference Onboarding** | Interactive 22-factor questionnaire, hard constraints selection, importance sliders. |
| 7 | `/matches` | **Compatibility Matches** | Ranked room recommendations with compatibility breakdown and mismatch tags. |
| 8 | `/owner/dashboard` | **Owner Dashboard** | Listing performance metrics, pending enquiries, visit requests, occupied rooms. |
| 9 | `/owner/listings/new`<br>`/owner/listings/:id/edit` | **Create / Edit Listing** | Multi-step form for property specs, photos, rent, house rules, and flatmate preferences. |
| 10 | `/saved` | **Saved Rooms** | Bookmarked properties with quick comparison view. |
| 11 | `/profile` | **Profile & Settings** | Lifestyle profile review, account security, notification preferences. |
| 12 | `/messages` | **Enquiries & Chat** | Real-time messaging between seekers and owners with scheduled visit requests. |
| 13 | `/bookings` | **Booking & Agreements** | Rental agreement preview, test deposit checkout, verification QR code, tenancy status. |
| 14 | `/reviews-complaints` | **Reviews & Complaints** | Post-stay flatmate reviews, community reports, dispute resolution log. |

---

## 7. Data Models Plan (MongoDB & Mongoose)

1. **User**: Authentication, contact info, role (`seeker`, `owner`, `both`), verification status, avatar.
2. **PreferenceProfile**: The 22 factors, categorized into hard constraints, flexible preference values, and importance weights (1–5).
3. **RoomListing**: Physical specs, rent, deposit, photos, locality/geo-coordinates, owner ID, status (`active`, `reserved`, `occupied`).
4. **LivingConditions**: Detailed living reality of the room/flat across all 22 factors defined by the owner/existing flatmates.
5. **Interaction**: User activity log (views, bookmarks, inquiries, visit bookings) powering Collaborative Filtering.
6. **Enquiry / Conversation & Message**: Chat threads, timestamps, read receipts, and scheduled visit attachments.
7. **Booking & Agreement**: Tenancy dates, rent terms, PDF document hash, QR verification link, Razorpay test payment ID, signature states.
8. **Review & Complaint**: Verified ratings for rooms and flatmates, structured complaint categories, administrative review state.

---

## 8. Implementation Constraints & Engineering Standards

1. **Preserve Existing Code**: Never overwrite working modules without incremental verification.
2. **Phase-by-Phase Execution**: Establish foundations, implement mock-to-real workflows cleanly, test each milestone.
3. **No Direct Browser Database Access**: All persistence flows strictly through the Express API layer.
4. **No Fake Integrations**: Razorpay, PDF generation, and Cloudinary operate in genuine test/sandbox modes without simulated false production states.
5. **Accessibility & Design**: Adhere strictly to WCAG AA color contrast, fluid mobile-first responsiveness, and keyboard accessibility.
