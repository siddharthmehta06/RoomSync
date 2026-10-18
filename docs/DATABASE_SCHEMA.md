# RoomSync — Database Schema & Data Models Specification

> **Document Status:** Official Shared Data Contract (Draft / Baseline)  
> **Target Audience:** Member 1 (Frontend), Member 2 (Backend & Database), Member 3 (Matching Engine)  
> **Database Engine:** MongoDB (via Mongoose ODM)  
> **Timestamp Strategy:** Automatic `timestamps: true` (`createdAt`, `updatedAt`) on all collections

---

## 1. Database Architecture & Operational Principles

### 1.1 Existing Database Foundation Status
- **Connection Module:** `backend/src/config/db.js` implements `connectDB()` connecting to `MONGODB_URI` with a 2-second timeout for local dev resilience.
- **Model Files:** Currently **0 models implemented**. The `backend/src/models` directory does not yet exist.
- **Data Persistence:** Currently running in mock mode. All schemas documented here are **Proposed** for upcoming phased implementation.

### 1.2 Core Data Engineering Rules
1. **No Plaintext Passwords:** Passwords must be hashed using `bcrypt` (10+ salt rounds) before persistence via pre-save hooks.
2. **Separation of Concerns:** 
   - Seeker lifestyle preferences are stored in `PreferenceProfile`.
   - Physical room reality and flat culture are stored in `RoomListing.livingConditions`.
   - Never conflate what a seeker wants with what a room offers.
3. **No Sensitive Payment Credentials:** No credit card numbers, CVVs, or Razorpay secret keys are persisted in Mongo documents. Only public gateway order IDs and verification signature hashes are stored.
4. **Standardized Identifiers & Dates:**
   - All primary keys are 24-character hexadecimal `mongoose.Schema.Types.ObjectId`.
   - All timestamps and calendar dates follow ISO 8601 UTC strings (`Date` objects in MongoDB).
5. **Soft Deactivation:** Room listings support `status: 'active' | 'reserved' | 'occupied' | 'deactivated'` rather than hard deletion to maintain relational referential integrity with bookings and historical matches.

---

## 2. Canonical 22 Compatibility Factors Contract

The following 22 factors form the immutable core of RoomSync. Factor names and evaluation semantics must not be renamed, merged, or omitted.

