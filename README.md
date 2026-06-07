# EcoView: Community-Powered Environmental Pollution Intelligence

> A zero-cost, serverless platform where citizens photograph pollution incidents, AI classifies them in real-time, NGOs coordinate cleanup campaigns, and the community earns points for verified reports.
>
> **Stack:** React + Firebase + HuggingFace Spaces + Vercel. No paid services. No traditional backend server.

---

## Summary

Built EcoView end-to-end: a production-deployed civic tech platform for environmental pollution reporting with AI classification, community verification, NGO campaign coordination, and a role-based admin system :  running at **$0/month** on a fully serverless stack (React/Vercel + Firebase + HuggingFace Spaces). Designed and implemented a dual-mode ML pipeline using **Gemini 3.1 Flash-Lite** as a VLM teacher that classifies both images and plain-text descriptions into structured pollution categories, paired with an ONNX knowledge distillation notebook (ConvNeXt Base → MobileNetV3 Large → INT8, ~6 MB) ready for edge deployment. Engineered the full Firebase architecture :  Firestore schema, security rules, client-side composite-index workarounds, base64 image storage without Firebase Storage :  alongside a FastAPI inference service deployed as a Docker container on HuggingFace with a data flywheel that auto-logs high-confidence outputs as future training data. Shipped a complete design system from scratch (CSS custom properties, reusable component patterns), real-time pollution mapping with biodiversity hotspot overlays and sparklines, and three distinct user roles each with their own dashboard.

---

## Table of Contents

