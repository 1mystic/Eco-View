# EcoView — AI Agent Handoff Document

**Last Updated:** June 2026  
**Working Directory (Windows):** `d:\synced-pc\1_Work\projects\Ecoview\EcoView`  
**Git Remote:** https://github.com/1mystic/EcoView  
**Live Frontend:** Vercel (deploy from `frontend/`)  
**ML Backend:** HuggingFace Spaces (`ecoview-ml-backend/` folder)

---

## What EcoView Is

Community-powered environmental hazard reporting platform. Citizens photograph pollution incidents → ML classifies them → incidents appear on a live map → NGOs act on them → verified data feeds a retraining loop.

**Zero-cost serverless stack:** Firebase (Auth + Firestore) + HuggingFace Spaces (ML) + Vercel (frontend). No backend server to maintain.

---

## Architecture

```
Browser (React SPA on Vercel)
    │
    ├── Firebase Auth         → sign-in / sign-up / JWT tokens
    ├── Firestore (NoSQL)     → incidents, users, campaigns, invites
    │
    └── HuggingFace Space ──→ FastAPI (ecoview-ml-backend/)
           ├── /inference/classify    → ConvNeXt/MobileNetV3 ONNX or Gemini fallback
           ├── /inference/validate_text
           └── /spatial/...           → clustering, heatmap, hotspot analysis
```

**No PostgreSQL. No Redis. No FastAPI localhost server.** The `backend/` folder exists but is retired. All data goes through Firestore.

---

## Repository Layout

```
EcoView/
├── frontend/                     ← React 19 + Vite SPA (deploy to Vercel)
│   ├── src/
│   │   ├── App.jsx               ← All routes defined here
│   │   ├── config/firebase.js    ← Firebase init (uses env vars)
│   │   ├── styles/ecoview.css    ← Entire design system (2300+ lines, CSS tokens)
│   │   ├── components/
│   │   │   ├── Navbar.jsx        ← App navigation (handles own scroll state)
│   │   │   ├── Footer.jsx        ← Shared footer using .footer CSS class
│   │   │   ├── MobileBottomNav.jsx
│   │   │   ├── RegisterTypeDialog.jsx   ← Individual vs NGO register modal
│   │   │   ├── ReportDetailDialog.jsx   ← Map popup with full report details
│   │   │   ├── StatusBadge.jsx
│   │   │   ├── ChangeStatusSheet.jsx
│   │   │   └── biodiversityHotspots.jsx
│   │   ├── pages/
│   │   │   ├── Home.jsx          ← Landing page (has its own nav + inline footer)
│   │   │   ├── About.jsx         ← Info page (landing-page-style nav + Footer component)
│   │   │   ├── HowToUse.jsx      ← Info page (landing-page-style nav + Footer component)
│   │   │   ├── Contribute.jsx    ← Info page (landing-page-style nav + Footer component)
│   │   │   ├── Privacy.jsx       ← Legal page (uses app-page layout)
│   │   │   ├── Terms.jsx         ← Legal page (uses app-page layout)
│   │   │   ├── Login.jsx         ← Auth page (auth-page layout)
│   │   │   ├── Register.jsx      ← User registration (auth-page layout)
│   │   │   ├── NGORegister.jsx   ← NGO registration (auth-card--wide layout)
│   │   │   ├── UserDashboard.jsx ← User's reports + points (app-page layout)
│   │   │   ├── AdminDashboard.jsx← Incident review + user management (app-page)
│   │   │   ├── Report.jsx        ← Submit incident form (app-page layout)
│   │   │   ├── MapView.jsx       ← Leaflet map of all incidents (app-page)
│   │   │   ├── Campaigns.jsx     ← NGO campaigns list + join (app-page)
│   │   │   ├── Leaderboard.jsx   ← Points leaderboard (app-page)
│   │   │   ├── NGODashboard.jsx  ← NGO campaign management (app-page)
│   │   │   ├── NGOInvite.jsx     ← NGO invite acceptance page
│   │   │   ├── NotFound.jsx      ← 404 page
│   │   │   ├── Map.jsx           ← (older map component, may be unused)
│   │   │   └── (no more pages needed — all footer links now routed)
│   │   ├── utils/
│   │   │   ├── firestoreIncidents.js  ← Firestore CRUD for /incidents collection
│   │   │   ├── firestoreStorage.js    ← Firebase Storage image upload
│   │   │   ├── services.js            ← Higher-level service functions (stats, leaderboard)
│   │   │   ├── api.js                 ← HuggingFace ML API calls only
│   │   │   └── useAuth.js             ← Firebase auth hook
│   │   └── data/
│   │       └── biodiversityHotspots.jsx  ← Static list of Indian biodiversity hotspots
│   ├── package.json              ← pnpm; React 19, react-router, leaflet, firebase, sonner
│   └── vite.config.js
│
├── ecoview-ml-backend/           ← FastAPI ML server (deploy to HuggingFace Spaces)
│   ├── main.py                   ← FastAPI app, CORS, routes
│   ├── core/
│   │   ├── inference.py          ← ONNXStudentClassifier + VLMTeacherValidator (Gemini)
│   │   └── flywheel.py           ← High-confidence data flywheel (saves to Firestore)
│   ├── spatial_analysis/
│   │   └── analyzer.py           ← IDW heatmap, DBSCAN clustering, hotspot analysis
│   ├── requirements.txt
│   └── Dockerfile
│
├── notebooks/
│   └── EcoView_KD_Notebook.ipynb ← Kaggle GPU notebook: ConvNeXt teacher → MobileNetV3 student
│                                    KD training, ONNX export opset 17, INT8 quantization
├── backend/                      ← RETIRED. FastAPI + PostgreSQL. Do not use.
├── DEPLOYMENT_GUIDE.md           ← Firebase + HF Spaces + Vercel deployment steps
└── HANDOFF.md                    ← This file
```

