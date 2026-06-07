ile# EcoView — ML Deployment & Architecture Plan

**Date:** June 2026  
**Status:** Active  
**Author:** EcoView team

---

## 1. Root Cause of Current HF Space Failure

The logs show the app starts fine every time:

```
INFO: Uvicorn running on http://0.0.0.0:8000
INFO: Application startup complete.
INFO: Shutting down         ← HF kills it
```

**The bug is a port mismatch.** HuggingFace Docker Spaces health-check port **7860** by default. Our Dockerfile exposes and binds port **8000**. HF's load balancer cannot reach the app → health check fails → HF sends SIGTERM → restart loop → "not healthy after 30 min."

### Immediate Fix

Change `Dockerfile` and `CMD`:
```dockerfile
EXPOSE 7860
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
```

Also update `VITE_ML_URL` usage: the Space URL (`mozoj4-ecoview-ml.hf.space`) already serves on 443/80 externally — the port change is internal only.

---

## 2. Current ML Backend — Problem Analysis

The current backend (`ecoview-ml-backend/`) installs:

| Package | Size | Actually used? |
|---|---|---|
| `onnxruntime` | ~50 MB wheel | Only if `.onnx` model file present |
| `scipy` | ~35 MB wheel | Spatial interpolation |
| `libpysal` | ~15 MB + deps | Moran's I clustering |
| `esda` | ~5 MB | Moran's I clustering |
| `pandas` | ~20 MB | Spatial analysis |
| `shapely` | ~10 MB | Proximity queries |

**Total cold start time:** 3–5 min on free CPU tier (memory + import time).  
**Classification without ONNX model:** falls through to Gemini VLM anyway.  
**Spatial endpoints** (`/spatial/analyze-clusters`, `/spatial/risk-heatmap`): not currently called by the frontend.

**Conclusion:** The heavy deps add startup time and memory pressure but provide no user-visible benefit in v1. The only dep that matters right now is the Gemini VLM path (`httpx` + `pillow`).

---

## 3. ML Strategy — Options

### Option A: Keep current backend, fix port + slim deps (Recommended for v1)

Remove all heavy packages that aren't called by the frontend. Keep only what's needed for Gemini VLM classification.

**Slim `requirements.txt`:**
```
fastapi>=0.115
uvicorn[standard]>=0.30
httpx>=0.27.0
pillow>=10.3.0
python-dotenv>=1.0.0
```

**Result:** Container starts in <20s, always reliable, no memory pressure.  
**Classification:** Gemini 3.1 Flash-Lite via REST API (free tier: 1,500 req/day, 1M tokens/day).  
**Cost:** $0.

### Option B: YOLO-World (zero-shot object detection)

Tencent's open-vocabulary YOLO variant. Pass plain-text labels at inference time — no training needed.

```python
model = YOLOWorld(model_id="yolo_world/m")
model.set_classes(["industrial smoke", "plastic waste pile", "oil spill on water"])
results = model.infer(image)
```

**Pros:** No training, open vocabulary, bounding boxes, fast on GPU.  
**Cons:**
- HF free CPU tier: ~2–5 seconds per image (too slow)
- `ultralytics` + `inference` packages: ~200 MB install
- GPU needed for real-time use (paid tier)

**Verdict:** Good for v3 if we upgrade to a paid GPU Space. Not viable free tier.

### Option C: Transformers.js + OWLv2 in the browser (client-side)

Run zero-shot object detection entirely in the user's browser via WebGPU:

```js
import { pipeline } from '@huggingface/transformers';
const detector = await pipeline('zero-shot-object-detection', 'Xenova/owlvit-base-patch32', {
  device: 'webgpu'
});
const results = await detector(imageUrl, ['smoke', 'garbage pile', 'plastic in water']);
```

**Pros:** Zero server cost, works offline after first load, bounding boxes, privacy-preserving.  
**Cons:**
- First load: ~150–300 MB model download
- Requires WebGPU (Chrome 113+, no Firefox, no Safari <17)
- Falls back to CPU which is slow (~2s/image)