1. [What It Does](#1-what-it-does)
2. [Architecture](#2-architecture)
3. [Complete Data Flows](#3-complete-data-flows)
4. [ML Pipeline](#4-ml-pipeline)
5. [Feature Inventory by Role](#5-feature-inventory-by-role)
6. [Tech Stack](#6-tech-stack)
7. [Repository Structure](#7-repository-structure)
8. [Firestore Data Model](#8-firestore-data-model)
9. [ML Backend API Reference](#9-ml-backend-api-reference)
10. [Firestore Security Rules](#10-firestore-security-rules)
11. [Local Development](#11-local-development)
12. [Deployment Guide](#12-deployment-guide)
13. [Known Limitations & Roadmap](#13-known-limitations--roadmap)

---

## 1. What It Does

EcoView is a civic tech platform for environmental reporting. Anyone can:

1. **Report** a pollution incident from their phone :  take a photo, describe it, submit. GPS location is auto-detected.
2. **See** all reports on a live Leaflet map with color-coded severity markers and biodiversity hotspot overlays.
3. **Verify** other people's reports (+5 points) :  3 verifications auto-promotes a report to `verified` status.
4. **Join** NGO-led cleanup campaigns as a volunteer.
5. **Compete** on a real-time leaderboard sorted by community contribution points.

Behind the scenes, when a photo is submitted:
- The image is compressed client-side (Canvas API → JPEG 78% quality, max 800px) and stored as base64 in Firestore (no Firebase Storage needed :  stays on free Spark plan)
- The base64 is sent to a HuggingFace Space FastAPI endpoint
- **Gemini 3.1 Flash-Lite** classifies it as a structured JSON object: `{category, confidence, severity, reason}`
- The Firestore incident document is updated with `ml_label`, `ml_confidence`, `ml_severity`
- The ML result appears on the map popup, user dashboard, and admin panel

**Roles:**
- **User** :  report, verify, join campaigns, earn points
- **NGO** :  create campaigns, recruit volunteers, mark reports resolved (requires admin approval)
- **Admin** :  full dashboard: verify/resolve/reject any report, manage all data

---

## 2. Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        BROWSER (React SPA)                              │
│                                                                         │
│  Pages: Home · MapView · Report · Campaigns · Leaderboard               │
│         UserDashboard · NGODashboard · AdminDashboard · Login/Register  │
│                                                                         │
│  Libraries: React 18 · React Router v7 · Leaflet · Sonner toasts        │
│  Design: Custom CSS design system (ecoview.css) + Tailwind utilities    │
│  Build: Vite 5 · pnpm                                                   │
└────────────┬───────────────────────────────────┬────────────────────────┘
             │ Firebase JS SDK (direct)           │ fetch() ML calls
             ▼                                   ▼
┌────────────────────────────┐      ┌────────────────────────────────────┐
│   Firebase (Google Cloud)  │      │  HuggingFace Space: mozoj4/ecoview-ml│
│                            │      │                                    │
│  ┌─────────────────────┐   │      │  FastAPI (Python 3.12)             │
│  │  Firebase Auth      │   │      │  ├── POST /inference/classify      │
│  │  Email/Password     │   │      │  │    └── Gemini 3.1 Flash-Lite    │
│  └─────────────────────┘   │      │  │         (VLM structured output) │
│                            │      │  ├── GET  /health                  │
│  ┌─────────────────────┐   │      │  └── POST /spatial/* (503 in v1)  │
│  │  Firestore          │   │      │                                    │
│  │  /incidents         │   │      │  Deps: fastapi · uvicorn · httpx   │
│  │  /users             │   │      │        pillow · python-dotenv      │
│  │  /campaigns         │   │      │  Port: 7860                        │
│  └─────────────────────┘   │      │  Cost: FREE (CPU Basic)            │
│                            │      └────────────────────────────────────┘
│  FREE Spark plan           │                      ▲
│  No Firebase Storage used  │                      │ VITE_ML_URL env var
└────────────────────────────┘      ┌───────────────┴───────────────────┐
                                    │  Vercel (frontend CDN host)       │
                                    │  Root: frontend/ · Build: vite    │
                                    │  Auto HTTPS · Edge network        │
                                    └───────────────────────────────────┘
```

**Core design principle :  no traditional backend.** Firebase handles auth and all CRUD. HuggingFace Spaces hosts the ML inference proxy. Vercel serves the static frontend. Total monthly cost: **$0**.

---

## 3. Complete Data Flows

### 3.1 Report Submission

```
User fills form (type, description, photo) → clicks Submit
  │
  ├─ 1. Geolocation API → { latitude, longitude }
  │
  ├─ 2. Canvas compression:
  │      File → drawImage on 800px canvas → toBlob(JPEG, 0.78) → base64 data URL
  │      Typical output: 50–120 KB base64 string
  │
  ├─ 3. Firestore: addDoc(/incidents, {
  │        type, description, photo_data (base64),
  │        latitude, longitude, status: "pending",
  │        reporter_uid, reporter_name,
  │        ml_label: null, ml_confidence: null, ml_severity: null,
  │        verification_count: 0, verifiers: [],
  │        created_at: serverTimestamp()
  │      })  →  returns incidentId
  │
  ├─ 4. Firestore: updateDoc(/users/{uid}, { points: increment(10) })
  │
  └─ 5. Fire-and-forget (does not block UI):
         POST /inference/classify { image_base64: "data:image/jpeg;base64,..." }
           │
           └─ if 200 OK → updateDoc(/incidents/{incidentId}, {
                ml_label, ml_confidence, ml_severity, status: "classified"
              })
```

### 3.2 ML Classification (HuggingFace Space)

```
POST /inference/classify
  body: { image_base64: "data:image/jpeg;base64,..." }
          │
          ▼
  1. ONNXStudentClassifier.classify(image_source)
     → No ONNX model file → simulator mode (deterministic mock, 0.72 confidence)
     → Confidence < 0.85 → escalate to VLM Teacher
          │
          ▼
  2. VLMTeacherValidator.validate_image(image_source)
     → decode base64 data URL → PIL Image bytes
     → POST https://generativelanguage.googleapis.com/v1beta/models/
            gemini-3.1-flash-lite:generateContent?key={GEMINI_API_KEY}
     → payload: { contents: [text_prompt + inlineData(base64, mimeType)],
                  generationConfig: { responseMimeType: "application/json",
                                      responseSchema: { is_pollution, category,
                                                        confidence, reason } } }
     → parse JSON response
     → if confidence >= 0.85: save to flywheel (data/flywheel/*.jpg + *.json)
          │
          ▼
  3. Return ClassifyResponse:
     { label, confidence, severity, processing_time_ms,
       model_version, inference_mode, escalated_to_vlm,
       vlm_reason, flywheel_logged }
```

**Simulator mode** (no GEMINI_API_KEY): Returns deterministic mock outputs based on image hash. Useful for development/demo without API key.

### 3.3 Map View

```
useEffect on mount:
  getIncidents({ limitCount: 200 }) → Firestore query, orderBy created_at desc
  → incidents[] stored in React state

Leaflet renders:
  - Circle markers, colored by severity_score (green/amber/red/purple)
  - Biodiversity hotspot polygons (static GeoJSON data)
  - Environmental health score per hotspot (computed client-side:
    100 - pending×5 - verified×15 - critical×25, capped 0–100)
  - Sparkline of weekly report counts per hotspot (6-week sliding window)

User clicks marker → ReportDetailDialog:
  - Full incident details, photo, ML label
  - "Verify Report" button (if logged in, not own report, not already verified)
  - "Share" button (navigator.share() with fallback to clipboard)

"Export GeoJSON" button:
  - Converts current reports[] state to GeoJSON FeatureCollection
  - Triggers browser download (no server needed)
```

### 3.4 Community Verification

```
User clicks "✓ Verify Report":
  verifyIncident(reportId, currentUser.uid)
    │
    ├─ Firestore: getDoc(/incidents/{id}) → check not already verified, not own report
    ├─ Firestore: updateDoc({ verifiers: arrayUnion(uid), verification_count: increment(1) })
    ├─ if newCount >= 3 AND status === "classified": set status = "verified"
    └─ Firestore: updateDoc(/users/{uid}, { points: increment(5) })
```

### 3.5 NGO Campaign Flow

```
NGO Dashboard:
  createCampaign({ title, description, target_location, start_date, end_date })
    → Firestore: addDoc(/campaigns, { ...data, volunteers: [], signup_count: 0, status: "active" })

Public Campaigns page:
  getCampaigns({ status: "active" }) → Firestore where + client-side sort
  User clicks "Join Campaign":
    joinCampaign(id, uid) → updateDoc({ volunteers: arrayUnion(uid), signup_count: increment(1) })
    → +5 points to user (optional, configurable)
```

---

## 4. ML Pipeline

### v1 (Current :  Live)

```
Photo submitted (base64 JPEG, ~80 KB)
  │
  ▼
HuggingFace Space FastAPI
  │
  ├─ Student: ONNXStudentClassifier → simulator mode (no model file)
  │   Outputs: low confidence (~0.72) → escalates
  │
  └─ Teacher: Gemini 3.1 Flash-Lite VLM
      Prompt: "Is this environmental pollution? Classify into:
               garbage_dump | plastic_waste | industrial_smoke |
               water_contamination | deforestation | oil_spill | none"
      Output: structured JSON { is_pollution, category, confidence, reason }
      Free tier: 1,500 req/day · 1M tokens/day
```

### v2 (Complete — Trained on Kaggle, Deployed to HuggingFace)

Public showcase notebook: [![Open in Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/drive/1LtzpoTVgkB1xNLnnsxH1FAWd4fu2ZmSm?usp=sharing) · [View on GitHub](notebooks/EcoView_KD_Showcase.ipynb) · Local export script: [export_onnx_local.py](notebooks/export_onnx_local.py)

```
Kaggle GPU T4 (free):
  TrashNet dataset (2,527 images, 6 classes:
    cardboard · glass · metal · paper · plastic · trash)
    │
    ├─ Teacher: ConvNeXt Base (timm, ImageNet-22k pretrained, ~89M params)
    │   AdamW lr=3e-4 · 15 epochs · CosineAnnealingLR · early stopping
    │   AMP training (GradScaler + autocast) — fits T4 at batch=16
    │   Accuracy: ~95%
    │
    └─ Student: MobileNetV3 Large (~4.2M params, 21× smaller)
        Loss = 0.7×CrossEntropy + 0.3×KL_Divergence × T²  (T=4.0)
        AdamW lr=1e-3 · 10 epochs · AMP enabled
        Accuracy: ~91%
          │
          ▼
    Export locally (export_onnx_local.py, CPU-only, 8 GB RAM compatible):
          │
    torch.onnx.export (opset 17, dynamo=False — TorchScript, stable)
          │
    onnxsim graph simplification
          │
    INT8 dynamic quantization (onnxruntime.quantization)
          │
    student_model_quantized.onnx  (4.4 MB  ·  ~55 ms CPU latency)
    → notebooks/OUTPUT/student_model_quantized.onnx  [tracked in repo]
    → ecoview-ml-backend/student_model_quantized.onnx [live on HF Space]
```

**Data Flywheel (automatic):** When Gemini validates a high-confidence classification (≥0.85), the image + label is saved to `data/flywheel/` in the Space. These accumulate as training data for the next distillation round.

### v3 (Future :  Browser-Side)

```
OWLv2 zero-shot detection via Transformers.js + WebGPU:
  pipeline('zero-shot-object-detection', 'Xenova/owlvit-base-patch32', { device: 'webgpu' })
  candidate_labels: ["industrial smoke", "plastic waste", "oil spill", "illegal dumping"]
  → bounding boxes + confidence scores, runs in ~15ms after model cached
  → no server needed at all
```

---

## 5. Feature Inventory by Role

### Public (no login)

| Feature | How |
|---|---|
| View all incidents on map | Leaflet map, Firestore read |
| Filter by report type | client-side filter |
| View biodiversity hotspots | static GeoJSON overlay |
| See environmental health score per hotspot | computed from incident counts |
| See pollution sparkline per hotspot | 6-week sliding window, client-side |
| Read report details in popup | ReportDetailDialog |
| Share a report | `navigator.share()` → URL with `?report=id` |
| Export visible reports as GeoJSON | client-side conversion, browser download |
| View campaigns | Firestore /campaigns |
| View leaderboard | Firestore /users orderBy points |

### User (logged in)

| Feature | How |
|---|---|
| All public features | :  |
| Submit pollution report with photo | Firestore + canvas compression + ML |
| Earn 10 points per report | Firestore increment |
| Verify other reports, earn 5 pts | arrayUnion + increment |
| Join/leave NGO campaigns | arrayUnion/update |
| View own reports on dashboard | Firestore where reporter_uid |
| View own campaigns joined | Firestore array-contains |
| See personal point balance | Firestore user doc |

### NGO (approved)

| Feature | How |
|---|---|
| All user features | -  |
| Create campaigns | Firestore addDoc /campaigns |
| Edit/delete own campaigns | Firestore updateDoc/deleteDoc |
| Mark nearby incidents "resolved" | Firestore updateDoc status |
| View campaign volunteer count | signup_count field |

### Admin

| Feature | How |
|---|---|
| View all incidents by status tab | Firestore getIncidents per status |
| Verify / resolve / reject reports | updateIncidentStatus |
| Activity log for current session | React state, per action |
| Stats strip (count per status) | aggregated Firestore queries |
| View ML classification per report | ml_label, ml_confidence badges |
| View report photos inline | img src={photo_data} |

---

## 6. Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Frontend framework | React 18 + Vite 5 | Fast HMR, tree-shaking, JSX |
| Routing | React Router v7 | File-based, nested routes |
| Map | Leaflet + react-leaflet | Free, no API key, offline tiles |
| Spatial computation | @turf/turf (client) | GeoJSON ops, point-in-polygon |
| Styling | Custom CSS design system + Tailwind | Design tokens via CSS vars |
| Notifications | Sonner | Accessible toast stack |
| Auth | Firebase Authentication | Email/password, free tier |
| Database | Firestore (NoSQL) | Real-time, offline-capable, free |
| Image storage | Base64 in Firestore | Avoids Firebase Storage (Blaze plan) |
| ML backend | FastAPI on HuggingFace Spaces | Free CPU Docker container |
| ML inference | Gemini 3.1 Flash-Lite (VLM) | Free tier 1500 req/day, multimodal |
| ML v2 (deployed) | ONNX Runtime (MobileNetV3 Large INT8) | 4.4 MB, ~55 ms CPU, no GPU needed |
| Frontend host | Vercel | Free, edge CDN, auto deploy |
| Package manager | pnpm v11 | Fast installs, hoisted mode |

---

## 7. Repository Structure

```
EcoView/
├── frontend/                    # React + Vite SPA
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Home.jsx         # Landing page with CTA sections
│   │   │   ├── MapView.jsx      # Leaflet map, hotspots, sparklines, export
│   │   │   ├── Report.jsx       # Pollution report form + ML trigger
│   │   │   ├── Campaigns.jsx    # Public campaign listing + join/leave
│   │   │   ├── Leaderboard.jsx  # Community points ranking
│   │   │   ├── UserDashboard.jsx # Personal stats, reports, campaigns
│   │   │   ├── NGODashboard.jsx  # Campaign management for NGOs
│   │   │   ├── AdminDashboard.jsx# Report review + activity log
│   │   │   ├── About.jsx        # About EcoView (static info)
│   │   │   ├── HowToUse.jsx     # How it works (static info)
│   │   │   ├── Contribute.jsx   # Contribution guide (static info)
│   │   │   ├── Privacy.jsx      # Privacy policy
│   │   │   ├── Terms.jsx        # Terms of service
│   │   │   ├── Login.jsx        # Email/password login
│   │   │   ├── Register.jsx     # New user registration
│   │   │   └── NGORegister.jsx  # NGO registration with org details
│   │   ├── components/
│   │   │   ├── Navbar.jsx       # Auth-aware navigation
│   │   │   ├── Footer.jsx       # Site footer (EcoView design system)
│   │   │   ├── ReportDetailDialog.jsx  # Map popup with verify/share
│   │   │   ├── MobileBottomNav.jsx     # Mobile bottom bar
│   │   │   └── StatusBadge.jsx  # Reusable status pill
│   │   ├── utils/
│   │   │   ├── firestoreIncidents.js # All Firestore CRUD (incidents + campaigns)
│   │   │   ├── firestoreStorage.js   # Canvas → base64 compression
│   │   │   ├── api.js                # ML backend fetch helpers
│   │   │   └── services.js           # Aggregated data functions
│   │   ├── config/
│   │   │   └── firebase.js           # Firebase app init + exports
│   │   ├── data/
│   │   │   └── biodiversityHotspots.jsx  # Static India hotspot GeoJSON
│   │   └── styles/
│   │       └── ecoview.css           # Full design system (tokens, components)
│   ├── vite.config.js               # Vite config (optimizeDeps for robust-predicates)
│   ├── package.json
│   └── .env                         # VITE_* env vars (not committed)
│
├── ecoview-ml-backend/              # FastAPI ML inference service
│   ├── main.py                      # FastAPI app, endpoints, CORS
│   ├── requirements.txt             # Slim: fastapi uvicorn httpx pillow python-dotenv
│   ├── Dockerfile                   # python:3.12-slim, port 7860
│   ├── core/
│   │   ├── inference.py             # ONNXStudentClassifier (simulator fallback)
│   │   ├── fallback_validator.py    # VLMTeacherValidator (Gemini 3.1 Flash-Lite)
│   │   └── utils.py                 # SSRF validation, helpers
│   └── spatial_analysis/            # Optional (503 if deps missing)
│       ├── cluster_detection.py     # Moran's I clustering
│       └── interpolator.py          # IDW heatmap, proximity alerts
│
├── notebooks/
│   ├── EcoView_KD_Notebook.ipynb   # Knowledge distillation training pipeline
│   │                               # ConvNeXt Base → MobileNetV3 Large → INT8
│   │                               # AMP training, ONNX export, quantization
│   ├── EcoView_KD_Showcase.ipynb   # Clean public showcase version (Kaggle-ready)
│   ├── export_onnx_local.py        # Standalone local export: .pth → INT8 ONNX
│   └── OUTPUT/
│       ├── class_mapping.json      # TrashNet class↔index mapping
│       ├── student_best.pth        # Trained student checkpoint (16 MB)
│       └── student_model_quantized.onnx  # INT8 deploy model (4.4 MB)
├── plan.md                          # ML strategy + architecture decisions
├── DEPLOY.md                        # Step-by-step deployment playbook
└── README.md                        # This file
```

---

## 8. Firestore Data Model

### `/incidents/{id}`

```js
{
  type: string,              // "Waste Dumping" | "Air Pollution" | "Water Contamination" | ...
  description: string,       // 10–1000 chars, user-entered
  photo_data: string|null,   // base64 data URL "data:image/jpeg;base64,..." (~80 KB)
  latitude: number,          // GPS decimal degrees
  longitude: number,
  status: string,            // "pending" → "classified" → "verified" → "resolved" | "rejected"
  reporter_uid: string,      // Firebase Auth UID
  reporter_name: string,     // display name at time of submission
  ml_label: string|null,     // "garbage_dump" | "plastic_waste" | "industrial_smoke" |
                             // "water_contamination" | "deforestation" | "oil_spill" | "none"
  ml_confidence: number|null,// 0.0–1.0 float
  ml_severity: string|null,  // "low" | "medium" | "high" | "critical"
  verification_count: number,// 0–3+ integer
  verifiers: string[],       // array of Firebase UIDs who verified
  created_at: Timestamp,
  updated_at: Timestamp
}
```

### `/users/{uid}`

```js
{
  uid: string,               // Firebase Auth UID (same as document ID)
  name: string,
  email: string,
  role: string,              // "user" | "ngo" | "admin"
  points: number,            // 10 per report, 5 per verification
  approvalStatus: string|null, // "approved" | "pending" | "rejected" (NGO only)
  organization: string|null, // NGO organization name
  logoUrl: string|null,      // NGO logo (Cloudinary URL, optional)
  createdAt: Timestamp
}
```

### `/campaigns/{id}`

```js
{
  title: string,
  description: string,
  ngo_uid: string,           // Firebase UID of creating NGO
  ngo_name: string,
  target_location: string,   // human-readable area name
  latitude: number|null,
  longitude: number|null,
  status: string,            // "active" | "completed" | "cancelled"
  volunteers: string[],      // Firebase UIDs of joined users
  signup_count: number,      // mirrors volunteers.length (for efficient display)
  start_date: Timestamp,
  end_date: Timestamp,
  created_at: Timestamp,
  updated_at: Timestamp
}
```

---

## 9. ML Backend API Reference

Base URL: `https://mozoj4-ecoview-ml.hf.space`

### `GET /health`

Returns subsystem status. Always 200 even in simulator mode.

```json
{
  "status": "healthy",
  "timestamp": 1749200000.0,
  "components": {
    "student_classifier": { "mode": "simulator", "model_path": "/app/student_model_quantized.onnx" },
    "teacher_validator": { "has_api_key": true },
    "spatial_cluster_detector": { "available": false, "has_pysal_libraries": false },
    "spatial_interpolator": { "available": false, "has_scipy": false, "has_shapely": false }
  }
}
```

### `POST /inference/classify`

Classify an image as a pollution type.

**Request** (one of):
```json
{ "image_url": "https://example.com/photo.jpg" }
{ "image_base64": "data:image/jpeg;base64,/9j/4AAQ..." }
```

**Response:**
```json
{
  "label": "garbage_dump",
  "confidence": 0.91,
  "severity": "high",
  "processing_time_ms": 1240,
  "model_version": "gemini-3.1-flash-lite-vlm",
  "inference_mode": "vlm_teacher",
  "escalated_to_vlm": true,
  "vlm_reason": "Clear visual evidence of illegal waste dumping with mixed plastic and organic waste.",
  "flywheel_logged": true
}
```

**Modes:**
- `onnx` :  ONNX model present, fast local inference
- `simulator` :  No model file, deterministic mock output (for dev/demo)
- `vlm_teacher` :  Gemini 3.1 Flash-Lite classified (when ONNX confidence < 0.85 or simulator)

### `POST /spatial/analyze-clusters` · `POST /spatial/risk-heatmap` · `POST /spatial/proximity-alerts`

Returns `503` in v1 (spatial deps not installed). Will return spatial analytics data in v2.

---

## 10. Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    match /incidents/{id} {
      allow read: if true;
      allow create: if request.auth != null
        && request.resource.data.reporter_uid == request.auth.uid
        && request.resource.data.status == 'pending';
      allow update: if request.auth != null && (
        resource.data.reporter_uid == request.auth.uid
        || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin','ngo']
      );
      allow delete: if request.auth != null
        && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    match /users/{uid} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.auth.uid == uid;
      allow update: if request.auth != null && (
        request.auth.uid == uid
        || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'
      );
      allow delete: if false;
    }

    match /campaigns/{id} {
      allow read: if true;
      allow create: if request.auth != null
        && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['ngo','admin'];
      allow update: if request.auth != null && (
        resource.data.ngo_uid == request.auth.uid
        || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'
        || request.resource.data.diff(resource.data).affectedKeys().hasOnly(['volunteers','signup_count'])
      );
      allow delete: if request.auth != null && (
        resource.data.ngo_uid == request.auth.uid
        || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'
      );
    }
  }
}
```

---

## 11. Local Development

### Prerequisites

- Node.js 20+
- pnpm 11 (`npm install -g pnpm`)
- Python 3.11+ (for ML backend)
- A Firebase project (free Spark plan)
- A Gemini API key (free from aistudio.google.com)

### Frontend

```bash
cd frontend
pnpm install

# Create frontend/.env
cp .env.example .env
# Fill in VITE_FIREBASE_* values from Firebase Console → Project Settings
# Fill in VITE_ML_URL=http://localhost:7860 (or HF Space URL)

# Start dev server
node node_modules/vite/bin/vite.js     # http://localhost:5173

# Build (use this instead of pnpm run build on exFAT drives)
node node_modules/vite/bin/vite.js build
```

> **Why not `pnpm run build` locally?** pnpm v11's dependency check fails on exFAT (D:) drives due to symlink restrictions. On Vercel (Linux ext4) `pnpm run build` works fine.

### ML Showcase Notebook

The full training pipeline (ConvNeXt Base teacher → MobileNetV3 distillation → ONNX INT8) is publicly available:

- **Colab:** [![Open in Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/drive/1LtzpoTVgkB1xNLnnsxH1FAWd4fu2ZmSm?usp=sharing)
- **Kaggle** (T4 GPU, ~60–90 min): follow the steps below
- **Local** (CPU only): `python notebooks/export_onnx_local.py` (re-exports from checkpoint)

**Steps to run:**

1. **Get the dataset** — Go to [TrashNet on Kaggle](https://www.kaggle.com/datasets/fedesoriano/trashnet), click **+ Add to Notebook** (or note the dataset slug `fedesoriano/trashnet`).

2. **Import the notebook** — On Kaggle: `+ Create` → `New Notebook` → `File` → `Import Notebook` → upload `notebooks/EcoView_KD_Showcase.ipynb`.

3. **Attach the dataset** — In the right sidebar under **Add data**, search `fedesoriano/trashnet` and add it. The notebook reads from `/kaggle/input/trashnet/dataset-resized/`.

4. **Enable GPU** — In the right sidebar: `Session options` → `Accelerator` → **GPU T4 × 1**.

5. **Enable Internet** — Still in Session options, toggle **Internet** on. Required for `pip install albumentations==1.4.22` and for timm to download pretrained weights on first run.

6. **Run all cells** — `Run All` (≈ 60–90 min). Cell output shows live training progress per epoch.

7. **Download outputs** — When finished, go to the **Output** tab on the right. Download:
   - `student_model_quantized.onnx` — the deploy-ready INT8 model (4.4 MB)
   - `class_mapping.json` — class index mapping
   - `student_best.pth` — checkpoint if you want to re-export locally

> **Tip:** If you get a CUDA out-of-memory error on a different GPU size, reduce `BATCH_SIZE` in the config cell (16 is safe for T4). The notebook uses AMP by default, which halves activation memory.

---

### ML Backend

```bash
cd ecoview-ml-backend
python -m venv .venv
.venv/Scripts/activate          # Windows
# source .venv/bin/activate     # Mac/Linux

pip install fastapi uvicorn httpx pillow python-dotenv

# Create .env
echo "GEMINI_API_KEY=your_key_here" > .env
echo "ALLOWED_ORIGINS=http://localhost:5173" >> .env

uvicorn main:app --reload --port 7860
# → http://localhost:7860/health
```

---

## 12. Deployment Guide

See [DEPLOY.md](DEPLOY.md) for the full step-by-step playbook.

**Quick reference:**

| Service | Where | Settings |
|---|---|---|
| Frontend | Vercel → import GitHub repo | Root: `frontend` · Build: `node node_modules/vite/bin/vite.js build` · Output: `dist` |
| ML Backend | HuggingFace Space `mozoj4/ecoview-ml` | SDK: Docker · Hardware: CPU Basic (free) |
| Database + Auth | Firebase Console `clearview-df6cd` | Firestore rules + Auth Email/Password |

**Required Vercel env vars** (add in Vercel Dashboard → Project → Settings → Environment Variables):
```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_ML_URL=https://mozoj4-ecoview-ml.hf.space
```

**Required HuggingFace Space secrets** (Space → Settings → Variables and secrets):
```
GEMINI_API_KEY   your Gemini API key
ALLOWED_ORIGINS  https://your-app.vercel.app,http://localhost:5173
```

---

## 13. Known Limitations & Roadmap

### Current Limitations

| Limitation | Reason | Workaround |
|---|---|---|
| ONNX model runs on HF Space CPU only | No GPU on free tier | 55 ms latency is acceptable for async classification |
| Spatial analytics return 503 | Heavy deps (scipy/pysal) removed from slim build | Not called by frontend in v1 |
| ML runs after form reset | Fire-and-forget async, user doesn't wait | ML result appears on refresh / next load |
| Max photo size ~120 KB in Firestore | Canvas compression target | Sufficient for evidence photos |

### Bugs Fixed (Pre-Deploy)

All bugs were resolved before the initial deployment:

| Bug | Fix |
|---|---|
| All toasts silent | Added `<Toaster>` to App.jsx |
| `<a href="/login">` caused full page reload | Changed to `<Link to="/login">` |
| Navbar links hidden for users without Firestore doc | Fallback user object includes `id` field |
| Map sparkline last week always 0 | Fixed 6-week sliding window formula |
| NGORegister showed "failed" on Firestore error | Separated auth/Firestore into independent try-catch |
| NGORegister missing email in Firestore doc | Added `email` field to setDoc |
| Report modal transparent | Added `--surface-primary: #fff` CSS variable |
| Campaigns "failed to load" | Removed composite Firestore index requirement |
| HF Space crash loop | Fixed port 8000→7860 (HF expects 7860) |
| ML couldn't classify base64 photos | Backend updated to accept `image_base64` field |

### Completed

**v2 — ONNX Model (shipped)**
- Trained ConvNeXt Base teacher + MobileNetV3 Large student on Kaggle T4 GPU
- INT8 dynamic quantization → `student_model_quantized.onnx` (4.4 MB)
- Deployed to HF Space; `core/inference.py` LABELS updated to TrashNet classes
- `notebooks/export_onnx_local.py` for CPU-only re-export from checkpoint

### Roadmap

**v3 :  Browser-Side ML**
- Transformers.js + OWLv2 for zero-shot pollution detection in browser
- WebGPU acceleration, no server cost
- Or: Custom MobileNet+YOLO-head ONNX model (~12 MB) via onnxruntime-web

**v4 :  Enhanced Features**
- W&B experiment tracking in Kaggle notebook
- Gradio demo cell in notebook
- YOLO-World bounding box detection (GPU Space tier)
- Push notifications for nearby pollution reports
- Multilingual support (Hindi, Tamil, Bengali)