| # | Factor Key | Type Classification | Seeker Schema Representation | Room Listing Representation | Range / Domain |
|---|---|---|---|---|---|
| **1** | `location` | Hard / Flexible | Target localities, max commute (mins), geo-radius (km) | Exact locality, city, pinCode, geo-coordinates `[lng, lat]` | String / GeoJSON Point |
| **2** | `budget` | Hard / Flexible | `budgetCeiling` (INR/month), max deposit | `rent`, `maintenance`, `deposit` (INR/month) | Number (INR) |
| **3** | `foodPreference` | Hard / Flexible | `dietaryRule` (`Pure-Veg`, `Veg-Only Flat`, `Flexible`, `Any`) | Flat dietary environment & kitchen rules | Enum string |
| **4** | `smoking` | Hard / Flexible | Personal habit & household tolerance | Flat smoking policy (`Non-Smoking`, `Balcony Only`, `Allowed`) | Enum string |
| **5** | `alcohol` | Hard / Flexible | Personal consumption & household tolerance | Flat alcohol policy (`Teetotaler`, `Social Only`, `Allowed`) | Enum string |
| **6** | `sleepSchedule` | Flexible | Typical bedtime (decimal hours 0.0 to 23.5) | Existing flatmates' average bedtime | Number (0.0–23.5) |
| **7** | `wakeSchedule` | Flexible | Typical wake time (decimal hours 0.0 to 23.5) | Existing flatmates' average wake time | Number (0.0–23.5) |
| **8** | `cleanliness` | Flexible | Personal cleanliness standard (1=Casual to 5=Impeccable) | Current flat cleanliness & maid service standard | Number (1–5) |
| **9** | `noiseTolerance` | Flexible | Noise sensitivity (1=Silent sanctuary to 5=Vibrant buzz) | Flat noise environment & sound habits | Number (1–5) |
| **10** | `guestsDay` | Flexible | Hosting frequency preference | Daytime visitor rules & frequency | Enum string |
| **11** | `guestsOvernight` | Hard / Flexible | Overnight guest expectations | Overnight visitor permissions (`Allowed`, `Notice Required`, `Same-Gender Only`, `No`) | Enum string |
| **12** | `socialPreference` | Flexible | Home culture preference (`Quiet Retreat` vs `Social Hub`) | Current flat social atmosphere | Enum string |
| **13** | `workSchedule` | Flexible | Shift type (`Regular Day`, `Night Shift`, `College Hours`) | Current flatmates' primary work hours | Enum string |
| **14** | `wfhFrequency` | Flexible | Days working from home per week | Number of flatmates working from home | Number (0–7 days) |
| **15** | `studyHabits` | Flexible | Study requirements (quiet hours needed, exam preparation) | Study environment suitability | Enum string / Number |
| **16** | `cookingFrequency` | Flexible | Cooking habit (`Daily`, `Occasional`, `Tiffin / Order Out`) | Kitchen utilization level & shared cook presence | Enum string |
| **17** | `petsPreference` | Hard / Flexible | Pet ownership / allergies / tolerance | Current pets present & flat pet policy | Enum string |
| **18** | `foodSharing` | Flexible | Grocery approach (`Separate Groceries` vs `Shared Kitchen`) | Flat kitchen pooling policy | Enum string |
| **19** | `moveInDate` | Hard / Flexible | Desired earliest & latest move-in dates | Room availability date (`availableFrom`) | ISO Date |
| **20** | `stayDuration` | Hard / Flexible | Expected duration (months: 3, 6, 11+) | Minimum lease tenure (`minStayMonths`) | Number (months) |
| **21** | `personalSpace` | Flexible | Space need (`High Privacy`, `Balanced`, `Communal`) | Household personal-space culture | Enum string |
| **22** | `rulesStrictness` | Flexible | Gate curfew & society restriction tolerance | Society curfews & formal landlord house rules | Enum string |

---

## 3. Data Model Specifications

### 3.1 Model 1: `User`
- **Purpose:** Central entity for authentication, profile metadata, roles, and trust verification.
- **Collection Name:** `users`
- **Status:** **Proposed / Missing**
- **Schema Definition:**

| Field | Type | Required | Default | Validation / Enums | Description |
|---|---|---|---|---|---|
| `_id` | `ObjectId` | Auto | Generated | Valid ObjectId | Unique user identifier |
| `fullName` | `String` | Yes | — | Trimmed, 2–80 chars | User's full name |
| `email` | `String` | Yes | — | Unique, lowercase, valid email | Primary login credential |
| `password` | `String` | Yes | — | Min 60 chars (hashed) | Bcrypt password hash (hidden in `select: false`) |
| `phone` | `String` | Yes | — | 10 digits regex | Contact phone number |
| `role` | `String` | Yes | `'seeker'` | Enum: `['seeker', 'owner', 'admin']` | Application role |
| `avatar` | `String` | No | `null` | Valid URL | Profile image hosted on Cloudinary |
| `isVerified` | `Boolean` | No | `false` | Boolean | True once identity documents are reviewed |
| `verificationMethod` | `String` | No | `null` | Enum: `['Govt_ID', 'Work_Email', 'College_ID']` | Verification badge tier |
| `occupation` | `String` | No | `''` | Max 100 chars | Job title or student program |
| `company` | `String` | No | `''` | Max 100 chars | Employer or university name |
| `city` | `String` | No | `'Bengaluru'` | Max 50 chars | Primary operating city |
| `bio` | `String` | No | `''` | Max 500 chars | Self-description |
| `hasCompletedOnboarding` | `Boolean`| No | `false` | Boolean | True when 22-factor profile is saved |
| `createdAt` | `Date` | Auto | Timestamp | — | Account creation timestamp |
| `updatedAt` | `Date` | Auto | Timestamp | — | Last account update timestamp |

