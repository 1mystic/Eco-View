# EcoView — AI Agent Context File
**Last Updated:** 2026-05-16
**Last Agent:** Claude Sonnet 4.6 (Phase 1 Restructuring Agent)

---

## Project Identity

| Field | Value |
|-------|-------|
| Project Name | EcoView |
| Former Name | ClearView Earth |
| Root Directory | `/Users/1mystic/Shared-pc/1_Work/projects/ClearView-main` |
| Goal | Production-grade environmental hazard intelligence platform |
| Phase | Phase 1 — Repository Restructure COMPLETE |

---

## What This Project Is

EcoView is being transformed from a simple civic pollution reporting app into a full **ML + MLOps + geospatial environmental intelligence platform** with:

- YOLOv8 object detection for pollution classification (waste, smoke, water contamination)
- FastAPI inference backend
- Calibrated CV inference pipeline
- Geospatial heatmaps + severity scoring
- DVC dataset versioning
- Weights & Biases experiment tracking
- MLflow model registry
- Evidently AI drift monitoring
- Active learning queue
- PostgreSQL/PostGIS database
- Docker + CI/CD deployment

The project is documented in `UPGRADE.md` (full roadmap), `DESIGN.md` (UI design system), and `Land.html` (reference UI design).

---

## Current Repository Structure (Post Phase 1)

```
ClearView-main/
├── frontend/              ← React/Vite app (moved from root)
│   ├── src/
│   │   ├── components/    ← Navbar, Footer, StatusBadge, etc.
│   │   ├── components/ui/ ← shadcn/ui component library (keep)
│   │   ├── config/        ← firebase.js (auth/db config)
│   │   ├── data/          ← biodiversityHotspots data
│   │   ├── pages/         ← Home, Login, Register, Dashboard, Map, Report, etc.
│   │   └── utils/         ← services.js (Firebase CRUD), useAuth.js
│   ├── public/
│   ├── package.json       ← name: "ecoview", TF.js removed
│   └── vite.config.js
├── backend/               ← FastAPI (Phase 3 target)
│   ├── api/
│   ├── inference/
│   ├── database/
│   ├── services/
│   └── models/
├── ml/                    ← ML pipeline (Phase 4-6 target)
│   ├── datasets/
│   ├── training/
│   ├── evaluation/
│   ├── inference/
│   ├── preprocessing/
│   ├── calibration/
│   └── utils/
├── data/                  ← Raw dataset storage (Phase 4)
├── reports/               ← Evaluation reports + plots
├── notebooks/             ← Jupyter notebooks
├── monitoring/            ← Evidently AI dashboards
├── configs/               ← Shared configuration files
├── scripts/               ← Utility scripts
├── experiments/           ← W&B/MLflow experiment artifacts
├── DESIGN.md              ← UI design system (source of truth for UI)
├── Land.html              ← Reference landing page design
├── UPGRADE.md             ← Full MLOps upgrade roadmap
├── context.md             ← THIS FILE - AI agent context
├── PROJECT_TRACKER.md     ← Phase progress tracker
├── ARCHITECTURE.md        ← System architecture decisions
├── TODO.md                ← Granular task list
└── CHANGELOG.md           ← What changed and when
```

---

## Technology Stack

### Current (What Exists)
| Layer | Tech |
|-------|------|
| Frontend | React 19 + Vite 6 + Tailwind CSS v4 |
| UI Components | shadcn/ui (radix-ui primitives) |
| Auth | Firebase Auth + Google OAuth |
| Database | Firebase Firestore |
| Storage | Firebase Storage |
| Maps | Leaflet + React-Leaflet |
| ML (old/dead) | TensorFlow.js MobileNet (REMOVED) |

