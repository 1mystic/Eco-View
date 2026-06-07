# EcoView — Changelog
All notable changes to this project are documented here.

Format: `[YYYY-MM-DD] — [PHASE] — [Description]`

---

## [2026-05-16] — PHASE 2 — Frontend Redesign (In Progress)

### Added
- `frontend/src/styles/ecoview.css` — complete design system CSS (TerraPulse DESIGN-2.md adapted for EcoView)
- `frontend/src/pages/Home.jsx` — full EcoView landing page (15 sections, scroll animations, FAQ accordion, solutions tabs, dashboard mockup)

### Changed
- `frontend/index.html` — added Plus Jakarta Sans + Hanken Grotesk Google Fonts, removed CDN Tailwind script, added meta description
- `frontend/src/components/Navbar.jsx` — complete redesign: EcoView logo, glassmorphism scroll effect, green-dot active states, EcoView brand palette
- Design direction: TerraPulse HTML structure + animations + DESIGN-2.md color/spacing + DESIGN.md font override (Plus Jakarta Sans + Hanken Grotesk instead of Instrument Serif + DM Sans)

---

## [2026-05-16] — PHASE 1 — Repository Restructure & Dead Code Removal

### Added
- `frontend/` directory — React/Vite app moved here from root
- `backend/` directory structure (api/, inference/, database/, services/, models/)
- `ml/` directory structure (datasets/, training/, evaluation/, inference/, preprocessing/, calibration/, utils/)
- `data/`, `reports/`, `notebooks/`, `monitoring/`, `configs/`, `scripts/`, `experiments/` directories
- `context.md` — AI agent context file for project continuity
- `PROJECT_TRACKER.md` — phase-by-phase progress tracker
- `ARCHITECTURE.md` — system architecture decisions and schema
- `TODO.md` — granular task list
- `CHANGELOG.md` — this file
- Root `.gitignore` for monorepo patterns

### Removed
- `frontend/src/components/ImageClassifier.jsx` — TensorFlow.js MobileNet browser classifier (not production ML)
- Broken `getReportsByUser()` function from services.js (referenced undefined `reports` variable)
- Broken `submitReport()` function from services.js (same issue)
- Commented-out `updateReportStatus()` block from services.js
- Commented-out old Tailwind v3 config from tailwind.config.js
- `snips.zip` binary artifact
- `@tensorflow/tfjs` from package.json dependencies
- `@tensorflow-models/mobilenet` from package.json dependencies
- `cloudinary` from package.json dependencies (unused)

### Changed
- `package.json` name: `"clear-view"` → `"ecoview"`
- Branding: "ClearView Earth" / "ClearView" → "EcoView" throughout frontend/src
- React app location: root → `frontend/`

### Fixed
- `useAuth.js` was a broken code fragment with no exports — replaced with proper stub

---

## [Pre-2026-05-16] — Original ClearView Earth

### Legacy Architecture (for reference)
- React/Vite single-page app at repo root
- Firebase Firestore for all data storage
- Firebase Auth (Google OAuth + email/password)
- Firebase Storage for images
- TensorFlow.js MobileNet for "ML classification" (browser-side)
- Leaflet maps for pollution visualization
- shadcn/ui component library
- 13 pages: Home, Login, Register, NGORegister, UserDashboard, AdminDashboard, Report, NGOInvite, MapView, Map, Leaderboard, About, HowToUse, Contribute
- No backend, no FastAPI, no production ML infrastructure