- **Indexes:**
  - `{ email: 1 }` (Unique)
  - `{ phone: 1 }`
  - `{ role: 1 }`
- **Security & Authorization Rules:**
  - Passwords excluded from default queries via `select: false`.
  - Profile updates restricted to `req.user.id === user._id`.

---

### 3.2 Model 2: `RoomListing`
- **Purpose:** Physical property specifications, pricing, amenities, high-res photos, and embedded living conditions.
- **Collection Name:** `roomlistings`
- **Status:** **Proposed / Missing**
- **Schema Definition:**

| Field | Type | Required | Default | Validation / Enums | Description |
|---|---|---|---|---|---|
| `_id` | `ObjectId` | Auto | Generated | Valid ObjectId | Unique listing identifier |
| `owner` | `ObjectId` | Yes | — | Ref: `'User'` | Property owner or lead flatmate |
| `title` | `String` | Yes | — | Trimmed, 10–120 chars | Listing title |
| `locality` | `String` | Yes | — | Trimmed, e.g. "Koramangala 4th Block" | Neighborhood locality |
| `city` | `String` | Yes | `'Bengaluru'` | Enum / String | Indian metro city |
| `state` | `String` | Yes | `'Karnataka'` | String | State |
| `pinCode` | `String` | Yes | — | 6-digit regex | Postal code |
| `location` | `Object` | No | — | GeoJSON Point `[lng, lat]` | Coordinates for distance matrix |
| `rent` | `Number` | Yes | — | Positive integer (INR) | Monthly room rent |
| `maintenance` | `Number` | No | `0` | Non-negative integer (INR) | Monthly maintenance charges |
| `deposit` | `Number` | Yes | — | Positive integer (INR) | Security deposit |
| `roomType` | `String` | Yes | — | Enum: `['Private Room with Attached Bath', 'Private Room (Shared Bath)', 'Shared Room']` | Type of accommodation |
| `furnishing` | `String` | Yes | — | Enum: `['Fully Furnished', 'Semi-Furnished', 'Unfurnished']` | Furnishing tier |
| `availableFrom` | `Date` | Yes | — | Valid date | Move-in availability date |
| `minStayMonths` | `Number` | Yes | `6` | Min 1, Max 36 | Minimum lease tenure |
| `images` | `[String]`| Yes | `[]` | Array of Cloudinary URLs | High-resolution photographs |
| `amenities` | `[String]`| No | `[]` | Strings (WiFi, AC, Power Backup, RO) | Included facilities |
| `livingConditions` | `LivingConditionsSchema` | Yes | Subdoc | Embedded schema | Complete flat culture across 22 factors |
| `status` | `String` | Yes | `'active'` | Enum: `['active', 'reserved', 'occupied', 'deactivated']` | Listing lifecycle state |

- **Subdocument: `LivingConditionsSchema`:**
  - `foodPreference`: `String` (Enum: `['Pure Vegetarian', 'Eggetarian / Flexible Non-veg', 'Non-Veg Welcome']`)
  - `smoking`: `String` (Enum: `['Strictly Non-Smoking', 'Balcony Only', 'Allowed']`)
  - `alcohol`: `String` (Enum: `['Teetotaler', 'Social Drinking OK', 'Allowed']`)
  - `sleepSchedule`: `Number` (0.0 to 23.5)
  - `wakeSchedule`: `Number` (0.0 to 23.5)
  - `cleanliness`: `Number` (1.0 to 5.0)
  - `noiseTolerance`: `Number` (1.0 to 5.0)
  - `guestsDay`: `String`
  - `guestsOvernight`: `String`
  - `socialPreference`: `String`
  - `workSchedule`: `String`
  - `wfhFrequency`: `Number` (0 to 7)
  - `studyHabits`: `String`
  - `cookingFrequency`: `String`
  - `petsPreference`: `String`
  - `foodSharing`: `String`
  - `personalSpace`: `String`
  - `rulesStrictness`: `String`
- **Indexes:**
  - `{ city: 1, locality: 1 }`
  - `{ rent: 1 }`
  - `{ status: 1 }`
  - `{ "location": "2dsphere" }` (Geospatial index for commute proximity)
  - `{ owner: 1 }`

