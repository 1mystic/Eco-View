# EcoView — Project Tracker
**Last Updated:** 2026-05-16

---

## Overall Status: Phase 1 Complete ✅

---

## Phase Tracker

### PHASE 1 — Repository Restructure ✅ COMPLETE
**Completed:** 2026-05-16
**What was done:**
- [x] Audited full repository structure
- [x] Created monorepo directory structure (frontend/, backend/, ml/, data/, reports/, notebooks/, monitoring/, configs/, scripts/)
- [x] Moved React/Vite app from root to /frontend
- [x] Renamed project branding: ClearView → EcoView everywhere
- [x] Removed dead code: ImageClassifier.jsx (TF.js MobileNet), broken functions in services.js, broken useAuth.js
- [x] Removed unused dependencies: cloudinary, @tensorflow/tfjs, @tensorflow-models/mobilenet
- [x] Updated package.json name to "ecoview"
- [x] Created root .gitignore for monorepo
- [x] Created tracker files: context.md, PROJECT_TRACKER.md, ARCHITECTURE.md, TODO.md, CHANGELOG.md

---

### PHASE 2 — Frontend Redesign ⏳ PENDING
**Target:** Modern ML platform UI using DESIGN.md + Land.html as source of truth

**Tasks:**
- [ ] Redesign Home page as EcoView landing page matching Land.html aesthetic
- [ ] Implement Tailwind design tokens from DESIGN.md (Bio-Lime palette, Plus Jakarta Sans, Hanken Grotesk)
- [ ] Redesign Navbar with glassmorphism + EcoView branding
- [ ] Redesign Map page with operational intelligence dashboard layout
- [ ] Add "Model Confidence" UI chip for ML predictions
- [ ] Add bounding box overlay component (for Phase 7 inference display)
- [ ] Add Grad-CAM heatmap overlay component (stub)
- [ ] Redesign About/HowToUse/Contribute pages
- [ ] Create reusable ML-focused UI components

---

### PHASE 3 — FastAPI Backend ⏳ PENDING
**Target:** Production-ready inference API and database layer

**Tasks:**
- [ ] Initialize FastAPI project in /backend
- [ ] Set up Python environment with uv
- [ ] Create /predict endpoint (image upload → YOLO inference → response)
- [ ] Set up PostgreSQL + PostGIS schema
- [ ] Create database models (reports, predictions, users, geolocations)
- [ ] Image upload pipeline (to S3/Cloudflare R2)
- [ ] JWT authentication bridge from Firebase
- [ ] Severity scoring algorithm
- [ ] Docker setup for backend

---

### PHASE 4 — Dataset Setup ⏳ PENDING
**Target:** Reproducible dataset with DVC versioning

**Manual action required from user:**
- Download TACO dataset
- Download wildfire smoke dataset from Kaggle
- Create Roboflow account for annotation

**Tasks:**
- [ ] Download TACO dataset → data/raw/taco/
- [ ] Download smoke dataset → data/raw/smoke/
- [ ] Run data cleaning script (scripts/clean_dataset.py)
- [ ] Annotate 200-300 images on Roboflow
- [ ] Export YOLO format from Roboflow → ml/datasets/processed/
- [ ] Initialize DVC: `dvc init`
- [ ] Track dataset: `dvc add ml/datasets/processed`
- [ ] Set up DVC remote (S3 or Google Drive)

---

### PHASE 5 — YOLOv8 Training ⏳ PENDING
**Tasks:**
- [ ] Create ml/training/train_yolo.py
- [ ] Set up W&B account + login
- [ ] Create dataset.yaml config
- [ ] Run baseline training (YOLOv8m, 50 epochs)
- [ ] W&B hyperparameter sweeps
- [ ] Save best model to experiments/

---

### PHASE 6 — Evaluation + Calibration ⏳ PENDING
**Tasks:**
- [ ] Build ml/evaluation/evaluate.py (mAP@50, mAP@50:95, precision, recall, F1)
- [ ] Generate confusion matrix + PR curves
- [ ] Temperature scaling calibration (netcal library)
- [ ] Grad-CAM attention maps
- [ ] Error analysis notebook (notebooks/error_analysis.ipynb)
- [ ] Save evaluation report → reports/

---

### PHASE 7 — Inference APIs + Geospatial ⏳ PENDING
**Tasks:**
- [ ] ONNX model export
- [ ] FastAPI inference endpoint with calibration
- [ ] Geospatial heatmap endpoint (Folium)
- [ ] Severity scoring API
- [ ] Frontend inference display (bounding boxes, confidence, Grad-CAM)

---

### PHASE 8 — Monitoring + Active Learning ⏳ PENDING
**Tasks:**
- [ ] Evidently AI drift monitoring setup
- [ ] Low-confidence prediction queue (< 0.55)
- [ ] Human validation UI
- [ ] Prefect retraining pipeline
- [ ] MLflow model registry

---

### PHASE 9 — Docker + CI/CD ⏳ PENDING
**Tasks:**
- [ ] Dockerfile for frontend
- [ ] Dockerfile for backend
- [ ] Docker Compose (frontend + backend + postgres)
- [ ] GitHub Actions: lint, test, Docker build
- [ ] Railway/GCP deployment

---

## Dataset Status
| Dataset | Status | Location |
|---------|--------|----------|
| TACO (waste) | Not downloaded | Pending Phase 4 |
| Smoke (Kaggle) | Not downloaded | Pending Phase 4 |
| Custom annotations | Not started | Pending Roboflow setup |

---

## Model Registry
| Version | Architecture | mAP@50 | Status |
|---------|-------------|--------|--------|
| None yet | - | - | Phase 5 pending |

---

## Deployment Status
| Service | Status | URL |
|---------|--------|-----|
| Frontend | Not deployed | - |
| Backend | Not built | - |
| Database | Not provisioned | - |

---

## Blockers
1. Firebase .env not present — user must provide VITE_FIREBASE_* keys
2. No GPU available for training yet — need to confirm local vs cloud training
3. Roboflow account not created — needed for Phase 4 annotation
