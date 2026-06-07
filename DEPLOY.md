# EcoView — Deployment Playbook

Complete step-by-step guide to go from code to live production app.
**Estimated time: 25–40 minutes.**

---

## What You Are Deploying

| Service | Host | Cost |
|---|---|---|
| Frontend (React + Vite) | Vercel | Free |
| Auth + Database | Firebase (Spark plan) | Free |
| ML Backend (FastAPI) | HuggingFace Spaces | Free |

Firebase Storage is **not used** — photos are stored as compressed base64 in Firestore.

---

## Pre-Deployment Checklist

Before starting, have these ready:

- [ ] Firebase project created at console.firebase.google.com
- [ ] Your Firebase project ID (e.g. `clearview-df6cd`)
- [ ] Your Firebase web app API keys (from Project Settings → Your apps)
- [ ] A HuggingFace account (huggingface.co)
- [ ] A Vercel account (vercel.com) — connect via GitHub
- [ ] Your GitHub repo pushed and up to date
- [ ] (Optional) A Gemini API key from aistudio.google.com — enables real ML classification

---

## STEP 1 — Firebase Console Setup

Go to: **https://console.firebase.google.com** → select your project

### 1a. Enable Email/Password Authentication

```
Authentication → Sign-in method → Email/Password → toggle ON → Save
```

### 1b. Apply Firestore Security Rules

```
Firestore Database → Rules → paste the rules below → Publish
```

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

### 1c. Create Your Admin User's Firestore Document

If you already registered via email (before rules were deployed), your `/users/{uid}` document may not exist. Create it manually:

```
Firestore Database → Data → Start collection: "users"
→ Add document with ID = your Firebase Auth UID
```

**Fields to set:**

| Field | Type | Value |
|---|---|---|
| `uid` | string | your Firebase Auth UID |
| `name` | string | Your Name |
| `email` | string | your@email.com |
| `role` | string | `admin` |
| `points` | number | `0` |
| `approvalStatus` | null | — |
| `createdAt` | timestamp | (now) |

**How to find your Firebase Auth UID:**
```
Authentication → Users → copy the "User UID" column for your email
```

### 1d. Add Authorised Domains (after Vercel deploy)

```
Authentication → Settings → Authorised domains → Add domain
```

Add your Vercel URL (e.g. `ecoview.vercel.app`) and any custom domain.

---

## STEP 2 — HuggingFace Space (ML Backend)

The ML backend provides image classification and spatial analytics. It works with or without a trained ONNX model:

- **With ONNX model**: fast real inference (<200ms)
- **With Gemini API key only**: deep-thinking VLM classification (slower, but real)
- **Without either**: simulator mode (random plausible outputs — fine for demo/v1)

### 2a. Create the Space

1. Go to https://huggingface.co/new-space
2. Set:
   - **Space name**: `ecoview-ml`
   - **SDK**: Docker
   - **Hardware**: CPU Basic (free)
   - **Visibility**: Public

### 2b. Push the ML Backend Code

Push everything inside `ecoview-ml-backend/` to the Space:

```bash
# Clone the empty space
git clone https://huggingface.co/spaces/YOUR_USERNAME/ecoview-ml

# Copy backend files into it
cp -r ecoview-ml-backend/* ecoview-ml/

# Commit and push
cd ecoview-ml
git add .
git commit -m "deploy ecoview ml backend"
git push
```

Or use the HuggingFace web UI to upload files directly.

Files needed in the Space root:
```
Dockerfile
main.py
requirements.txt
core/
spatial_analysis/
```

### 2c. Set Space Secrets

```
Space page → Settings → Variables and secrets → New secret
```

| Secret Name | Value |
|---|---|
| `GEMINI_API_KEY` | Your Gemini key from aistudio.google.com |
| `ALLOWED_ORIGINS` | `https://your-app.vercel.app,http://localhost:5173` |

### 2d. Wait for Build (~3-5 minutes)

Space URL will be: `https://YOUR_USERNAME-ecoview-ml.hf.space`

Test it:
```bash
curl https://YOUR_USERNAME-ecoview-ml.hf.space/health
```

Expected response:
```json
{
  "status": "healthy",
  "components": {
    "student_classifier": { "mode": "simulator" },
    "teacher_validator": { "has_api_key": true }
  }
}
```

---

## STEP 3 — Environment Variables