---

### 3.3 Model 3: `PreferenceProfile`
- **Purpose:** Seeker's structured 22-factor answers, segregated into hard constraints, flexible continuous habits, and custom importance weights.
- **Collection Name:** `preferenceprofiles`
- **Status:** **Proposed / Missing**
- **Schema Definition:**

| Field | Type | Required | Default | Validation / Enums | Description |
|---|---|---|---|---|---|
| `_id` | `ObjectId` | Auto | Generated | Valid ObjectId | Unique profile ID |
| `user` | `ObjectId` | Yes | — | Ref: `'User'`, Unique | One profile per user |
| `hardConstraints` | `Object` | Yes | Subdoc | — | Deal-breakers evaluated first |
| `hardConstraints.budgetCeiling` | `Number` | Yes | — | Min 1000 | Maximum monthly rent ceiling |
| `hardConstraints.maxDeposit` | `Number` | No | `null` | Positive number | Maximum security deposit |
| `hardConstraints.dietaryRule` | `String` | Yes | `'Any'` | Enum: `['Pure-Veg', 'Veg-Only Flat', 'Flexible', 'Any']` | Dietary restriction |
| `hardConstraints.smokingPolicy`| `String` | Yes | `'Flexible'` | Enum: `['Strictly Non-Smoking', 'Balcony Only', 'Flexible']` | Smoking intolerance |
| `hardConstraints.alcoholPolicy`| `String` | Yes | `'Flexible'` | Enum: `['Teetotaler', 'Moderate', 'Flexible']` | Alcohol tolerance |
| `hardConstraints.petPolicy` | `String` | Yes | `'Flexible'` | Enum: `['Strictly No Pets', 'Pet-Friendly', 'Has Pet', 'Flexible']` | Pet compatibility |
| `hardConstraints.earliestMoveIn` | `Date` | No | `null` | ISO Date | Earliest move-in |
| `hardConstraints.latestMoveIn` | `Date` | No | `null` | ISO Date | Latest acceptable move-in |
| `flexiblePreferences` | `Object` | Yes | Subdoc | — | Continuous parameters scored via Fuzzy Logic |
| `flexiblePreferences.sleepSchedule` | `Number` | Yes | `23.0` | 0.0–23.5 | Target bedtime |
| `flexiblePreferences.wakeSchedule` | `Number` | Yes | `7.0` | 0.0–23.5 | Target wake time |
| `flexiblePreferences.cleanliness` | `Number` | Yes | `4` | 1–5 scale | Cleanliness standard |
| `flexiblePreferences.noiseTolerance` | `Number` | Yes | `3` | 1–5 scale | Noise tolerance standard |
| `flexiblePreferences.wfhDays` | `Number` | Yes | `2` | 0–7 days/week | WFH frequency |
| `flexiblePreferences.guestPolicy` | `String` | Yes | `'Occasional'` | Enum: `['Rare', 'Occasional', 'Frequent']` | Day guest hosting |
| `flexiblePreferences.overnightGuests`| `String`| Yes | `'With Notice'` | Enum: `['Not Allowed', 'With Notice', 'Frequent']` | Overnight guest rule |
| `flexiblePreferences.socialPreference`| `String`| Yes | `'Balanced'` | Enum: `['Quiet Retreat', 'Balanced', 'Social Hub']` | Home atmosphere |
| `flexiblePreferences.cookingHabit` | `String`| Yes | `'Daily'` | Enum: `['Daily', 'Occasional', 'Tiffin / Delivery']` | Kitchen usage |
| `flexiblePreferences.foodSharing` | `String` | Yes | `'Separate Groceries'` | Enum: `['Separate Groceries', 'Shared Staples', 'Full Communal']` | Grocery sharing |
| `flexiblePreferences.personalSpace` | `String`| Yes | `'High'` | Enum: `['High', 'Balanced', 'Communal']` | Downtime preference |
| `flexiblePreferences.rulesStrictness`| `String`| Yes | `'Moderate'` | Enum: `['Strict Curfew', 'Moderate', 'Self-Managed']` | Curfew tolerance |
| `importanceWeights` | `Object` | Yes | Subdoc | Values: integers 1–5 | User weights applied to fuzzy scores |
| `importanceWeights.budget` | `Number` | Yes | `5` | 1–5 | Importance of rent match |
| `importanceWeights.diet` | `Number` | Yes | `4` | 1–5 | Importance of food match |
| `importanceWeights.sleepSync` | `Number` | Yes | `5` | 1–5 | Importance of sleep overlap |
| `importanceWeights.cleanliness` | `Number` | Yes | `4` | 1–5 | Importance of hygiene match |
| `importanceWeights.noise` | `Number` | Yes | `4` | 1–5 | Importance of quiet hours |
| `importanceWeights.guests` | `Number` | Yes | `3` | 1–5 | Importance of visitor policy |
| `importanceWeights.wfh` | `Number` | Yes | `3` | 1–5 | Importance of remote work harmony |