---

## Routes (App.jsx)

| Path | Component | Notes |
|------|-----------|-------|
| `/` | Home | Landing page |
| `/login` | Login | Firebase Auth |
| `/register` | Register | Individual user |
| `/ngo-register` | NGORegister | NGO registration + Cloudinary doc upload |
| `/user-dashboard/:id` | UserDashboard | Protected; shows user's reports + points |
| `/admin` | AdminDashboard | Protected; `role === 'admin'` |
| `/report` | Report | Submit incident form |
| `/map-view` | MapView | Leaflet map + filters |
| `/campaigns` | Campaigns | Public campaign list; join button for authed users |
| `/leaderboard` | Leaderboard | Points leaderboard |
| `/ngo-dashboard` | NGODashboard | Protected; `role === 'ngo'` + approved |
| `/ngo-invite` | NGOInvite | Invite code acceptance |
| `/about` | About | Info page |
| `/how-to-use` | HowToUse | How-to guide |
| `/contribute` | Contribute | Contribution guide |
| `/privacy` | Privacy | Privacy policy |
| `/terms` | Terms | Terms of service |
| `*` | NotFound | 404 |

---

## Design System (ecoview.css — ~2300 lines)

**Never use Tailwind or shadcn on frontend pages.** EcoView has its own CSS token system.

### CSS Custom Properties (tokens)
```css
--green-50 through --green-900   /* primary brand palette */
--surface, --surface-secondary   /* card backgrounds */
--bg, --bg-alt                   /* page backgrounds */
--text-primary, --text-secondary, --text-tertiary
--border
--font-body: 'Plus Jakarta Sans'
--font-display: 'Hanken Grotesk'
```

### Key Layout Classes
| Class | Use |
|-------|-----|
| `.app-page` | Flex column, min-height 100vh — for Navbar+main+Footer pages |
| `.app-page__main` | flex: 1, padding — main content area |
| `.auth-page` | Centered auth layout |
| `.auth-card` | White card, 460px max-width |
| `.auth-card--wide` | 720px max-width (NGORegister) |
| `.container` | Max-width 1280px, centered |
| `.card` | White rounded card with border-shadow |

### Component Classes
- Buttons: `.btn.btn-primary`, `.btn.btn-secondary`, `.btn.btn-outline`, `.btn.btn-sm`, `.btn.btn-lg`
- Badges: `.badge`, `.badge--green`, `.badge--yellow`, `.badge--red`
- Forms: `.auth-field`, `.auth-label`, `.auth-input-wrap`, `.auth-input-icon`, `.auth-input`, `.auth-input-toggle`, `.auth-submit`, `.auth-error`
- Nav: `.nav`, `.nav.scrolled`, `.nav__inner`, `.nav__logo`, `.nav__links`, `.nav__link.active`, `.nav__actions`
- Footer: `.footer`, `.footer__top`, `.footer__brand`, `.footer__logo`, `.footer__desc`, `.footer__column`, `.footer__bottom`, `.footer__legal`
- Page sections: `.section`, `.section--alt`, `.hero`, `.hero__title`, `.hero__desc`, `.hero__actions`
- Home-specific: `.capabilities-grid`, `.feature-grid`, `.tech-grid`, `.about-stat-panel`, `.about-stat`, `.cta-section`

---