Edit `frontend/.env` (create if it doesn't exist):

```env
# Firebase — from Firebase Console → Project Settings → Your apps
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abc123

# ML Backend — HuggingFace Space URL from Step 2
VITE_ML_URL=https://YOUR_USERNAME-ecoview-ml.hf.space
```

---

## STEP 4 — Deploy Frontend to Vercel

### Option A — Vercel Dashboard (recommended)

1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Configure:

| Setting | Value |
|---|---|
| **Root Directory** | `frontend` |
| **Framework Preset** | Vite |
| **Build Command** | `node node_modules/vite/bin/vite.js build` |
| **Output Directory** | `dist` |

4. Add environment variables — paste all 7 from Step 3
5. Click **Deploy**

### Option B — Vercel CLI

```bash
cd frontend
npx vercel --prod
# When prompted:
#   Root: ./
#   Build: node node_modules/vite/bin/vite.js build
#   Output: dist
```

Then add env vars:
```bash
npx vercel env add VITE_FIREBASE_API_KEY production
# ... repeat for all 7 vars
```

---

## STEP 5 — Post-Deploy Verification Checklist

Run through each item after deployment:

| # | Test | Expected result |
|---|---|---|
| 1 | Visit `https://your-app.vercel.app` | Home page loads, no console errors |
| 2 | Click "Sign In" in navbar | Navigates to `/login` (no page reload) |
| 3 | Sign in with your email | Navigates to `/admin` (if you set role=admin) |
| 4 | Sign in with wrong password | Shows "Incorrect password." error message |
| 5 | Register a new account | Navigates to dashboard; doc appears in Firestore |
| 6 | Submit a report at `/report` | Report appears in Firestore `incidents` collection |
| 7 | Open `/map-view` | Map renders, markers visible (may be empty if no reports yet) |
| 8 | Open `/campaigns` | Campaign list renders (empty initially is fine) |
| 9 | Admin dashboard | `/admin` shows incidents by status tab |
| 10 | ML backend | `curl https://USERNAME-ecoview-ml.hf.space/health` returns 200 |

---

## Code Fixes Applied (What Was Broken and Why)

These were fixed before this deployment — listed here so you know the app is production-ready.

| What was broken | How it was fixed |
|---|---|
| All toast notifications were silent | Added `<Toaster>` to App.jsx |
| Sign-in showed "Invalid email or password" even with correct credentials | Separated Firebase Auth and Firestore calls into independent try-catch blocks |
| Registration showed "failed" if Firestore rules blocked the profile write | Firestore write is now best-effort; auth always succeeds independently |
| NGO registration: email missing from Firestore doc | Added `email` field to setDoc call |
| Navbar nav links hidden for users without a Firestore document | Fallback user object now includes `id` field |
| `<a href="/login">` in Report page caused full page reload | Changed to `<Link to="/login">` |
| MapView sparkline last week always showed 0 | Fixed 6-week bucket formula to end at `now` |
| Firebase Storage imported but not used (dead code) | Removed from firebase.js |

---

## ML Model Status

The backend runs in **Gemini VLM mode** (if API key set) or **simulator mode** (if no key) for v1.

### Current Limitation

Submitted photos are stored as base64 data URLs in Firestore. The `/inference/classify` endpoint currently expects an HTTP URL. This means ML classification does not run automatically after report submission in v1.

### Plan for v2

1. Train a proper ONNX model on pollution-specific dataset (see `notebooks/EcoView_KD_Notebook.ipynb`)
2. Update `/inference/classify` to accept base64 directly (or re-upload to a temp URL)
3. Re-enable `classifyImage()` call in `Report.jsx` after submit
4. Update backend `LABELS` + `SEVERITY_MAP` to match trained model classes

---

## Local Dev Reference

```bash
cd frontend

# Install
pnpm install

# Dev server (http://localhost:5173)
node node_modules/vite/bin/vite.js

# Production build (test locally before pushing)
node node_modules/vite/bin/vite.js build

# Preview production build
node node_modules/vite/bin/vite.js preview
```

> **Why not `pnpm run build`?**
> pnpm v11's pre-run dependency check fails on exFAT (D:) drives due to symlink restrictions.
> On Vercel (Linux/ext4) `pnpm run build` works fine. This is a local-only limitation.

```bash
# ML backend
cd ecoview-ml-backend
.venv/Scripts/activate
set GEMINI_API_KEY=your_key
uvicorn main:app --reload --port 8080
```

---

## Rollback

If something breaks after deployment, the fastest rollback is via Vercel:

```
Vercel Dashboard → Deployments → previous deployment → ⋯ → Promote to Production
```

Firestore data is not affected by frontend re-deploys.