- **Indexes:**
  - `{ user: 1 }` (Unique)

---

### 3.4 Model 4: `Interaction`
- **Purpose:** Logs explicit and implicit user actions (clicks, views, bookmarks, enquiries) used for Collaborative Filtering recommendations.
- **Collection Name:** `interactions`
- **Status:** **Proposed / Missing**
- **Schema Definition:**

| Field | Type | Required | Default | Validation / Enums | Description |
|---|---|---|---|---|---|
| `_id` | `ObjectId` | Auto | Generated | Valid ObjectId | Unique event ID |
| `user` | `ObjectId` | Yes | — | Ref: `'User'` | Acting user |
| `room` | `ObjectId` | Yes | — | Ref: `'RoomListing'` | Target listing |
| `action` | `String` | Yes | — | Enum: `['view', 'save', 'unsave', 'enquire', 'book_visit']` | Type of user interaction |
| `dwellTimeSeconds` | `Number` | No | `0` | Non-negative integer | Time spent on detail page |
| `createdAt` | `Date` | Auto | Timestamp | — | Event timestamp |

- **Indexes:**
  - `{ user: 1, room: 1, action: 1 }`
  - `{ createdAt: -1 }` (Time-series queries for CF decay functions)

---

### 3.5 Model 5: `Booking`
- **Purpose:** Tracks rental applications, physical/virtual visit requests, and tenancy move-in reservations.
- **Collection Name:** `bookings`
- **Status:** **Proposed / Missing**
- **Schema Definition:**

| Field | Type | Required | Default | Validation / Enums | Description |
|---|---|---|---|---|---|
| `_id` | `ObjectId` | Auto | Generated | Valid ObjectId | Booking reference ID |
| `room` | `ObjectId` | Yes | — | Ref: `'RoomListing'` | Booked listing |
| `seeker` | `ObjectId` | Yes | — | Ref: `'User'` | Applying seeker |
| `owner` | `ObjectId` | Yes | — | Ref: `'User'` | Listing owner |
| `bookingType` | `String` | Yes | `'visit'` | Enum: `['visit', 'tenancy_reservation']` | Type of booking |
| `scheduledDate` | `Date` | Yes | — | Future date | Scheduled visit or move-in date |
| `status` | `String` | Yes | `'pending'` | Enum: `['pending', 'confirmed', 'completed', 'cancelled', 'rejected']` | Booking lifecycle status |
| `tokenAmount` | `Number` | No | `0` | INR integer | Token reservation deposit amount |
| `paymentId` | `String` | No | `null` | Razorpay payment reference | Gateway transaction reference |
| `notes` | `String` | No | `''` | Max 300 chars | Seeker's introductory note |

- **Indexes:**
  - `{ room: 1, seeker: 1 }`
  - `{ owner: 1, status: 1 }`
  - `{ scheduledDate: 1 }`

---

### 3.6 Model 6: `Conversation`
- **Purpose:** Root container for direct real-time communication between a room seeker and an owner.
- **Collection Name:** `conversations`
- **Status:** **Proposed / Missing**
- **Schema Definition:**

