# RoomSync 🏠✨

> **Intelligent, explainable roommate finding and shared rental platform for students and working professionals in India.**

---

## 🌟 What is RoomSync?

Finding a room or a flatmate in Indian metros (such as Bengaluru, Pune, Delhi-NCR, Hyderabad, and Mumbai) is often fraught with friction. Traditional platforms focus only on rent, location, and photos, ignoring the actual root cause of roommate fallout: **conflicting lifestyles, mismatched routines, and divergent personal-space boundaries**.

**RoomSync** solves this through an **explainable 22-factor compatibility engine**. It respects non-negotiable hard constraints (such as food preference, smoking policy, and budget ceilings) while scoring flexible lifestyle habits with user-defined importance weights using Fuzzy Logic and TOPSIS multi-criteria decision making.

---

## 🔑 Key Features & Highlights

- **22 Multidimensional Compatibility Factors**: From sleep & wake schedules to WFH frequency, cooking habits, personal space, and guest rules.
- **Explainable Match Scores**: No black-box magic numbers. See exact reasons why a room is a match, plus explicit warnings on potential lifestyle friction points.
- **Separation of Compatibility & Ranking**: Personal compatibility (`compatibilityScore`) is calculated distinctly from property ranking (`rankingScore`).
- **Apple-Inspired Minimalist Design**: Clean typography, warm off-white surfaces, generous whitespace, and restrained emerald/teal accents.
- **Two Dedicated Roles**: Tailored portals for **Room Seekers** (search, lifestyle survey, match cards, saved rooms) and **Room Owners** (listing creator, applicants dashboard, visit scheduler).
- **Direct Real-Time Chat & Agreements**: Integrated enquiries, visit coordination, and digital tenancy agreement generation with verification QR codes.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, React Router v6, TanStack Query, Lucide React Icons |
| **Backend** | Node.js, Express.js, MongoDB Atlas with Mongoose ODM, JWT & bcrypt, Socket.IO |
| **Integrations** | Cloudinary (photos), Google Maps Platform (locations), Razorpay (test deposits), PDFKit & QRCode (agreements) |

---

## 📂 Project Structure

```text
roomsync/
├── frontend/                # Vite + React Single Page Application
│   ├── src/
│   │   ├── components/      # Reusable UI & design system primitives
│   │   ├── context/         # Auth, preferences, and theme states
│   │   ├── hooks/           # Custom React hooks
│   │   ├── layouts/         # Shared Navbar, Footer, and layouts
│   │   ├── pages/           # All 14 dedicated application pages
│   │   ├── services/        # API client and mock data layer
│   │   ├── utils/           # Helper functions & math utilities
│   │   ├── App.jsx          # Router & TanStack Query setup
│   │   └── main.jsx         # Application entry point
│   ├── tailwind.config.js   # Custom design tokens & palette
│   └── package.json
│
├── backend/                 # Node.js + Express API server
│   ├── src/
│   │   ├── config/          # Database & third-party service configs
│   │   ├── controllers/     # Route request handlers
│   │   ├── middleware/      # Auth, validation, error handlers
│   │   ├── models/          # MongoDB Mongoose schemas
│   │   ├── routes/          # Express route definitions
│   │   └── services/        # 22-factor matching engine & TOPSIS
│   └── package.json
│
├── PROJECT_CONTEXT.md       # Full product specification & 22-factor details
├── AGENTS.md                # Engineering standards & development conventions
├── README.md                # Project overview and setup instructions
└── .gitignore               # Ignored dependencies and build artifacts
```

---

## 🚀 Getting Started (Beginner Friendly)

### 1. Prerequisites
Ensure you have the following installed on your computer:
- **Node.js** (v18 or higher recommended) — [Download here](https://nodejs.org/)
- **Git** — [Download here](https://git-scm.com/)

You can verify your installation by opening your terminal (PowerShell or Command Prompt) and running:
```powershell
node -v
npm -v
git --version
```

### 2. Setting Up the Workspace
If you are using Antigravity or VS Code, open the project directory:
```powershell
cd C:\Users\shiva\.gemini\antigravity\scratch\roomsync
```

### 3. Running the Frontend
1. Navigate into the frontend folder:
   ```powershell
   cd frontend
   ```
2. If dependencies are not yet installed, install them:
   ```powershell
   npm install
   ```
3. Start the local development server:
   ```powershell
   npm run dev
   ```
4. Open your browser and navigate to the local URL shown in your terminal (typically `http://localhost:5173`).

### 4. Running the Backend (Coming in Phase 2)
1. Navigate into the backend directory:
   ```powershell
   cd ../backend
   ```
2. Install dependencies:
   ```powershell
   npm install
   ```
3. Start the API server:
   ```powershell
   npm run dev
   ```

---

## 🗺️ 14 Required Pages Map

1. **Home (`/`)**: Hero discovery, 22-factor value prop, curated rooms, trust elements.
2. **Explore Rooms (`/explore`)**: Filterable room catalog with map/grid toggle.
3. **Room Details (`/rooms/:id`)**: Gallery, specs, owner bio, and compatibility preview.
4. **Login (`/login`)**: Seeker & Owner authentication.
5. **Signup (`/signup`)**: Role-based registration.
6. **Preference Onboarding (`/onboarding`)**: 22-factor lifestyle questionnaire with importance sliders.
7. **Compatibility Matches (`/matches`)**: Personal matches with transparent scores and mismatch warnings.
8. **Owner Dashboard (`/owner/dashboard`)**: Listing stats, enquiries, and visit requests.
9. **Create / Edit Listing (`/owner/listings/new`)**: Property specs, house rules, and room images.
10. **Saved Rooms (`/saved`)**: Bookmarked listings for quick comparison.
11. **Profile & Settings (`/profile`)**: Manage personal details and lifestyle weights.
12. **Enquiries & Chat (`/messages`)**: Real-time conversation between seekers and owners.
13. **Booking & Agreements (`/bookings`)**: Rental agreement generation, test deposits, and QR verification.
14. **Reviews & Complaints (`/reviews-complaints`)**: Post-stay ratings and community issue reports.

---

## 📈 Roadmap & Phased Implementation

- [x] **Phase 1: Project Foundation & Design System**
  - Project specification, engineering guidelines, and documentation
  - React + Vite + Tailwind CSS design tokens (Apple-inspired minimalism)
  - 14 separate route definitions with shared responsive Navbar and Footer
  - Reusable UI component primitives (Button, Card, Badge, Input, ScoreGauge)
- [ ] **Phase 2: Backend Architecture & Data Models**
  - Express server, MongoDB Mongoose models, and JWT authentication
- [ ] **Phase 3: Lifestyle Profile & Onboarding Engine**
  - 22-factor questionnaire with hard/flexible logic and weight sliders
- [ ] **Phase 4: Explainable Compatibility & TOPSIS Matching Pipeline**
  - Fuzzy logic rules, weighted calculation, and TOPSIS multi-criteria ranking
- [ ] **Phase 5: Listing Management & Explore Catalog**
  - Multi-photo upload, geocoded map exploration, and search filters
- [ ] **Phase 6: Real-Time Chat, Agreements & Booking**
  - Socket.IO messaging, PDFKit rental agreement generation, and test payments
