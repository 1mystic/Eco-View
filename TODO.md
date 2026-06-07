# EcoView — Task List
**Last Updated:** 2026-05-16

---

## IMMEDIATE (Phase 4 — Dataset Collection + DVC)

### Manual actions required:
- [ ] Create Roboflow account at roboflow.com
- [ ] Collect images: TACO dataset + Kaggle smoke datasets (see ml/TRAINING_PLAN.md)
- [ ] Annotate ≥400 images per class in Roboflow browser tool
- [ ] Export YOLOv8 format → `data/datasets/phase4/`
- [ ] Run `dvc init` and push to Cloudflare R2

### Agent tasks (after dataset is ready):
- [ ] Phase 5: Kaggle training notebook (see ml/TRAINING_PLAN.md)
- [ ] Phase 6: Evaluation + calibration + replace inference stub

---

## Phase 3 — Backend Setup ✅ COMPLETE

All done. To run locally:
```
cd backend && pip install -r requirements.txt
# Copy .env.example → .env and fill in credentials
uvicorn api.main:app --reload
```

---

## ✅ PHASE 2 — Frontend Redesign (COMPLETE)

### High Priority
- [x] **Redesign Home.jsx** as EcoView landing page — DONE (2026-05-16, 1199 lines, all 15 sections)
- [x] **Redesign Navbar.jsx** — DONE (2026-05-16)
- [x] **Update index.html** title + Google Fonts — DONE (2026-05-16)

### Medium Priority
- [x] Redesign About.jsx to platform-focused "About" page — DONE (2026-05-16)
- [x] Redesign HowToUse.jsx to "How It Works" with ML pipeline steps — DONE (2026-05-16)
- [x] Redesign Contribute.jsx — four contribution modes + GitHub CTA — DONE (2026-05-16)
- [x] Redesign NotFound.jsx — simple 404 with ecoview.css — DONE (2026-05-16)
- [ ] Add MLChip component (sparkle icon + Bio-Lime gradient for ML-generated insights)
- [ ] Create InferenceResult component (stub — will show bounding boxes in Phase 7)

---

## Phase 3 — Backend Setup

### Manual Actions Required From User First:
- [ ] Install Python 3.11+ 
- [ ] Install uv: `pip install uv`
- [ ] Install Docker Desktop
- [ ] Install PostgreSQL locally (or use Docker)

### Agent Tasks:
- [ ] Initialize FastAPI project: `uv venv && uv pip install fastapi uvicorn`
- [ ] Create backend/api/main.py with health check endpoint
- [ ] Create backend/database/connection.py (PostgreSQL + PostGIS)
- [ ] Create backend/database/models.py (SQLAlchemy ORM)
- [ ] Create Dockerfile for backend
- [ ] Create docker-compose.yml (backend + postgres)
- [ ] Test: `curl http://localhost:8000/health`

---

## Phase 4 — Dataset

### Manual Actions Required:
- [ ] Create Roboflow account at roboflow.com
- [ ] Download TACO dataset
- [ ] Download smoke/industrial dataset from Kaggle
- [ ] Run `dvc init` in project root
- [ ] Set up DVC remote (Google Drive or S3)

---

## Phase 5 — Training

### Manual Actions Required:
- [ ] Create W&B account at wandb.ai
- [ ] Run `wandb login` in terminal
- [ ] Confirm GPU availability (local or cloud)

---

## Bugs / Issues

- [ ] `frontend/src/utils/useAuth.js` was a broken fragment — now stubbed, needs full implementation in Phase 3
- [ ] Firebase .env variables not present — user must create frontend/.env
- [ ] `tailwind.config.js` uses v3 syntax with v4 installed — verify compatibility

---

## Done ✅ (Phases 1–3, 9)

- [x] Repository audit (2026-05-16)
- [x] Create monorepo directory structure (2026-05-16)
- [x] Move React app to /frontend (2026-05-16)
- [x] Remove TensorFlow.js / MobileNet (dead ML code) (2026-05-16)
- [x] Remove broken services.js functions (2026-05-16)
- [x] Rename branding ClearView → EcoView (2026-05-16)
- [x] Update package.json name to ecoview (2026-05-16)
- [x] Create tracker files (2026-05-16)
- [x] ecoview.css design system (1733 lines) (2026-05-16)
- [x] Navbar.jsx redesign with glassmorphism (2026-05-16)
- [x] index.html fonts + title (2026-05-16)
- [x] Home.jsx redesign — all 15 sections (2026-05-16)
- [x] About.jsx full redesign — Hero, Story, Tech Stack, Values, CTA, Footer (2026-05-16)
- [x] HowToUse.jsx full redesign — Hero, Steps, Tips, FAQ, CTA, Footer (2026-05-16)
- [x] Contribute.jsx full redesign — Hero, Stats, Ways ×4, GitHub CTA, Footer (2026-05-16)
- [x] NotFound.jsx redesign — logo, 404 number, path display, back link (2026-05-16)
- [x] FastAPI backend — routes, SQLAlchemy models, Firebase JWT auth (2026-05-16)
- [x] Cloudflare R2 service (2026-05-16)
- [x] Upstash Redis client (2026-05-16)
- [x] Inference stub classifier (2026-05-16)
- [x] frontend/src/utils/api.js — typed API client (2026-05-16)
- [x] services.js rewired from Firestore to FastAPI (2026-05-16)
- [x] Report.jsx photo upload → R2 via FastAPI (2026-05-16)
- [x] UserDashboard.jsx — rewritten with ecoview.css (2026-05-16)
- [x] AdminDashboard.jsx — rewritten with ecoview.css (2026-05-16)
- [x] Leaderboard.jsx — rewritten with ecoview.css (2026-05-16)
- [x] ecoview.css — amber/red/blue badge variants + surface tokens (2026-05-16)
- [x] backend/Dockerfile (2026-05-16)
- [x] frontend/Dockerfile (2026-05-16)
- [x] docker-compose.yml (2026-05-16)
- [x] .github/workflows/ci.yml (2026-05-16)
- [x] ml/TRAINING_PLAN.md — full Phase 4–6 model plan (2026-05-16)
