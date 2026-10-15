# RoomSync — Agent & Engineering Guidelines

This document serves as the operational handbook for any autonomous AI agent, pair programmer, or developer contributing to the **RoomSync** codebase.

---

## 1. Core Operating Principles

1. **Be Honest and Transparent with Algorithms**:
   - Never fabricate compatibility scores or display arbitrary percentages.
   - Separate `compatibilityScore` (interpersonal lifestyle synergy) from `rankingScore` (multi-criteria property ranking like TOPSIS).
   - A compatibility percentage is a quantified lifestyle alignment metric, **not** a probability guarantee of roommate harmony.
   - Always provide explainability: show which factors aligned and highlight active mismatches/friction points.

2. **Phase-by-Phase Discipline**:
   - Build incrementally. Never attempt to implement all 14 pages or backend models in a single sweep without verification.
   - Establish foundations, verify build integrity, write unit/integration tests, and ensure zero lint/runtime errors before marking a task complete.

3. **Beginner-Friendly Communication**:
   - The user is a beginner. Explain complex concepts (e.g., Fuzzy Logic, TOPSIS, JWT auth, MongoDB indexing) in simple, accessible terms.
   - Always provide exact terminal commands and explain what each command does.

4. **Security & Production Safety**:
   - Never expose secrets, API keys, or password hashes to the client.
   - Always sanitize and validate client inputs on the Express backend using schema validation.
   - Keep mock data isolated in designated directories (e.g., `src/data/mock/` or `src/mocks/`) so it can be cleanly swapped with real API endpoints.
   - Never simulate fake production states for financial transactions, identity verification, or digital signatures. Use test mode (e.g., Razorpay test key, sandbox environments).

---

## 2. Directory & Architecture Layout

RoomSync is structured as a clean monorepo containing a modern React frontend and a robust Express backend:

```text
roomsync/
├── frontend/                     # React + Vite Single Page Application
│   ├── public/                   # Public static assets & brand marks
│   ├── src/
│   │   ├── assets/               # Local icons, illustrations, placeholder imagery
│   │   ├── components/           # Reusable UI component library
│   │   │   ├── common/           # Navbar, Footer, PageContainer, Modal, Drawer
│   │   │   ├── ui/               # Apple-inspired primitives: Button, Card, Badge, Input, Slider
│   │   │   └── compatibility/    # FactorBadge, ScoreGauge, MismatchWarning, RadarChart
│   │   ├── context/              # AuthContext, PreferenceContext, ThemeContext
│   │   ├── hooks/                # Custom React hooks (useAuth, useRooms, useMatch)
│   │   ├── layouts/              # MainLayout, AuthLayout, DashboardLayout
│   │   ├── pages/                # All 14 dedicated route components
│   │   ├── services/             # API client, HTTP interceptors, endpoint methods
│   │   ├── types/                # Type definitions & data interfaces
│   │   ├── utils/                # Formatting, cn() helper, math utilities
│   │   ├── App.jsx               # Route definitions & TanStack Query client provider
│   │   ├── index.css             # Tailwind base, components, and utility layers
│   │   └── main.jsx              # React DOM entry point
│   ├── tailwind.config.js        # Design tokens: palette, typography, radii, shadows
│   ├── vite.config.js            # Vite build configuration & server proxy setup
│   └── package.json
│
├── backend/                      # Node.js + Express API Server
│   ├── src/
│   │   ├── config/               # DB connection, Cloudinary, Razorpay, JWT config
│   │   ├── controllers/          # Request handlers for auth, rooms, matching, bookings
│   │   ├── middleware/           # authMiddleware, validateRequest, errorHandler
│   │   ├── models/               # Mongoose schemas (User, RoomListing, PreferenceProfile)
│   │   ├── routes/               # Modular Express routers
│   │   ├── services/             # Business logic: MatchingEngine, TOPSIS, PDFGenerator
│   │   ├── utils/                # Response helpers, logger, math functions
│   │   └── app.js                # Express app initialization & Socket.IO attachment
│   ├── tests/                    # Backend test suites (Jest / Supertest)
│   ├── server.js                 # Server entry point listening on port
│   └── package.json
│
├── PROJECT_CONTEXT.md            # Master domain specifications & 22-factor definitions
├── AGENTS.md                     # Engineering conventions and agent guidelines (this file)
├── README.md                     # Setup instructions and project overview
└── .gitignore                    # Root gitignore excluding node_modules, .env, dist, etc.
```