## Firestore Data Models

### `/incidents/{id}`
```js
{
  type: string,              // 'Water Discharge' | 'Air Emission' | 'Illegal Dumping' | ...
  description: string,
  photo_base64: string,      // base64 encoded image (no Firebase Storage for incidents)
  photo_url: string|null,    // optional Cloudinary/Storage URL
  latitude: number,
  longitude: number,
  status: string,            // 'pending' | 'classified' | 'verified' | 'resolved' | 'rejected'
  reporter_uid: string,
  reporter_name: string,
  ml_label: string|null,
  ml_confidence: number|null,
  ml_severity: string|null,
  verification_count: number,
  verifiers: string[],       // UIDs
  created_at: Timestamp,
  updated_at: Timestamp
}
```

### `/users/{uid}`
```js
{
  name: string,
  email: string,
  role: string,              // 'user' | 'ngo' | 'admin'
  points: number,
  approvalStatus: string,    // 'approved' | 'pending' | 'rejected' — used for NGOs
  organization?: string,     // NGO name
  documentUrl?: string,      // Cloudinary URL for NGO verification docs
  created_at: Timestamp
}
```

### `/campaigns/{id}`
```js
{
  title: string,
  description: string,
  ngo_uid: string,
  ngo_name: string,
  target_location: string,
  latitude?: number, longitude?: number,
  status: string,            // 'active' | 'completed' | 'cancelled'
  volunteers: string[],      // UIDs
  signup_count: number,
  start_date: Timestamp,
  end_date: Timestamp,
  created_at: Timestamp
}
```

### `/ngo_invites/{id}`
```js
{
  email: string,
  ngoName: string,
  inviteCode: string,
  createdAt: Timestamp,
  accepted: boolean
}
```

---

## ML Pipeline

### Current Production Path (Gemini fallback — works immediately)
`Report.jsx` → base64 image → `ecoview-ml-backend /inference/classify` → Gemini 2.5 Flash (multimodal) → label + severity

### Target Production Path (ONNX student model)
`Report.jsx` → image → HF Space → `ONNXStudentClassifier` (MobileNetV3 Large ONNX) → if confidence < 0.4 → fall back to Gemini

### Knowledge Distillation Notebook (`notebooks/EcoView_KD_Notebook.ipynb`)
- **Teacher:** ConvNeXt Base (pretrained ImageNet)
- **Student:** MobileNetV3 Large
- **Dataset:** TrashNet at `/kaggle/input/datasets/feyzazkefe/trashnet/dataset-resized`
- **Output:** `student_model_quantized.onnx`, `class_mapping.json`
- **Fixed bugs (all applied):**
  - `RandomResizedCrop(size=(IMG_SIZE, IMG_SIZE))` — albumentations 1.4+ API change
  - `torch.load(..., weights_only=True)` — PyTorch 2.4+ FutureWarning / 2.6+ error
  - `BATCH_SIZE = 16` (was 64) — ConvNeXt Base + FP32 + T4 (14.56 GB) OOM at batch=64
  - AMP training via `torch.amp.GradScaler` + `torch.amp.autocast('cuda')` — both teacher (cell-16) and student distillation (cell-22) — halves activation memory, ~1.5x speedup
- **Pinned:** `albumentations>=1.4.0,<2.0.0`

### After Training
1. Download `student_model_quantized.onnx` + `class_mapping.json`
2. Update `ecoview-ml-backend/core/inference.py`: `LABELS` list + `SEVERITY_MAP` dict
3. Add to `requirements.txt`: `onnxruntime`, `numpy`
4. Push to HuggingFace Space

### ML Backend API (ecoview-ml-backend/)
```
POST /inference/classify          { image_url } → { label, confidence, severity, source }
POST /inference/validate_text     { description } → { label, confidence, severity }
POST /spatial/analyze-clusters    { points: [{lat, lng}] } → DBSCAN clusters
POST /spatial/risk-heatmap        { points } → IDW heatmap grid
GET  /health                      → { status: "healthy" }
```

---

## Auth & Role Logic

| Role | Access |
|------|--------|
| Guest | Home, About, HowToUse, Contribute, MapView (read-only), Leaderboard |
| `user` | + Report, UserDashboard, Campaigns (join) |
| `ngo` (approved) | + NGODashboard, create campaigns, mark action taken |
| `admin` | + AdminDashboard, update any incident status |

**Set admin:** Firebase Console → Firestore → `/users/{uid}` → set `role: "admin"` (email: `atharvkahre18@gmail.com`)

