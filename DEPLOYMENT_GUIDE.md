# EcoView Production Deployment Guide

> **TL;DR — No Render/Railway needed.** The app can run fully on Firebase (Auth + Firestore + Storage) + Vercel + Hugging Face Spaces. Zero paid services.

---

## Architecture (Zero-Cost, No Server Required)

```
[React Frontend]  ──── Vercel (free)
       │
       ├──> Firebase Auth        login, register, session tokens
       ├──> Firestore            all incident data, user profiles, leaderboard
       ├──> Firebase Storage     photo uploads
       └──> Hugging Face Space   ML classification + spatial analytics
                  │
                  └──> Gemini API  VLM teacher fallback
```

---

## What You Need From Scratch

### Step 1 — Firebase Project Setup (10 min)

1. Go to [console.firebase.google.com](https://console.firebase.google.com) → **Add Project**
2. Enable **Authentication** → Sign-in methods → enable **Email/Password**
3. Enable **Firestore Database** → Start in production mode → choose region nearest to your users (e.g. `asia-south1` for India)
4. Enable **Storage** → Start in production mode
5. Go to **Project Settings** → **Your Apps** → **Web App** → register app → copy the config block

Your config will look like:
```javascript
const firebaseConfig = {
  apiKey: "...",
  authDomain: "ecoview-xyz.firebaseapp.com",
  projectId: "ecoview-xyz",
  storageBucket: "ecoview-xyz.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

6. Set **Firestore Security Rules** — go to Firestore → Rules → paste:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == uid;
    }
    match /incidents/{id} {
      allow read: if true;
      allow create: if true;
      allow update: if request.auth != null && (
        resource.data.reporter_uid == request.auth.uid ||
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'
      );
    }
  }
}
```

7. Set **Storage Rules** — go to Storage → Rules → paste:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /incidents/{allPaths=**} {
      allow read: if true;
      allow write: if request.resource.size < 10 * 1024 * 1024
                   && request.resource.contentType.matches('image/.*');
    }
  }
}
```

---

### Step 2 — Google Gemini API Key (2 min)

1. Go to [aistudio.google.com](https://aistudio.google.com)
2. Sign in → click **Get API Key** → **Create API Key**
3. Copy the key — you will use it in the next step as `GEMINI_API_KEY`

---

### Step 3 — Deploy ML Microservice to Hugging Face (15 min)

1. Sign up at [huggingface.co](https://huggingface.co)
2. Click **+** (top right) → **New Space**
3. Settings:
   - **Space name**: `ecoview-ml`
   - **SDK**: `Docker`
   - **Hardware**: `CPU Basic (Free)`
   - **Visibility**: `Public`
4. Click **Create Space** — it creates a git repo
5. Upload these files from `EcoView/ecoview-ml-backend/` into the Space repo (use the web UI or `git push`):
   - `Dockerfile`
   - `main.py`
   - `requirements.txt`
   - `core/` folder (all 4 files)
   - `spatial_analysis/` folder (all 3 files)
6. Go to **Settings** tab in the Space → **Variables and Secrets**:
   - Add **Secret**: `GEMINI_API_KEY` = `[your key from Step 2]`
   - Add **Variable**: `ALLOWED_ORIGINS` = `https://ecoview.vercel.app` (update after Step 4)
7. Wait ~3 min for the Docker build to complete. Your Space URL will be:
   `https://YOUR-USERNAME-ecoview-ml.hf.space`
8. Test it: `https://YOUR-USERNAME-ecoview-ml.hf.space/health` should return `{"status":"healthy",...}`

---

### Step 4 — Deploy Frontend to Vercel (5 min)

1. Push your code to GitHub (the `EcoView/` folder as the repo root)
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → import your GitHub repo
3. Configure:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `pnpm build`
   - **Output Directory**: `dist`
4. Add **Environment Variables** (from your Firebase config in Step 1):

| Variable | Value |
|---|---|
| `VITE_FIREBASE_API_KEY` | From Firebase project config |
| `VITE_FIREBASE_AUTH_DOMAIN` | e.g. `ecoview-xyz.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | e.g. `ecoview-xyz` |
| `VITE_FIREBASE_STORAGE_BUCKET` | e.g. `ecoview-xyz.appspot.com` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | From Firebase config |
| `VITE_FIREBASE_APP_ID` | From Firebase config |
| `VITE_ML_URL` | Your Hugging Face Space URL from Step 3 |

5. Click **Deploy** → your frontend is live at `https://ecoview.vercel.app` (or similar)
6. Go back to Hugging Face Space Settings → update `ALLOWED_ORIGINS` with your actual Vercel URL

---

## What Is NOT Needed (can ignore)

| Service | Why not needed |
|---|---|
| Supabase / PostgreSQL | Firebase Firestore replaces it |
| Redis (Upstash) | No caching layer needed at this scale |
| Cloudflare R2 | Firebase Storage replaces it |
| Render / Railway / Fly.io | No backend server needed |
| Firebase Admin SDK | Only needed server-side — unused now |

---

## Final Checklist Before Going Live

- [ ] Firebase Auth enabled (Email/Password)
- [ ] Firestore database created with security rules above
- [ ] Firebase Storage enabled with image rules above
- [ ] Gemini API key obtained
- [ ] Hugging Face Space deployed and `/health` returns 200
- [ ] Vercel project deployed with all 7 env vars set
- [ ] `ALLOWED_ORIGINS` on HF Space updated to Vercel URL
- [ ] Test: register → login → submit report → verify map shows pin