| Field | Type | Required | Default | Validation / Enums | Description |
|---|---|---|---|---|---|
| `_id` | `ObjectId` | Auto | Generated | Valid ObjectId | Unique chat thread ID |
| `participants` | `[ObjectId]`| Yes | — | Ref: `'User'`, Array length: 2 | Two interlocutors |
| `room` | `ObjectId` | Yes | — | Ref: `'RoomListing'` | Listing context for conversation |
| `lastMessage` | `String` | No | `''` | Preview snippet | Last message snippet for inbox preview |
| `lastMessageAt`| `Date` | No | `Date.now`| Timestamp | Sort key for active conversations |
| `unreadCounts` | `Map` | No | `{}` | Key: UserId, Value: Number | Unread counter per participant |

- **Indexes:**
  - `{ participants: 1 }`
  - `{ room: 1 }`
  - `{ lastMessageAt: -1 }`

---

### 3.7 Model 7: `Message`
- **Purpose:** Individual chat messages and system status event items within a conversation thread.
- **Collection Name:** `messages`
- **Status:** **Proposed / Missing**
- **Schema Definition:**

| Field | Type | Required | Default | Validation / Enums | Description |
|---|---|---|---|---|---|
| `_id` | `ObjectId` | Auto | Generated | Valid ObjectId | Unique message ID |
| `conversation` | `ObjectId` | Yes | — | Ref: `'Conversation'` | Parent thread |
| `sender` | `ObjectId` | Yes | — | Ref: `'User'` | Author of the message |
| `text` | `String` | Yes | — | 1–2000 chars | Message text content |
| `messageType` | `String` | Yes | `'text'` | Enum: `['text', 'visit_invite', 'system_event']` | Message category |
| `isRead` | `Boolean` | No | `false` | Boolean | True once recipient acknowledges |
| `readAt` | `Date` | No | `null` | Timestamp | Timestamp of delivery receipt |

- **Indexes:**
  - `{ conversation: 1, createdAt: 1 }`

---

### 3.8 Model 8: `Agreement`
- **Purpose:** Digital rental contracts with cryptographically verified checksums, QR codes, and digital signing states.
- **Collection Name:** `agreements`
- **Status:** **Proposed / Missing**
- **Schema Definition:**

| Field | Type | Required | Default | Validation / Enums | Description |
|---|---|---|---|---|---|
| `_id` | `ObjectId` | Auto | Generated | Valid ObjectId | Unique contract ID |
| `booking` | `ObjectId` | Yes | — | Ref: `'Booking'` | Associated tenancy booking |
| `room` | `ObjectId` | Yes | — | Ref: `'RoomListing'` | Subject property |
| `owner` | `ObjectId` | Yes | — | Ref: `'User'` | First party |
| `tenant` | `ObjectId` | Yes | — | Ref: `'User'` | Second party |
| `rentTerms` | `Object` | Yes | Subdoc | Monthly rent, maintenance, deposit | Agreed financial terms |
| `tenancyStart` | `Date` | Yes | — | Valid date | Lease commencement date |
| `tenancyEnd` | `Date` | Yes | — | Valid date | Lease termination date |
| `ownerSigned` | `Boolean` | Yes | `false` | Boolean | Owner digital sign status |
| `ownerSignedAt`| `Date` | No | `null` | Timestamp | Timestamp of owner signature |
| `tenantSigned`| `Boolean` | Yes | `false` | Boolean | Tenant digital sign status |
| `tenantSignedAt`| `Date` | No | `null` | Timestamp | Timestamp of tenant signature |
| `status` | `String` | Yes | `'draft'` | Enum: `['draft', 'pending_signatures', 'active', 'terminated']` | Lifecycle of contract |
| `documentHash`| `String` | No | `null` | SHA-256 string | Cryptographic tamper-proof checksum |
| `qrVerificationCode`| `String`| No| `null`| URL string | Embeddable QR verification target |
| `pdfFileUrl` | `String` | No | `null` | URL string | Stored PDF file location |

- **Indexes:**
  - `{ room: 1 }`
  - `{ owner: 1 }`
  - `{ tenant: 1 }`