### Target (What We're Building)
| Layer | Tech |
|-------|------|
| Frontend | React 19 + Vite + Tailwind (keeping, modernizing UI) |
| Backend | FastAPI + Uvicorn |
| CV Model | YOLOv8m (ultralytics) |
| ML Framework | PyTorch |
| Dataset Versioning | DVC |
| Experiment Tracking | Weights & Biases |
| Model Registry | MLflow |
| Monitoring | Evidently AI |
| Orchestration | Prefect |
| Database | Supabase (PostgreSQL + PostGIS, free tier) |
| Cache / Job Queue | Upstash Redis (serverless, free tier) |
| Object Storage | Cloudflare R2 (S3-compatible, free tier) |
| Vector Search (optional) | Pinecone (only if similarity search feature added in Phase 7+) |
| Inference Optimization | ONNX |
| Containerization | Docker + Docker Compose |
| CI/CD | GitHub Actions |

---

## Phase Progress

| Phase | Status | Description |
|-------|--------|-------------|
| Phase 1 | ✅ COMPLETE | Repo restructure, dead code removal, branding rename |
| Phase 2 | ✅ COMPLETE | Frontend redesign — ecoview.css, Navbar, Home, About, HowToUse, Contribute, NotFound all done |
| Phase 3 | ✅ COMPLETE | FastAPI backend, SQLAlchemy/Supabase, Firebase JWT auth, R2 upload, Upstash Redis, inference stub, Dockerfile |
| Phase 4 | 🔄 PARTIAL | Dataset plan in ml/TRAINING_PLAN.md; DVC init + annotation pending (manual) |
| Phase 5 | ⏳ PENDING | YOLOv8 training on Kaggle — see ml/TRAINING_PLAN.md |
| Phase 6 | ⏳ PENDING | Evaluation + calibration + Grad-CAM — see ml/TRAINING_PLAN.md |
| Phase 7 | 🔄 PARTIAL | Inference API wired (stub); frontend rewired to FastAPI |
| Phase 8 | ⏳ PENDING | Monitoring + active learning |
| Phase 9 | ✅ COMPLETE | Docker + CI/CD — docker-compose.yml + .github/workflows/ci.yml done |

---

## Key Design Decisions & Rationale

### Decision 1: Keep Firebase for Phase 1-2, migrate later
**Why:** Firebase is deeply embedded in auth, Firestore queries, and storage. Ripping it out all at once would break everything. Strategy: keep Firebase auth + Firestore running, add FastAPI as parallel backend in Phase 3, then migrate gradually.

### Decision 2: Remove TensorFlow.js MobileNet immediately
**Why:** Browser-side MobileNet is a toy. It classifies generic ImageNet classes, not pollution. It has zero production value. The real ML inference will happen in FastAPI backend with YOLOv8.

### Decision 3: Monorepo structure (frontend/ + backend/ + ml/ at same root)
**Why:** Single repo makes it easier to share configs, track related changes together, and simplifies Docker Compose setup. Not a true monorepo with shared packages — just organized folders.

### Decision 4: YOLOv8m as the detection model (not YOLOv8n or YOLOv8l)
**Why:** YOLOv8n is too weak for real detection. YOLOv8l requires significant compute. YOLOv8m provides the best accuracy/compute balance for a portfolio project with limited GPU.

### Decision 5: Start with 3 pollution classes only
**Classes:** garbage_dump, plastic_waste, industrial_smoke
**Why:** Starting with fewer classes forces data quality discipline. Add more after baseline pipeline is stable.

### Decision 6: Use pnpm for frontend package management
**Why:** Switched from npm to pnpm for faster installs, strict dependency isolation (no phantom deps), and better security. `pnpm.onlyBuiltDependencies` in package.json whitelists esbuild, protobufjs, @firebase/util for native build scripts. Delete pnpm-lock.yaml and reinstall if build-script errors reappear.

### Decision 7: YOLOv8 training on Kaggle, not locally
**Why:** No local GPU. Training happens in Kaggle notebooks (free T4 GPU). Trained weights (.pt → ONNX) are downloaded and either committed to ml/models/ or pulled via DVC from Cloudflare R2. README.md will link to the Kaggle notebook + dataset. This keeps the repo lightweight and reproducible.

---

## Branding