**NGO approval flow:** NGO registers → `approvalStatus: 'pending'` → admin sends invite via AdminDashboard → NGO accepts at `/ngo-invite` → `approvalStatus: 'approved'`

---

## Environment Variables

### Frontend (Vercel env vars or `frontend/.env`)
```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_ML_URL=https://your-space.hf.space   # HuggingFace Space URL
```

### HuggingFace Space Secrets
```
GEMINI_API_KEY=...                # Gemini 2.5 Flash API key
ALLOWED_ORIGINS=https://your-vercel-app.vercel.app
```

**Security:** Never hardcode API keys in frontend JS. The Firebase config is public (client SDK uses security rules, not secrecy). Gemini key must only be in HF Space secrets.

---

## Package Manager

**pnpm v11** with `nodeLinker=hoisted` (in `.npmrc`). Run from `frontend/` directory.

```bash
cd frontend
pnpm install
pnpm dev        # dev server
pnpm build      # production build → dist/
```

Build command for Vercel: `pnpm --dir frontend install && pnpm --dir frontend build`

---

## Current State (June 2026)

### Working / Complete
- Full design system (`ecoview.css`) — all pages use it consistently
- Home page (1200+ lines, 15 sections, newsletter, map preview, stats)
- About, HowToUse, Contribute pages — full content
- Privacy, Terms pages — legal content
- Login, Register pages — Firebase Auth
- NGORegister — Firebase Auth + Cloudinary doc upload + Firestore profile
- RegisterTypeDialog — Individual vs NGO modal (no shadcn, EcoView CSS)
- Footer component — unified style matching landing page (`.footer` CSS class)
- Navbar component — shared across app pages
- MobileBottomNav — bottom nav for mobile
- NGOInvite page — invite acceptance flow
- Firestore utils: `firestoreIncidents.js`, `firestoreStorage.js`, `services.js`
- ML backend: Gemini fallback classification works; ONNX model pending trained weights

### Pending / Known Issues
- **ONNX model:** Need to run `EcoView_KD_Notebook.ipynb` on Kaggle T4 GPU, download the ONNX file, update `inference.py`
- **AdminDashboard:** Data source may still partially call legacy API endpoints — verify it reads from Firestore
- **UserDashboard:** Check it loads incidents from `firestoreIncidents.getUserIncidents(uid)` correctly
- **MapView:** Verify it shows real incidents from Firestore (via `services.getAllReports()`)
- **Leaderboard:** Verify it calls `services.getLeaderboard()` → Firestore users orderBy points
- **NGODashboard:** Was empty page — check current state; may need campaign CRUD implementation
- **Campaigns:** Check current state — may need campaign join/list implementation
- **HF Space deployment:** Confirm `GEMINI_API_KEY` and `ALLOWED_ORIGINS` secrets are set

---

## Key Patterns

### App-page layout (for Navbar+content+Footer pages)
```jsx
<div className="app-page">
  <NavBar />
  <main className="app-page__main">
    <div className="container">
      {/* content */}
    </div>
  </main>
  <MobileBottomNav />
  <Footer />
</div>
```

### Auth page layout
```jsx
<div className="auth-page">
  <div className="auth-card">  {/* or auth-card--wide for wider forms */}
    <div className="auth-field">
      <label className="auth-label">...</label>
      <div className="auth-input-wrap">
        <span className="auth-input-icon">...</span>
        <input className="auth-input" />
      </div>
    </div>
    <button className="auth-submit">...</button>
    {error && <div className="auth-error">{error}</div>}
  </div>
</div>
```

### Static info pages (About/HowToUse/Contribute pattern)
```jsx
// These have their own landing-page-style nav (NOT NavBar component)
// but DO use the shared Footer component
return (
  <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
    <nav className={`nav${scrolled ? ' scrolled' : ''}`}>...</nav>
    <main style={{ flex: 1 }}>
      {/* sections */}
    </main>
    <Footer />
  </div>
);
```

### Firestore incident query (composite index workaround)
```js
// DON'T: where('reporter_uid', '==', uid) + orderBy('created_at', 'desc')
// — requires Firestore composite index
// DO: query with where() only, sort client-side:
const q = query(collection(db, 'incidents'), where('reporter_uid', '==', uid));
const snaps = await getDocs(q);
return snaps.docs
  .map(d => ({ id: d.id, ...d.data() }))
  .sort((a, b) => b.created_at?.seconds - a.created_at?.seconds);
```

---

## Git State (June 2026)
Branch: `main`. All UI redesigns committed. Key recent commits:
- `refactor: NGOInvite page — replace shadcn/dark glass with EcoView design system`
- `chore: remove .claude/ from tracking + add to .gitignore`
