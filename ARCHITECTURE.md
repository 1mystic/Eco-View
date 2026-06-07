# EcoView — System Architecture
**Last Updated:** 2026-05-16

---

## High-Level Architecture

```
Citizen/Analyst uploads image
          ↓
    React Frontend (EcoView)
          ↓
    FastAPI Inference API
          ↓
    YOLOv8m Object Detection
          ↓
    Confidence Calibration (temperature scaling)
          ↓
    Severity Estimation
          ↓
    PostgreSQL/PostGIS Storage
          ↓
    ┌──────────────────────────────┐
    │  Dashboard + Heatmaps        │
    │  Drift Monitoring            │
    │  Human Validation Queue      │
    │  Retraining Pipeline         │
    └──────────────────────────────┘
```

---

## Component Architecture

### Frontend (React/Vite)
```
frontend/
├── src/
│   ├── components/
│   │   ├── ui/              ← shadcn/ui (keep as-is)
│   │   ├── Navbar.jsx       ← EcoView branding, glassmorphism
│   │   ├── Footer.jsx
│   │   ├── InferenceCard.jsx     ← NEW Phase 7: bounding boxes + confidence
│   │   ├── GradCAMOverlay.jsx    ← NEW Phase 7: attention heatmap
│   │   ├── MLChip.jsx            ← NEW Phase 2: "ML Powered" indicator
│   │   └── PollutionMap.jsx      ← Enhanced Phase 7: cluster heatmaps
│   ├── pages/
│   │   ├── Home.jsx         ← Redesign Phase 2
│   │   ├── Report.jsx       ← Add ML inference preview Phase 7
│   │   ├── MapView.jsx      ← Add geospatial intelligence Phase 7
│   │   └── ...
│   └── utils/
│       ├── api.js           ← NEW Phase 3: FastAPI client
│       └── services.js      ← Firebase CRUD (kept for Phase 1-2)
```

### Backend (FastAPI) — Phase 3+
```
backend/
├── api/
│   ├── main.py              ← FastAPI app entry
│   ├── routes/
│   │   ├── predict.py       ← POST /predict
│   │   ├── reports.py       ← CRUD /reports
│   │   ├── maps.py          ← GET /heatmap
│   │   └── monitoring.py    ← GET /drift
│   └── middleware/
│       └── auth.py          ← JWT validation
├── inference/
│   ├── yolo_engine.py       ← YOLOv8 inference wrapper
│   ├── calibration.py       ← Temperature scaling
│   └── severity.py          ← Severity scoring algorithm
├── database/
│   ├── models.py            ← SQLAlchemy models
│   ├── schemas.py           ← Pydantic schemas
│   └── connection.py        ← PostgreSQL connection
└── services/
    ├── storage.py           ← S3/R2 image upload
    └── geospatial.py        ← PostGIS queries
```

### ML Pipeline — Phase 4-6+
```
ml/
├── datasets/
│   ├── raw/                 ← Downloaded datasets
│   ├── processed/           ← DVC-tracked YOLO format
│   └── external/            ← Roboflow exports
├── training/
│   └── train_yolo.py        ← YOLOv8 training script
├── evaluation/
│   └── evaluate.py          ← Metrics + plots
├── inference/
│   └── predict.py           ← Standalone inference script
├── calibration/
│   └── calibrate.py         ← Temperature scaling
└── preprocessing/
    └── augment.py           ← Albumentations pipeline
```

---

## Database Schema (Phase 3+)

### Table: reports
```sql
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255),
    image_url TEXT NOT NULL,
    location GEOMETRY(Point, 4326),  -- PostGIS
    latitude FLOAT,
    longitude FLOAT,
    pollution_class VARCHAR(100),
    confidence FLOAT,
    severity_score FLOAT,
    calibrated_confidence FLOAT,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW(),
    validated_at TIMESTAMP,
    validated_by VARCHAR(255)
);
```

### Table: predictions
```sql
CREATE TABLE predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID REFERENCES reports(id),
    model_version VARCHAR(50),
    raw_confidence FLOAT,
    calibrated_confidence FLOAT,
    bounding_boxes JSONB,
    inference_time_ms FLOAT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## API Contract (Phase 3+)

### POST /predict
```
Input: multipart/form-data (image file, lat, lon)
Output: {
    predictions: [{class, confidence, calibrated_confidence, bbox}],
    severity_score: float,
    annotated_image_url: string,
    model_version: string
}
```

### GET /heatmap
```
Input: ?class=garbage_dump&days=30
Output: GeoJSON FeatureCollection with severity-weighted points
```

---

## ML Model Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Model architecture | YOLOv8m | Best mAP/compute tradeoff |
| Training strategy | Transfer learning (pretrained COCO) | Faster convergence, less data needed |
| Augmentation | Albumentations (fog, rain, blur, brightness) | Pollution images are outdoor/weather-dependent |
| Export format | ONNX | Portable, fast inference, backend-agnostic |
| Calibration method | Temperature scaling | Simple, effective, standard in production |
| Starting classes | garbage_dump, plastic_waste, industrial_smoke | Limited scope = higher data quality |

---

## Migration Strategy (Firebase → PostgreSQL)

Phase 1-2: Firebase Firestore for all data (existing)
Phase 3: PostgreSQL added for predictions/ML data only
Phase 5: Reports gradually migrated to PostgreSQL
Phase 7: Full migration, Firebase used only for auth
Phase 9: Firebase Auth bridged to JWT, full PostgreSQL

This staged approach avoids breaking the existing app while building the production backend in parallel.

---

## Infrastructure (Phase 9 Target)

```
Docker Compose (local dev):
├── frontend (nginx serving React build)
├── backend (FastAPI + Uvicorn)
├── postgres (PostgreSQL 16 + PostGIS, local only)
└── redis (Upstash Redis in prod, local Redis in dev)

Cloud (free-tier optimized):
├── Database: Supabase (PostgreSQL + PostGIS + free tier)
├── Cache/Queue: Upstash Redis (free tier, serverless)
├── Object Storage: Cloudflare R2 (free tier, S3-compatible)
├── Deployment: Railway or Render (free tier)
└── (Optional) Pinecone: vector similarity search for "find similar incidents"
```

## Database Strategy: Supabase + Upstash

### Why Supabase (not plain PostgreSQL)
- Hosted PostgreSQL with PostGIS enabled → geospatial queries work out of the box
- Free tier: 500MB DB, 1GB storage, 2GB bandwidth
- Built-in Auth (can bridge or replace Firebase Auth in Phase 9)
- Real-time subscriptions (useful for live map updates)
- REST + direct PostgreSQL connection — FastAPI talks to it via SQLAlchemy

### Why Upstash Redis (not plain Redis)
- Serverless, per-request billing → free tier is genuinely free at low volume
- Used for: inference result caching, active learning job queue, rate limiting
- REST API (works without persistent connections — important for serverless deploys)

### Why NOT Pinecone (yet)
- Pinecone is a vector DB for similarity search — only relevant if we add
  "find visually similar pollution reports" feature in Phase 7+
- Not needed for core YOLOv8 detection pipeline
- Add it only if the feature is confirmed by user