**Verdict:** Excellent for v3 as a progressive enhancement. Too many users lack WebGPU in 2026 to make it the primary path.

### Option D: Custom MobileNetV2 + YOLO Head → ONNX → WebGPU (v2 target)

Train a tiny custom detector via pseudo-labeling (Gemini auto-labels 500 images → train nano YOLO head on MobileNetV2 backbone → export ~12 MB ONNX). Load in browser with `onnxruntime-web`.

**Pros:** 15 ms inference, works offline, ~12 MB, no server, impressive for portfolio.  
**Cons:** Requires a full training run (Kaggle notebook already written for classification; detection head needs separate work).

**Verdict:** Best long-term direction. Plan for v3.

### Option E: Direct Gemini call from frontend (no HF Space for ML)

Call Gemini 3.1 Flash-Lite directly from the React frontend using the API key as an env var.

```js
const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=KEY', {
  method: 'POST',
  body: JSON.stringify({ contents: [{ parts: [{ text: prompt }, { inlineData: { mimeType: 'image/jpeg', data: base64 } }] }] })
});
```

**Pros:** No HF Space needed for ML, instant, no cold starts.  
**Cons:** API key exposed in client bundle — **security risk**. Never put API keys in frontend JS.

**Verdict:** Only viable via a proxy (which is what the HF Space already is). Don't do direct frontend calls.

---

## 4. Recommended Architecture: v1 → v2 → v3

```
v1 (NOW — ship this week)
────────────────────────
Frontend (Vercel) ──base64──► HF Space (slim FastAPI)
                                    │
                                    ▼
                             Gemini 3.1 Flash-Lite
                             structured JSON output
                             (label, confidence, severity, reason)
                                    │
                                    ▼
                         Update Firestore incident doc
                         ml_label / ml_confidence / ml_severity

HF Space deps: fastapi, uvicorn, httpx, pillow, python-dotenv (~15 MB total)
Cold start: <15 seconds
Cost: $0

v2 (after Kaggle notebook run)
────────────────────────────────
Same as v1 but:
- Upload student_model_quantized.onnx to HF Space
- Add onnxruntime back to requirements
- ONNX handles 85%+ confident cases; Gemini handles the rest
- Auto data flywheel: low-confidence images logged for next distillation round

v3 (future — in-browser)
────────────────────────
- Transformers.js OWLv2 for bounding box detection in browser
- OR: custom MobileNet+YOLO head ONNX in browser via onnxruntime-web + WebGPU
- HF Space becomes optional fallback only
```

---

## 5. Implementation — v1 Fixes (Priority Order)

### 5.1 Fix HF Space port (BLOCKING — do this first)

File: `ecoview-ml-backend/Dockerfile`
```dockerfile
EXPOSE 7860
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
```

### 5.2 Slim down dependencies

File: `ecoview-ml-backend/requirements.txt`
```
fastapi>=0.115
uvicorn[standard]>=0.30
httpx>=0.27.0
pillow>=10.3.0
python-dotenv>=1.0.0
```

Remove: `scipy`, `libpysal`, `esda`, `shapely`, `pandas`, `onnxruntime` for now.  
The spatial endpoints (`/spatial/*`) return graceful 503 if deps missing — frontend doesn't call them.

### 5.3 Update Dockerfile for slim build

```dockerfile
FROM python:3.12-slim
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends gcc && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && pip install --no-cache-dir -r requirements.txt
COPY . .
ENV PYTHONUNBUFFERED=1
EXPOSE 7860
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
```

### 5.4 Update VITE_ML_URL in Vercel

No change needed — the external URL `https://mozoj4-ecoview-ml.hf.space` doesn't include port.  
But update `ALLOWED_ORIGINS` HF secret to include your final Vercel URL.

### 5.5 Make spatial endpoints graceful without heavy deps

`core/inference.py` and spatial modules: wrap imports in try/except, return `{"error": "spatial deps not installed", "mode": "unavailable"}` if missing. Frontend already doesn't call these in v1.

---

## 6. ML Classification Flow (v1)