---

### 3.9 Model 9: `Review`
- **Purpose:** Verified flatmate and room reviews submitted after tenancy stays.
- **Collection Name:** `reviews`
- **Status:** **Proposed / Missing**
- **Schema Definition:**

| Field | Type | Required | Default | Validation / Enums | Description |
|---|---|---|---|---|---|
| `_id` | `ObjectId` | Auto | Generated | Valid ObjectId | Unique review ID |
| `reviewer` | `ObjectId` | Yes | — | Ref: `'User'` | Submitting user |
| `targetUser` | `ObjectId` | No | `null` | Ref: `'User'` | Reviewed flatmate (if peer review) |
| `room` | `ObjectId` | Yes | — | Ref: `'RoomListing'` | Reviewed listing |
| `stayDurationMonths`| `Number`| Yes | — | Integer >= 1 | Verified tenancy tenure |
| `rating` | `Number` | Yes | — | 1.0 to 5.0 (step: 0.1) | Overall score |
| `content` | `String` | Yes | — | 20–1000 chars | Detailed written testimonial |
| `tags` | `[String]`| No | `[]` | E.g. `['Quiet at night', 'Super clean']` | Highlight badges |
| `isVerifiedTenancy`| `Boolean`| Yes| `true` | Boolean | Verified against a completed booking |

- **Indexes:**
  - `{ room: 1 }`
  - `{ targetUser: 1 }`
  - `{ reviewer: 1, room: 1 }` (Unique constraint: one review per user per room)

---

### 3.10 Model 10: `Complaint`
- **Purpose:** Tracks community dispute reports, rule violations, and fraud flags with moderation states.
- **Collection Name:** `complaints`
- **Status:** **Proposed / Missing**
- **Schema Definition:**

| Field | Type | Required | Default | Validation / Enums | Description |
|---|---|---|---|---|---|
| `_id` | `ObjectId` | Auto | Generated | Valid ObjectId | Unique complaint ticket ID |
| `complainant`| `ObjectId` | Yes | — | Ref: `'User'` | Reporting party |
| `accusedUser`| `ObjectId` | No | `null` | Ref: `'User'` | Reported party |
| `room` | `ObjectId` | No | `null` | Ref: `'RoomListing'` | Subject property (if listing dispute) |
| `category` | `String` | Yes | — | Enum: `['Noise & Quiet Hours', 'Cleanliness & Hygiene', 'Payment Dispute', 'Harassment', 'False Listing Specs', 'Other']` | Issue classification |
| `description`| `String` | Yes | — | 20–1500 chars | Issue narrative |
| `evidenceUrls`| `[String]`| No | `[]` | Cloudinary URLs | Attached screenshots/documents |
| `status` | `String` | Yes | `'Open'` | Enum: `['Open', 'Under Review', 'Resolved', 'Dismissed']` | Moderation resolution state |
| `adminNotes` | `String` | No | `''` | Internal notes | Resolution commentary |

- **Indexes:**
  - `{ complainant: 1 }`
  - `{ status: 1 }`
  - `{ createdAt: -1 }`

---

## 4. Key Decisions & Open Questions for Team Alignment

1. **Geocoding & Commute Calculations (Decision for Member 2 & 3):**
   - Current plan uses GeoJSON Point on `RoomListing` with a 2dsphere index.
   - *Question:* Should commute time in minutes be calculated on-the-fly via Google Maps Distance Matrix API, or approximated using Haversine distance to minimize external API costs?
2. **Preference Profile Storage vs. Fast Memory Access (Decision for Member 2 & 3):**
   - The matching engine processes hundreds of listings per request.
   - *Question:* Should candidate room listings be queried directly with Mongoose projections matching hard constraints, or fetched into memory and processed through a compiled pipeline?
3. **Multi-Role Accounts (Decision for Member 1 & 2):**
   - Currently, `User.role` is an enum (`'seeker'` or `'owner'`).
   - *Question:* Should an owner also be allowed to seek rooms with the same login account (e.g., `role: ['seeker', 'owner']` or dynamic switching)?