- **App Name:** EcoView
- **Tagline:** Environmental Hazard Intelligence Platform
- **Former names to avoid:** ClearView, ClearView Earth, EcoPulse AI
- **Design system:** See DESIGN.md — "Lumina Terra" theme, Bio-Lime primary (#446900 / #a3e635)
- **Typography:** Plus Jakarta Sans (headlines) + Hanken Grotesk (body)

---

## Firebase Configuration

Firebase is configured in `frontend/src/config/firebase.js` via environment variables:
```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
```

These are loaded from `.env` file (NOT committed to git).

---

## Current Pages & Routes (Frontend)

| Route | Component | Status |
|-------|-----------|--------|
| / | Home.jsx | Keep, redesign in Phase 2 |
| /login | Login.jsx | Keep, minor updates |
| /register | Register.jsx | Keep |
| /ngo-register | NGORegister.jsx | Keep |
| /user-dashboard/:id | UserDashboard.jsx | Keep, enhance |
| /admin | AdminDashboard.jsx | Keep, enhance |
| /report | Report.jsx | Keep, add ML inference preview |
| /ngo-invite | NGOInvite.jsx | Keep |
| /map-view | MapView.jsx | Enhance with heatmaps in Phase 7 |
| /leaderboard | Leaderboard.jsx | Keep |
| /about | About.jsx | Redesign in Phase 2 |
| /how-to-use | HowToUse.jsx | Redesign in Phase 2 |
| /contribute | Contribute.jsx | Redesign in Phase 2 |

---

## Pollution Classification Taxonomy

```
pollution
├── waste
│   ├── garbage_dump      ← Phase 4-5 (first batch)
│   ├── plastic_waste     ← Phase 4-5 (first batch)
│   └── landfill
├── air
│   ├── industrial_smoke  ← Phase 4-5 (first batch)
│   └── open_burning
└── water
    ├── contaminated_water
    └── oil_spill
```

---

## Data Sources to Collect (Phase 4)

- TACO Dataset (trash/waste)
- TrashCan Dataset
- OpenLitterMap
- Wildfire smoke Kaggle datasets
- Industrial smoke datasets

---

## How to Run (Current State - Phase 1)

```bash
cd frontend
npm install
npm run dev
```

Requires Firebase .env file with the VITE_FIREBASE_* variables.

---

## Known Issues / Blockers

1. Firebase .env file not present in repo (user must provide)
2. TF.js packages removed from package.json — run `npm install` after this change
3. `useAuth.js` was a broken fragment — replaced with a stub
4. `services.js` had broken `getReportsByUser` / `submitReport` functions (removed)
5. No backend exists yet — Phase 3 will build it

---

## AGENT SIGNATURE LOG

| Date | Agent | Action |
|------|-------|--------|
| 2026-05-16 | Claude Sonnet 4.6 (Phase 1) | Repository audit, restructure, dead code removal, branding rename, DB stack decision (Supabase + Upstash + R2) |
| 2026-05-16 | Claude Sonnet 4.6 (Phase 2) | Created ecoview.css (1733 lines, full design system), redesigned Navbar.jsx, updated index.html with fonts. Home.jsx NOT YET DONE — next agent must build it. |
| 2026-05-16 | Claude Sonnet 4.6 (Phase 2b) | Home.jsx complete (1199 lines, all 15 sections). Updated context.md + TODO.md. Package manager migration to pnpm recommended (user confirmed). |
| 2026-05-16 | Claude Sonnet 4.6 (Phase 2c) | Phase 2 complete. About.jsx, HowToUse.jsx, Contribute.jsx, NotFound.jsx all redesigned with ecoview.css, self-contained nav/footer, correct CSS classes (verified against ecoview.css). Updated context.md + TODO.md. |
| 2026-05-16 | Claude Sonnet 4.6 (Phase 3/7/9) | Phase 3 complete: FastAPI backend (routes, SQLAlchemy models, Firebase JWT auth, R2, Redis, inference stub, Dockerfile). Frontend rewired: services.js → FastAPI via api.js; UserDashboard, AdminDashboard, Leaderboard rewritten in ecoview.css; Report.jsx photo upload → R2. Docker + GitHub Actions CI complete. ecoview.css extended with amber/red/blue badge variants + surface tokens. ML training plan written at ml/TRAINING_PLAN.md (Phase 4–6 roadmap). |