---

## 3. Design System & Frontend Standards

### Visual Language: Apple-Inspired Minimalist Residential
- **Color Palette**:
  - `bg-surface`: `#FBFBFD` (warm off-white foundation)
  - `bg-card`: `#FFFFFF` (crisp white elevated cards with subtle borders)
  - `text-primary`: `#1D1D1F` (deep graphite black)
  - `text-secondary`: `#6E6E73` (refined neutral slate)
  - `brand-teal`: `#0F766E` / `#0D9488` (restrained, trustworthy emerald/teal accent)
  - `border-subtle`: `rgba(0, 0, 0, 0.08)` / `#E5E5EA`
- **Typography**: Clean, geometric sans-serif (Inter system font stack) with generous letter-spacing on subheadings and high line-height readability.
- **Card Styling**: Rounded corners (`rounded-2xl` to `rounded-3xl`), delicate 1px border (`border-black/[0.06]`), soft diffused shadow (`shadow-sm hover:shadow-md transition-all duration-300`).
- **Whitespace**: Generous breathing room (`py-16 md:py-24`, `gap-6 md:gap-8`).

---

## 4. The 22 Compatibility Factors Implementation Contract

When implementing or modifying preference schemas and matching logic, ensure the 22 factors are strictly maintained:

1. `location`: Commute radius, preferred localities, transit proximity.
2. `budget`: Monthly rent ceiling, maintenance, and deposit.
3. `foodPreference`: Vegetarian, Non-veg, Vegan, Jain, Eggetarian, separate kitchenware.
4. `smoking`: Non-smoking, balcony only, allowed.
5. `alcohol`: Teetotaler, occasional/social, allowed.
6. `sleepSchedule`: Typical bedtime (hours 0–23).
7. `wakeSchedule`: Typical wake-up time (hours 0–23).
8. `cleanliness`: Index 1 (casual) to 5 (impeccable/daily deep clean).
9. `noiseTolerance`: Index 1 (silent sanctuary) to 5 (thrives with audio/social buzz).
10. `guestsDay`: Frequency of day guests (never, occasional, frequent).
11. `guestsOvernight`: Allowed, same-gender only, partners, advance notice required.
12. `socialPreference`: Home as quiet retreat vs. lively social hub.
13. `workSchedule`: Standard day shifts vs. rotational/night shifts vs. college hours.
14. `wfhFrequency`: Days per week working from home (0–7).
15. `studyHabits`: Quiet exam prep requirements vs. relaxed studying.
16. `cookingFrequency`: Daily home cooking vs. ordering/tiffin service.
17. `petsPreference`: Has pets, pet-friendly, allergies, strictly no pets.
18. `foodSharing`: Separate supplies vs. shared groceries & shared cooking.
19. `moveInDate`: Earliest and latest acceptable move-in dates.
20. `stayDuration`: Desired lease duration (3, 6, 11+ months).
21. `personalSpace`: Need for solitary downtime vs. communal interaction.
22. `rulesStrictness`: Landlord/society gate curfews and formal house rules.

---

## 5. Verification & Testing Workflow

Before concluding any implementation task:
1. Run `npm run build` in the frontend and backend to verify zero compilation or bundling errors.
2. Verify all navigation routes load without uncaught React errors or blank screens.
3. Check browser console logs for warnings, missing keys, or broken links.
4. If writing algorithmic logic (e.g., Fuzzy membership or TOPSIS), add automated unit tests checking boundary conditions (e.g., zero weights, identical vectors, extreme outliers).