```
User submits report with photo
          │
          ▼
Frontend compresses image → base64 data URL (canvas, max 800px, JPEG 78%)
          │
          ▼
createIncident() → save to Firestore (photo_data field, ~50-120 KB base64)
          │
          ├──► awardReportPoints() (10 pts to reporter)
          │
          └──► fire-and-forget: POST mozoj4-ecoview-ml.hf.space/inference/classify
                    body: { image_base64: "data:image/jpeg;base64,..." }
                          │
                          ▼
                    HF Space (FastAPI)
                    fallback_validator.py decodes base64 → PIL Image → bytes
                    → Gemini 3.1 Flash-Lite REST API
                      prompt: "Classify this image. Is it pollution?"
                      response_schema: { is_pollution, category, confidence, reason }
                          │
                          ▼
                    if success → updateIncidentML(incidentId, { ml_label, ml_confidence, ml_severity })
                    if fail   → silently skip (report still submitted successfully)
```

**Rate limits:** Gemini free tier = 1,500 req/day, 1M tokens/day. For a student project with <100 daily reports, this is effectively unlimited.

---

## 7. Kaggle Notebook Plan (v2 ML)

The distillation notebook (`notebooks/EcoView_KD_Notebook.ipynb`) is fully written and covers:
- TrashNet dataset (6 classes: cardboard, glass, metal, paper, plastic, trash)
- ConvNeXt Base teacher → MobileNetV3 Large student
- Knowledge distillation (CE + KL, T=4.0, α=0.7)
- ONNX opset 17 export → onnxsim → INT8 quantization
- Full benchmarking + confusion matrices

**To run:** Upload to Kaggle, attach TrashNet dataset, run all cells. Takes ~1 hour on T4 GPU.

**After running:** Download `student_model_quantized.onnx` and `class_mapping.json`.  
Upload `student_model_quantized.onnx` to HF Space → add `onnxruntime` back to requirements.

**Label alignment:** TrashNet classes don't match EcoView's pollution categories. After training, update `LABELS` and `SEVERITY_MAP` in `core/inference.py` to match `class_mapping.json` output.

---

## 8. Frontend ML Integration (already implemented)

`frontend/src/pages/Report.jsx`:
```js
// After createIncident() and awardReportPoints():
const ML_URL = import.meta.env.VITE_ML_URL;
if (ML_URL && photo_data) {
  (async () => {
    try {
      const res = await fetch(`${ML_URL}/inference/classify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_base64: photo_data }),
      });
      if (res.ok) {
        const ml = await res.json();
        await updateIncidentML(incidentId, {
          ml_label: ml.label,
          ml_confidence: ml.confidence,
          ml_severity: ml.severity,
        });
      }
    } catch { /* ML is best-effort, never block user flow */ }
  })();
}
```

ML result appears in:
- Map popup (`ReportDetailDialog`) → AI Classification section
- Admin dashboard → badge showing label + confidence
- User dashboard → their report cards

---

## 9. What's Not Worth Doing (for v1)

| Idea | Why skip |
|---|---|
| YOLO-World on HF free CPU | 2–5s latency, too slow |
| Direct Gemini from frontend | API key exposed in JS bundle |
| Browser WebGPU OWLv2 | 150–300 MB first load, no Firefox |
| Self-hosted Ollama | Requires a server (not free) |
| MLflow / W&B in notebook | Adds complexity; good for v2 notebook enhancement |

---

## 10. Deployment Checklist (Current State)

- [x] Firebase Auth (Email/Password enabled)
- [x] Firestore rules deployed
- [x] Frontend deployed to Vercel
- [x] All 10 bugs fixed (see DEPLOY.md)
- [x] HF Space repo created (mozoj4/ecoview-ml)
- [x] Backend code pushed to HF Space
- [ ] **Fix HF Space port → 7860** ← BLOCKING
- [ ] Set GEMINI_API_KEY secret in HF Space
- [ ] Set ALLOWED_ORIGINS secret in HF Space (your Vercel URL)
- [ ] Verify /health endpoint returns 200
- [ ] Run Kaggle notebook → upload ONNX model (v2)
